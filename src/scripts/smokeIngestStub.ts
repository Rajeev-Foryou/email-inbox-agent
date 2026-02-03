import { getAgent } from '../agents/index.js';
import { EmailSchema } from '../types/email.js';

process.env.AGENT_PROVIDER = 'stub';

// Fake EmailClient that returns a single sample email
class FakeEmailClient {
  async connect() {
    console.log('FakeEmailClient.connect()');
  }
  async fetchUnseenEmails() {
    console.log('FakeEmailClient.fetchUnseenEmails()');
    return [
      {
        messageId: '<smoke-1@example.com>',
        from: 'alice@example.com',
        to: 'bob@example.com',
        subject: 'Please review ASAP',
        body: 'This is an urgent request that needs attention.',
        date: new Date(),
      },
    ];
  }
  end() {
    console.log('FakeEmailClient.end()');
  }
}

// Fake EmailRepository that logs create calls
class FakeEmailRepository {
  async create(email: any) {
    console.log('FakeEmailRepository.create()', email);
    return { ...email, id: 'fake-id', createdAt: new Date(), updatedAt: new Date() };
  }
}

async function run() {
  const agent = getAgent();
  const client = new FakeEmailClient();
  const repo = new FakeEmailRepository();

  await client.connect();
  const emails = await client.fetchUnseenEmails();
  client.end();

  for (const email of emails) {
    const parsed = EmailSchema.safeParse({ ...email });
    if (!parsed.success) {
      console.warn('Invalid email shape, skipping', email);
      continue;
    }

    try {
      const classification = await agent.classifyEmail(parsed.data as any);
      const toSave = {
        ...parsed.data,
        labels: Array.isArray(classification.labels) ? classification.labels : [],
        priority: typeof classification.priority === 'string' ? classification.priority : 'Medium',
        suggestedAction: typeof classification.suggestedAction === 'string' ? classification.suggestedAction : 'Read',
      };
      const saved = await repo.create(toSave);
      console.log('Saved email:', saved);
    } catch (err) {
      console.error('Error during classification or save', err);
    }
  }
}

run().catch((e) => console.error(e));
