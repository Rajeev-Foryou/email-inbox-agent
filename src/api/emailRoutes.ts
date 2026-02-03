import { FastifyInstance } from 'fastify';
import { EmailRepository } from '../db/emailRepository.js';

export async function emailRoutes(fastify: FastifyInstance) {
  const repo = new EmailRepository();

  fastify.get('/emails', async () => {
    const emails = await repo.findAll();
    return emails;
  });

  fastify.get('/emails/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const email = await repo.findById(id);
    if (!email) {
      reply.code(404).send({ error: 'Email not found' });
      return;
    }
    return email;
  });
}