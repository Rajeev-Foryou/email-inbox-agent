import { createChildLogger } from './logger.js';

const logger = createChildLogger('Metrics');

interface MetricValue {
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdated: Date;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, MetricValue> = new Map();

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const existing = this.histograms.get(key);
    
    if (existing) {
      existing.count++;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
      existing.lastUpdated = new Date();
    } else {
      this.histograms.set(key, {
        count: 1,
        sum: value,
        min: value,
        max: value,
        lastUpdated: new Date(),
      });
    }
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  getGauge(name: string, labels?: Record<string, string>): number | undefined {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key);
  }

  getHistogram(name: string, labels?: Record<string, string>): MetricValue | undefined {
    const key = this.buildKey(name, labels);
    return this.histograms.get(key);
  }

  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            avg: value.sum / value.count,
          },
        ])
      ),
    };
  }

  logMetrics() {
    const metrics = this.getAllMetrics();
    logger.info({ metrics }, 'Current metrics snapshot');
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

export const metrics = new MetricsCollector();

// Metric names constants
export const METRICS = {
  EMAILS_FETCHED: 'emails_fetched_total',
  EMAILS_PROCESSED: 'emails_processed_total',
  EMAILS_FAILED: 'emails_failed_total',
  EMAILS_DUPLICATE: 'emails_duplicate_total',
  CLASSIFICATION_DURATION: 'classification_duration_ms',
  DB_WRITE_DURATION: 'db_write_duration_ms',
  INGESTION_DURATION: 'ingestion_duration_ms',
  ACTIVE_CONNECTIONS: 'active_connections',
  RETRY_ATTEMPTS: 'retry_attempts_total',
};
