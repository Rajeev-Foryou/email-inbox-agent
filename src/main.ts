import { loadConfig, validateEnv } from './config/env.js';
import { startServer } from './api/server.js';
import { prisma } from './db/prisma.js';
import { logger } from './utils/logger.js';

let fastify: any = null;
let schedulerControl: any = null;

async function bootstrap() {
  loadConfig();
  validateEnv();
  fastify = await startServer();

  // Start scheduler after config and server are initialized
  try {
    const { startScheduler } = await import('./services/emailIngestionScheduler.js');
    schedulerControl = startScheduler();
    logger.info('Email ingestion scheduler started');
  } catch (err) {
    logger.error({ err }, 'Failed to start scheduler');
  }
}

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received, shutting down gracefully');
  
  // Stop scheduler
  if (schedulerControl) {
    try {
      schedulerControl.stop();
      logger.info('Scheduler stopped');
    } catch (err) {
      logger.error({ err }, 'Error stopping scheduler');
    }
  }
  
  // Close Fastify server
  if (fastify) {
    try {
      await fastify.close();
      logger.info('Server closed');
    } catch (err) {
      logger.error({ err }, 'Error closing server');
    }
  }
  
  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (err) {
    logger.error({ err }, 'Error disconnecting database');
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});

