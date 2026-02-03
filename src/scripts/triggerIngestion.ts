import { loadConfig } from '../config/env.js';
import { EmailIngestionService } from '../services/emailIngestionService.js';

loadConfig();

async function main() {
  const ingestionService = new EmailIngestionService();
  try {
    await ingestionService.ingestAndClassifyUnseenEmails();
    console.log('Manual email ingestion completed.');
  } catch (err) {
    console.error('Error during manual ingestion:', err);
  }
}

main();