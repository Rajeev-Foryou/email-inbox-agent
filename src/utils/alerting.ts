import { createChildLogger } from './logger.js';

const logger = createChildLogger('Alerting');

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  name: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export type AlertHandler = (alert: Alert) => void | Promise<void>;

class AlertingSystem {
  private handlers: AlertHandler[] = [];
  private alertHistory: Alert[] = [];
  private maxHistorySize = 100;

  addHandler(handler: AlertHandler) {
    this.handlers.push(handler);
  }

  async sendAlert(
    name: string,
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, any>
  ) {
    const alert: Alert = {
      name,
      severity,
      message,
      metadata,
      timestamp: new Date(),
    };

    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.pop();
    }

    logger[severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info'](
      { alert },
      `Alert: ${message}`
    );

    for (const handler of this.handlers) {
      try {
        await handler(alert);
      } catch (err) {
        logger.error({ err, alertName: name }, 'Failed to execute alert handler');
      }
    }
  }

  getRecentAlerts(count: number = 10): Alert[] {
    return this.alertHistory.slice(0, count);
  }

  clearHistory() {
    this.alertHistory = [];
  }
}

export const alerting = new AlertingSystem();

// Default console handler
alerting.addHandler((alert) => {
  if (alert.severity === 'critical') {
    console.error(`🚨 CRITICAL ALERT: ${alert.message}`, alert.metadata);
  }
});

// Alert name constants
export const ALERTS = {
  HIGH_ERROR_RATE: 'high_error_rate',
  CLASSIFICATION_TIMEOUT: 'classification_timeout',
  DB_CONNECTION_FAILED: 'db_connection_failed',
  IMAP_CONNECTION_FAILED: 'imap_connection_failed',
  DUPLICATE_THRESHOLD: 'duplicate_threshold_exceeded',
  INGESTION_FAILURE: 'ingestion_failure',
  INGESTION_CONSECUTIVE_FAILURES: 'ingestion_consecutive_failures',
};
