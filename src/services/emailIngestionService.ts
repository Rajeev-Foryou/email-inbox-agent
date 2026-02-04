import { EmailClient } from '../email/emailClient.js';
import { getAgent } from '../agents/index.js';
import { EmailRepository } from '../db/emailRepository.js';
import { EmailSchema } from '../types/email.js';
import { createChildLogger } from '../utils/logger.js';
import { metrics, METRICS } from '../utils/metrics.js';
import { alerting, ALERTS } from '../utils/alerting.js';

const logger = createChildLogger('EmailIngestionService');

export class EmailIngestionService {
  private emailClient: EmailClient;
  private agent: ReturnType<typeof getAgent>;
  private emailRepository: EmailRepository;
  private duplicateAlertSent: boolean = false;

  constructor(emailClient?: EmailClient, agent?: ReturnType<typeof getAgent>, emailRepository?: EmailRepository) {
    this.emailClient = emailClient ?? new EmailClient();
    this.agent = agent ?? getAgent();
    this.emailRepository = emailRepository ?? new EmailRepository();
  }

  async ingestAndClassifyUnseenEmails(): Promise<void> {
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    try {
      await this.emailClient.connect();
      const emails = await this.emailClient.fetchUnseenEmails();
      
      // Apply backpressure: limit max emails processed per run
      const MAX_EMAILS_PER_RUN = 100;
      if (emails.length > MAX_EMAILS_PER_RUN) {
        logger.warn(
          { total: emails.length, processing: MAX_EMAILS_PER_RUN },
          'Limiting emails processed per run to prevent overload'
        );
      }
      const emailsToProcess = emails.slice(0, MAX_EMAILS_PER_RUN);
      
      metrics.incrementCounter(METRICS.EMAILS_FETCHED, emails.length);

      for (const email of emailsToProcess) {
        const uid = typeof (email as any).uid === 'number' ? (email as any).uid : null;

        const parsed = EmailSchema.safeParse(email);
        if (!parsed.success) {
          logger.warn({ email, errors: parsed.error.errors }, 'Invalid email shape, skipping');
          continue;
        }

        // Check if UID already processed (idempotency)
        if (uid !== null && uid > 0) {
          const alreadyProcessed = await this.emailRepository.isUidProcessed('INBOX', uid);
          if (alreadyProcessed) {
            logger.debug({ uid, messageId: parsed.data.messageId }, 'UID already processed, skipping');
            continue;
          }
        }

        // Classify and store each email independently; continue on errors
        try {
          const classifyStart = Date.now();
          const classification = await this.agent.classifyEmail(parsed.data);
          metrics.recordHistogram(METRICS.CLASSIFICATION_DURATION, Date.now() - classifyStart);

          // Truncate email body to prevent DB bloat
          const MAX_BODY_LENGTH = 10000;
          let bodyToStore = parsed.data.body;
          if (bodyToStore.length > MAX_BODY_LENGTH) {
            bodyToStore = bodyToStore.substring(0, MAX_BODY_LENGTH) + '... [truncated]';
            logger.debug({ messageId: parsed.data.messageId, originalLength: parsed.data.body.length }, 'Email body truncated');
          }

          try {
            const dbStart = Date.now();
            await this.emailRepository.create({
              ...parsed.data,
              body: bodyToStore,
              imapUid: (email as any).uid || null,
              imapMailbox: 'INBOX',
              labels: Array.isArray(classification.labels) ? (classification.labels as string[]) : [],
              priority: typeof classification.priority === 'string' ? classification.priority : '',
              suggestedAction: typeof classification.suggestedAction === 'string' ? classification.suggestedAction : '',
              processedAt: new Date(),
            });
            metrics.recordHistogram(METRICS.DB_WRITE_DURATION, Date.now() - dbStart);
            processedCount++;
            metrics.incrementCounter(METRICS.EMAILS_PROCESSED);

            // Mark message seen only after successful persistence
            try {
              if (uid !== null && uid > 0) {
                await this.emailClient.markAsSeen(uid);
              } else {
                logger.warn({ messageId: parsed.data.messageId }, 'Email has no valid UID, cannot mark as seen');
              }
            } catch (markErr) {
              logger.error({ err: markErr, messageId: parsed.data.messageId }, 'Failed to mark message as seen after save');
            }

          } catch (dbErr: any) {
            // Handle unique constraint (duplicate messageId) and continue
            if (dbErr?.code === 'P2002' || (dbErr?.meta && Array.isArray(dbErr.meta.target) && dbErr.meta.target.includes('messageId'))) {
              logger.warn({ messageId: parsed.data.messageId }, 'Duplicate messageId detected, skipping insert');
              duplicateCount++;
              metrics.incrementCounter(METRICS.EMAILS_DUPLICATE);
              
              if (duplicateCount > 10 && !this.duplicateAlertSent) {
                await alerting.sendAlert(
                  ALERTS.DUPLICATE_THRESHOLD,
                  'warning',
                  'High number of duplicate emails detected',
                  { count: duplicateCount }
                );
                this.duplicateAlertSent = true;
              } else if (duplicateCount <= 10) {
                this.duplicateAlertSent = false;
              }
              // mark as seen to avoid reprocessing
              try {
                if (uid !== null && uid > 0) {
                  await this.emailClient.markAsSeen(uid);
                }
              } catch (markErr) {
                logger.error({ err: markErr, messageId: parsed.data.messageId }, 'Failed to mark duplicate message as seen');
              }
              continue;
            }
            logger.error({ err: dbErr, messageId: parsed.data.messageId }, 'DB error saving email, skipping');
            failedCount++;
            metrics.incrementCounter(METRICS.EMAILS_FAILED, 1, { reason: 'db_error' });
            continue;
          }
        } catch (err: any) {
          // Classification or network error - log and continue
          failedCount++;
          if (err?.isAxiosError) {
            logger.error({
              err,
              messageId: parsed.data.messageId,
              status: err?.response?.status,
              errorCode: err?.code,
              responseBodyRedacted: true,
            }, 'Classification request failed (axios), skipping email');
            metrics.incrementCounter(METRICS.EMAILS_FAILED, 1, { reason: 'classification_error' });
            
            if (err?.code === 'ETIMEDOUT') {
              await alerting.sendAlert(
                ALERTS.CLASSIFICATION_TIMEOUT,
                'warning',
                'Classification API timeout',
                { messageId: parsed.data.messageId }
              );
            }
          } else {
            logger.error({ err, messageId: parsed.data.messageId }, 'Error classifying/storing email, skipping');
            metrics.incrementCounter(METRICS.EMAILS_FAILED, 1, { reason: 'unknown_error' });
          }
          continue;
        }
      }

      // Record overall ingestion metrics
      const duration = Date.now() - startTime;
      metrics.recordHistogram(METRICS.INGESTION_DURATION, duration);
      
      logger.info(
        { processedCount, failedCount, duplicateCount, durationMs: duration },
        'Email ingestion cycle completed'
      );

      // Alert on high error rate
      const totalAttempted = processedCount + failedCount;
      if (totalAttempted > 0 && failedCount / totalAttempted > 0.5) {
        await alerting.sendAlert(
          ALERTS.HIGH_ERROR_RATE,
          'critical',
          'High error rate during email ingestion',
          { failedCount, totalAttempted, errorRate: failedCount / totalAttempted }
        );
      }
    } finally {
      // Always close IMAP connection to prevent resource leak
      try {
        this.emailClient.end();
        logger.debug('IMAP connection closed');
      } catch (endErr) {
        logger.error({ err: endErr }, 'Error closing IMAP connection');
      }
    }
  }
}
