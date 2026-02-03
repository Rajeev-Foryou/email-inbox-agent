import { StubAgent } from '../src/agents/stubAgent';

describe('StubAgent', () => {
  let agent: StubAgent;

  beforeEach(() => {
    agent = new StubAgent();
  });

  it('should classify urgent emails correctly', async () => {
    const email = {
      messageId: '<test@example.com>',
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'URGENT: Please respond immediately',
      body: 'This is an urgent matter.',
      date: new Date(),
    };

    const result = await agent.classifyEmail(email);

    expect(result.labels).toContain('Urgent');
    expect(result.priority).toBe('High');
    expect(result.suggestedAction).toBe('Read');
  });

  it('should classify spam emails correctly', async () => {
    const email = {
      messageId: '<spam@example.com>',
      from: 'spammer@example.com',
      to: 'victim@example.com',
      subject: 'Win money now! Click here!',
      body: 'Free money! Unsubscribe here.',
      date: new Date(),
    };

    const result = await agent.classifyEmail(email);

    expect(result.labels).toContain('Spam');
    expect(result.suggestedAction).toBe('Ignore');
  });

  it('should classify regular work emails', async () => {
    const email = {
      messageId: '<work@example.com>',
      from: 'colleague@example.com',
      to: 'me@example.com',
      subject: 'Project update',
      body: 'Here is the latest update on the project.',
      date: new Date(),
    };

    const result = await agent.classifyEmail(email);

    expect(result.labels).toContain('Work');
    expect(result.priority).toBe('Medium');
    expect(result.suggestedAction).toBe('Read');
  });
});
