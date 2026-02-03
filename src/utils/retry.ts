import { createChildLogger } from './logger.js';
import { metrics, METRICS } from './metrics.js';

const logger = createChildLogger('RetryUtil');

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
};

function isRetryable(error: any, retryableErrors: string[]): boolean {
  // Network errors
  if (error?.code && retryableErrors.includes(error.code)) return true;
  
  // Axios errors with 5xx status
  if (error?.isAxiosError && error?.response?.status >= 500) return true;
  
  // Prisma transient errors
  if (error?.code === 'P1001' || error?.code === 'P1002' || error?.code === 'P1008') return true;
  
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === opts.maxAttempts || !isRetryable(error, opts.retryableErrors)) {
        throw error;
      }
      
      metrics.incrementCounter(METRICS.RETRY_ATTEMPTS, 1, { attempt: attempt.toString() });
      
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );
      
      logger.warn(
        { attempt, maxAttempts: opts.maxAttempts, delayMs: delay, error: error.message },
        'Retrying after failure'
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
