import { withRetry } from '../src/utils/retry';

describe('Retry Utility', () => {
  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, { maxAttempts: 3 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on 5xx axios errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 503 } })
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Non-retryable'));

    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow('Non-retryable');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' });

    await expect(
      withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 })
    ).rejects.toMatchObject({ code: 'ETIMEDOUT' });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should apply exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValue('success');

    const start = Date.now();
    await withRetry(fn, { maxAttempts: 3, initialDelayMs: 50, backoffMultiplier: 2 });
    const duration = Date.now() - start;

    expect(fn).toHaveBeenCalledTimes(3);
    // First retry: 50ms, second retry: 100ms, total >= 150ms
    expect(duration).toBeGreaterThanOrEqual(150);
  });
});
