import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { createChildLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

const logger = createChildLogger('EmailClient');

export interface ParsedEmail {
  uid: number;
  seqno: number;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
}

export class EmailClient {
  private imap: Imap;

  // src/email/emailClient.ts (constructor snippet)
constructor() {
  const host = process.env.IMAP_HOST!;
  const port = Number(process.env.IMAP_PORT!);
  const user = process.env.IMAP_USER!;
  this.imap = new Imap({
    user,
    password: process.env.IMAP_PASSWORD!,
    host,
    port,
    tls: true,
  });
  logger.info({ host, port, user }, 'EmailClient configured');
}
connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.imap.once("ready", () => {
      logger.info('IMAP connected'); 
      resolve();
    });
    this.imap.once("error", (err) => reject(err));
    this.imap.connect();
  });
}

  fetchUnseenEmails(): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox("INBOX", false, (err) => {
        if (err) return reject(err);

        this.imap.search(["UNSEEN"], (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) return resolve([]);
          // Do not mark seen yet; caller should mark processed after durable persistence
          const fetcher = this.imap.fetch(results, { bodies: "", markSeen: false });
          const emailPromises: Promise<ParsedEmail>[] = [];

          fetcher.on("message", (msg, seqno) => {
            let buffer = "";
            let uid: number | undefined;

            msg.on("body", (stream) => {
              stream.on("data", (chunk: Buffer) => {
                buffer += chunk.toString("utf8");
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });

            const emailPromise = new Promise<ParsedEmail>((resolveEmail, rejectEmail) => {
              msg.once("end", async () => {
                try {
                  const parsed = await simpleParser(buffer);

                  resolveEmail({
                    uid: uid ?? -1,
                    seqno: seqno,
                    messageId: parsed.messageId ?? "",
                    from: parsed.from?.text ?? "",
                    to: Array.isArray(parsed.to)
                      ? parsed.to.map((addr: { address: any; }) => (typeof addr === "object" && "address" in addr ? addr.address : "")).join(", ")
                      : (typeof parsed.to === "object" && "text" in parsed.to ? parsed.to.text : ""),
                    subject: parsed.subject ?? "",
                    body: parsed.text ?? "",
                    date: parsed.date ?? new Date(),
                  });
                } catch (err) {
                  rejectEmail(err);
                }
              });
            });

            emailPromises.push(emailPromise);
          });

          fetcher.once("error", (err) => reject(err));

          fetcher.once("end", async () => {
            try {
              const emails = await Promise.all(emailPromises);
              resolve(emails);
            } catch (err) {
              reject(err);
            }
          });
        });
      });
    });
  }

  end(): void {
    this.imap.end();
  }
  
  // Mark a set of UIDs as seen/processed
  markAsSeen(uids: number[] | number): Promise<void> {
    return withRetry(
      () => new Promise<void>((resolve, reject) => {
        try {
          this.imap.addFlags(uids, '\\Seen', (err) => {
            if (err) return reject(err);
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      }),
      { maxAttempts: 2, initialDelayMs: 500 }
    );
  }
}

