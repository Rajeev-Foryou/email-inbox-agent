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
  
  // Validate IMAP_PORT is a number
  const port = Number(process.env.IMAP_PORT);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('IMAP_PORT must be a valid port number (1-65535)');
  }
  
  // Validate GROQ_API_KEY if using groq provider
  const agentProvider = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();
  if (agentProvider === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required when AGENT_PROVIDER=groq');
  }
  
  // Validate LOG_LEVEL if provided
  const validLogLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
  const logLevel = process.env.LOG_LEVEL;
  if (logLevel && !validLogLevels.includes(logLevel.toLowerCase())) {
    throw new Error(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }
  // Normalize LOG_LEVEL to lowercase after validation
  if (logLevel) {
    process.env.LOG_LEVEL = logLevel.toLowerCase();
  }
  
  // Validate NODE_ENV if provided
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn(`Warning: NODE_ENV="${nodeEnv}" is non-standard. Recommended: development, production, or test`);
  }
}