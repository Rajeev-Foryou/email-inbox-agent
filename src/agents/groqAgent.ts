import axios from 'axios';
import { z } from 'zod';
import { EmailSchema, EmailLabel, EmailPriority, EmailAction } from '../types/email.js';
import { withRetry } from '../utils/retry.js';

// Define the expected response schema from Groq/OpenAI
export const GroqResponseSchema = z.object({
  labels: z.array(EmailLabel),
  priority: EmailPriority,
  suggestedAction: EmailAction,
});

export type GroqResponse = z.infer<typeof GroqResponseSchema>;

export class GroqAgent {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? '';
    this.endpoint = process.env.GROQ_ENDPOINT ?? 'https://api.groq.com/openai/v1/chat/completions';
    this.model = process.env.GROQ_MODEL ?? 'gpt-4o-mini';
  }

  private buildSystemPrompt() {
    return `You are an assistant that MUST answer only with JSON. Produce a JSON object with the exact shape: {"labels": [string], "priority": "High|Medium|Low", "suggestedAction": "Reply|Read|Archive|Ignore"}.\n\nAllowed labels: Work, Personal, Finance, Urgent, Spam, Promotions, Social.\nReturn only valid JSON with those fields and no additional text.`;
  }

  async classifyEmail(email: z.infer<typeof EmailSchema>): Promise<GroqResponse> {
    const system = this.buildSystemPrompt();
    const userContent = `Subject: ${email.subject}\nFrom: ${email.from}\nTo: ${email.to}\nDate: ${email.date}\n\nBody:\n${email.body}`;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0,
      max_tokens: 300,
    } as any;

    const resp = await withRetry(
      () => axios.post(this.endpoint, body, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20_000,
      }),
      { maxAttempts: 3, initialDelayMs: 1000 }
    );

    // Response can be either a direct JSON object (some providers) or a chat response message
    let raw: any = resp.data;
    // Try chat-completions style extraction
    if (raw && Array.isArray(raw.choices) && raw.choices.length > 0) {
      const choice = raw.choices[0];
      if (choice.message && typeof choice.message.content === 'string') raw = choice.message.content;
      else if (typeof choice.text === 'string') raw = choice.text;
    }

    // If raw is a string, try to parse JSON from it
    let parsedJson: any = null;
    if (typeof raw === 'string') {
      try {
        parsedJson = JSON.parse(raw);
      } catch (_e) {
        // Try to extract JSON substring
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedJson = JSON.parse(match[0]);
          } catch (_err) {
            throw new Error('Failed to parse JSON from model response');
          }
        } else {
          throw new Error('Model response did not contain JSON');
        }
      }
    } else if (typeof raw === 'object') {
      parsedJson = raw;
    } else {
      throw new Error('Unexpected response shape from Groq/OpenAI');
    }

    const validated = GroqResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error('Invalid classification shape from model');
    }
    return validated.data;
  }
}
