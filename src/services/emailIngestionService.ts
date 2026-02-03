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

    await this.emailClient.connect();
    const emails = await this.emailClient.fetchUnseenEmails();
    
    metrics.incrementCounter(METRICS.EMAILS_FETCHED, emails.length);

    for (const email of emails) {
      const parsed = EmailSchema.safeParse(email);
      if (!parsed.success) {
        logger.warn({ email, errors: parsed.error.errors }, 'Invalid email shape, skipping');
        continue;
      }

      // Check if UID already processed (idempotency)
      const uid = (email as any).uid;
      if (typeof uid === 'number' && uid > 0) {
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

        try {
          const dbStart = Date.now();
          await this.emailRepository.create({
            ...parsed.data,
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
            // original fetch returns uid on the raw email object
            const uid = (email as any).uid;
            if (typeof uid === 'number' && uid > 0) {
              await this.emailClient.markAsSeen(uid);
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
            
            if (duplicateCount > 10) {
              await alerting.sendAlert(
                ALERTS.DUPLICATE_THRESHOLD,
                'warning',
                'High number of duplicate emails detected',
                { count: duplicateCount }
              );
            }
            // mark as seen to avoid reprocessing
            try {
              const uid = (email as any).uid;
              if (typeof uid === 'number' && uid > 0) {
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
            responseData: err?.response?.data,
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
  }
}
