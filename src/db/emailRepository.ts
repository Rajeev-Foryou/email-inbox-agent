import { prisma } from "./prisma.js";
import { Prisma } from "@prisma/client";
import { withRetry } from '../utils/retry.js';

export type EmailModel = Awaited<ReturnType<typeof prisma.email.create>>;

export class EmailRepository {
  async create(email: Prisma.EmailCreateInput): Promise<EmailModel> {
    return withRetry(
      () => prisma.email.create({ data: email }),
      { maxAttempts: 3, initialDelayMs: 500 }
    );
  }

  async findById(id: string): Promise<EmailModel | null> {
    return prisma.email.findUnique({ where: { id } });
  }

  async findAll(): Promise<EmailModel[]> {
    return prisma.email.findMany();
  }

  async update(id: string, data: Partial<EmailModel>): Promise<EmailModel> {
    return prisma.email.update({ where: { id }, data });
  }

  async findByImapUid(imapMailbox: string, imapUid: number): Promise<EmailModel | null> {
    return prisma.email.findUnique({
      where: {
        email_imap_unique: {
          imapMailbox,
          imapUid,
        },
      },
    });
  }

  async isUidProcessed(imapMailbox: string, imapUid: number): Promise<boolean> {
    const existing = await this.findByImapUid(imapMailbox, imapUid);
    return existing !== null && existing.processedAt !== null;
  }
}
