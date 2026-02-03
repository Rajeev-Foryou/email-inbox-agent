import { z } from 'zod';

export const EmailLabel = z.enum([
  'Work',
  'Personal',
  'Finance',
  'Urgent',
  'Spam',
  'Promotions',
  'Social',
]);
export type EmailLabel = z.infer<typeof EmailLabel>;

export const EmailPriority = z.enum(['High', 'Medium', 'Low']);
export type EmailPriority = z.infer<typeof EmailPriority>;

export const EmailAction = z.enum(['Reply', 'Read', 'Archive', 'Ignore']);
export type EmailAction = z.infer<typeof EmailAction>;

export const EmailSchema = z.object({
  messageId: z.string(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  date: z.date(),
  // The following fields are for after classification
  labels: z.array(EmailLabel).optional(),
  priority: EmailPriority.optional(),
  suggestedAction: EmailAction.optional(),
});
export type EmailType = z.infer<typeof EmailSchema>;