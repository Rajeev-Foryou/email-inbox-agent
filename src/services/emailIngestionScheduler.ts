import cron from 'node-cron';
import { EmailIngestionService } from './emailIngestionService.js';
import { createChildLogger } from '../utils/logger.js';
import { alerting, ALERTS } from '../utils/alerting.js';

const logger = createChildLogger('EmailIngestionScheduler');

let task: any = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export function startScheduler(cronExpr = '*/5 * * * *') {
  if (task) task.stop();
  // Reset failure counter on scheduler start
  consecutiveFailures = 0;
  task = cron.schedule(cronExpr, async () => {
    logger.info('Running scheduled email ingestion');
    try {
      // Instantiate service lazily inside the cron callback, after env vars are loaded
      const ingestionService = new EmailIngestionService();
      await ingestionService.ingestAndClassifyUnseenEmails();
      logger.info('Email ingestion completed');
      
      // Reset failure counter on success
      consecutiveFailures = 0;
    } catch (err) {
      consecutiveFailures++;
      logger.error({ err, consecutiveFailures }, 'Error during email ingestion');
      
      // Send alert on consecutive failures (wrapped in try-catch to prevent cascading failures)
      try {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          await alerting.sendAlert(
            ALERTS.INGESTION_CONSECUTIVE_FAILURES,
            'critical',
            `Email ingestion failed ${consecutiveFailures} times consecutively`,
            { consecutiveFailures, lastError: (err as Error)?.message }
          );
        } else {
          await alerting.sendAlert(
            ALERTS.INGESTION_FAILURE,
            'warning',
            'Scheduled email ingestion failed',
            { consecutiveFailures, error: (err as Error)?.message }
          );
        }
      } catch (alertErr) {
        logger.error({ err: alertErr }, 'Failed to send ingestion failure alert');
      }
    }
  });
  return {
    stop: () => {
      if (task) {
        task.stop();
        task = null;
      }
    },
  };
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}