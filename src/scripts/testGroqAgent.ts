import express from 'express';
import { GroqAgent } from '../agents/groqAgent.js';

// Start a local stub server that mimics Groq/OpenAI chat completions
const app = express();
app.use(express.json());

app.post('/openai/v1/chat/completions', (req, res) => {
  const fake = {
    id: 'test',
    object: 'chat.completion',
    created: Date.now(),
    model: req.body?.model ?? 'gpt-test',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({ labels: ['Work'], priority: 'High', suggestedAction: 'Reply' }),
        },
        finish_reason: 'stop',
      },
    ],
  };
  res.json(fake);
});

const server = app.listen(4001, async () => {
  console.log('Stub Groq server listening on http://localhost:4001');

  // Point GroqAgent to the stub
  process.env.GROQ_ENDPOINT = 'http://localhost:4001/openai/v1/chat/completions';
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_MODEL = 'gpt-test';

  const agent = new GroqAgent();
  const sampleEmail = {
    messageId: '<test-message-id@example.com>',
    from: 'alice@example.com',
    to: 'bob@example.com',
    subject: 'Test email',
    body: 'Hello, this is a test.',
    date: new Date(),
  } as any;

  try {
    const result = await agent.classifyEmail(sampleEmail);
    console.log('Classification result:', result);
  } catch (err) {
    console.error('Error during classification:', err);
  } finally {
    server.close();
  }
});
