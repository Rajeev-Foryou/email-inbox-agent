import cron from 'node-cron';
import { EmailIngestionService } from './emailIngestionService.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('EmailIngestionScheduler');

let task: any = null;

export function startScheduler(cronExpr = '*/5 * * * *') {
  if (task) task.stop();
  task = cron.schedule(cronExpr, async () => {
    logger.info('Running scheduled email ingestion');
    try {
      // Instantiate service lazily inside the cron callback, after env vars are loaded
      const ingestionService = new EmailIngestionService();
      await ingestionService.ingestAndClassifyUnseenEmails();
      logger.info('Email ingestion completed');
    } catch (err) {
      logger.error({ err }, 'Error during email ingestion');
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