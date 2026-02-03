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