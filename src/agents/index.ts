import { GroqAgent } from './groqAgent.js';
import { StubAgent } from './stubAgent.js';

export type Agent = {
  classifyEmail: (email: any) => Promise<any>;
};

export function getAgent(): Agent {
  const provider = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();
  if (provider === 'stub') return new StubAgent();
  return new GroqAgent();
}
