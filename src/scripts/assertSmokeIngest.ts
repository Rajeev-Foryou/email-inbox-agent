import { EmailIngestionService } from '../services/emailIngestionService.js';
import { getAgent } from '../agents/index.js';

process.env.AGENT_PROVIDER = 'stub';

class FakeEmailClient {
  async connect() { }
  async fetchUnseenEmails() {
    return [
      {
        uid: 123,
        seqno: 1,
        messageId: '<test-mail@example.com>',
        from: 'alice@example.com',
        to: 'bob@example.com',
        subject: 'Test',
        body: 'please reply',
        date: new Date(),
      },
    ];
  }
  end() { }
  async markAsSeen(_uids: any): Promise<void> { return; }
}

class SpyRepository {
  created: any[] = [];
  async create(data: any): Promise<any> { this.created.push(data); return { ...data, id: 'fake' }; }
  async isUidProcessed(_mailbox: string, _uid: number): Promise<boolean> { return false; }
  async findByImapUid(_mailbox: string, _uid: number): Promise<any> { return null; }
}

async function main() {
  const fakeClient = new FakeEmailClient();
  const repo = new SpyRepository();
  const agent = getAgent();

  const service = new EmailIngestionService(fakeClient as any, agent as any, repo as any);

  await service.ingestAndClassifyUnseenEmails();

  if (repo.created.length !== 1) {
    console.error('Expected 1 saved record, got', repo.created.length);
    process.exit(2);
  }
  const saved = repo.created[0];
  if (saved.messageId !== '<test-mail@example.com>') {
    console.error('Saved messageId mismatch', saved.messageId);
    process.exit(3);
  }
  if (!Array.isArray(saved.labels)) {
    console.error('Saved labels missing or not an array', saved.labels);
    process.exit(4);
  }

  console.log('Smoke ingest assert succeeded');
}

main().catch((e) => { console.error(e); process.exit(1); });
