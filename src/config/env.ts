import dotenv from 'dotenv';
import path from 'path';

export function loadConfig() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export function validateEnv() {
  const required = [
    'IMAP_HOST',
    'IMAP_PORT',
    'IMAP_USER',
    'IMAP_PASSWORD',
    'DATABASE_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate GROQ_API_KEY if using groq provider
  const agentProvider = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();
  if (agentProvider === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required when AGENT_PROVIDER=groq');
  }
}