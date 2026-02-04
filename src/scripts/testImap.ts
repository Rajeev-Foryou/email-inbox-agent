// src/scripts/testImap.ts
import { loadConfig } from '../config/env.js';
import { EmailClient } from '../email/emailClient.js';

loadConfig(); // <--- ensure .env is loaded before anything else

async function main() {
  const client = new EmailClient();
  try {
    await client.connect();
    client.end();
  } catch (err) {
    console.error('IMAP connection failed:', err);
  }
}

main();
