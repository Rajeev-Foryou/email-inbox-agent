import { exec } from 'child_process';
import { promisify } from 'util';
import { createChildLogger } from '../utils/logger.js';

const execAsync = promisify(exec);
const logger = createChildLogger('DatabaseMigration');

/**
 * Runs Prisma migrations in production (non-interactive mode)
 * This ensures the database schema is up-to-date before the application starts
 */
export async function runMigrations(): Promise<void> {
  logger.info('Running database migrations...');
  
  try {
    const { stdout, stderr } = await execAsync('node_modules/.bin/prisma migrate deploy', {
      env: process.env,
      cwd: process.cwd(),
      timeout: 120000, // 2 minutes timeout
    });
    
    if (stdout) logger.info({ stdout }, 'Migration output');
    if (stderr) logger.debug({ stderr }, 'Migration stderr output');
    
    logger.info('Database migrations completed successfully');
  } catch (error: any) {
    if (error.killed && error.signal === 'SIGTERM') {
      logger.error({ timeout: true }, 'Migration timed out after 2 minutes');
      throw new Error('Database migration timed out - check database connectivity and migration complexity');
    }
    logger.error({ error: error.message, stderr: error.stderr }, 'Migration failed');
    throw new Error(`Database migration failed: ${error.message}`);
  }
}
