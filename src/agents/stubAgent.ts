import { z } from 'zod';
import { GroqResponseSchema } from './groqAgent.js';
import { EmailSchema } from '../types/email.js';

export class StubAgent {
  constructor() {}

  async classifyEmail(email: z.infer<typeof EmailSchema>) {
    // Deterministic, simple rule-based stub for testing
    const lower = (email.subject + ' ' + email.body).toLowerCase();
    const isUrgent = /urgent|asap|immediately|important/.test(lower);
    const isSpam = /unsubscribe|win money|free|click here/.test(lower);

    const labels = isSpam ? ['Spam'] : isUrgent ? ['Urgent'] : ['Work'];
    const priority = isUrgent ? 'High' : 'Medium';
    const suggestedAction = isSpam ? 'Ignore' : 'Read';

    const candidate = { labels, priority, suggestedAction } as unknown;
    const validated = GroqResponseSchema.parse(candidate);
    return validated;
  }
}
