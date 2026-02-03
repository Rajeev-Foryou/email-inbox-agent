import { EmailIngestionService } from "../src/services/emailIngestionService.js";
import { getAgent } from "../src/agents/index.js";
process.env.AGENT_PROVIDER = "stub";
class FakeEmailClient {
  connected = false;
  async connect() {
    this.connected = true;
  }
  async fetchUnseenEmails() {
    return [
      {
        uid: 123,
        seqno: 1,
        messageId: "<test-mail@example.com>",
        from: "alice@example.com",
        to: "bob@example.com",
        subject: "Test",
        body: "please reply",
        date: new Date(),
      },
    ];
  }
  end() {
    this.connected = false;
  }
  async markAsSeen(uids) {}
}
class SpyRepository {
  created = [];
  async create(data) {
    this.created.push(data);
    return { ...data, id: "fake" };
  }
  async isUidProcessed(_mailbox, _uid) {
    return false;
  }
  async findByImapUid(_mailbox, _uid) {
    return null;
  }
}
test("ingest route with stub agent saves email and marks seen", async () => {
  const fakeClient = new FakeEmailClient();
  const repo = new SpyRepository();
  const agent = getAgent();
  const service = new EmailIngestionService(fakeClient, agent, repo);
  await service.ingestAndClassifyUnseenEmails();
  expect(repo.created.length).toBe(1);
  const saved = repo.created[0];
  expect(saved.messageId).toBe("<test-mail@example.com>");
  expect(Array.isArray(saved.labels)).toBe(true);
});
