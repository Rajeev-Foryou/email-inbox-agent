import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { emailRoutes } from './emailRoutes.js';
import { metrics } from '../utils/metrics.js';
import { alerting } from '../utils/alerting.js';

export async function startServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors);
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await fastify.register(emailRoutes);

  // Landing page - Portfolio/Demo view
  fastify.get('/', async () => ({
    project: 'AI-Powered Email Inbox Agent',
    description: 'Automated email classification system using Gmail IMAP + Groq AI',
    developer: 'Rajeev Kumar',
    github: 'https://github.com/Rajeev-Foryou/email-inbox-agent',
    techStack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Fastify', 'Groq AI', 'Docker'],
    features: [
      'Automated email fetching via Gmail IMAP',
      'AI-powered classification (labels, priority, suggested actions)',
      'RESTful API for querying classified emails',
      'Production-ready with metrics, alerting, and retry logic',
      'Containerized deployment with auto-migrations'
    ],
    apiEndpoints: {
      emails: '/emails - Get all classified emails',
      emailById: '/emails/:id - Get specific email',
      health: '/health - Service health check',
      metrics: '/metrics - Performance metrics',
      alerts: '/alerts - Recent system alerts'
    },
    demoInstructions: 'Visit /emails to see classified emails. This instance processes my personal Gmail inbox every 5 minutes.',
    status: 'live'
  }));

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Metrics endpoint
  fastify.get('/metrics', async () => {
    return metrics.getAllMetrics();
  });

  // Recent alerts endpoint
  fastify.get('/alerts', async () => {
    return { alerts: alerting.getRecentAlerts(20) };
  });

  // TODO: Register routes for email querying

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await fastify.listen({ port, host: '0.0.0.0' });
  
  return fastify;
}