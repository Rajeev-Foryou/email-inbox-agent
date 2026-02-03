/*
  Warnings:

  - A unique constraint covering the columns `[imapMailbox,imapUid]` on the table `Email` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "imapMailbox" TEXT NOT NULL DEFAULT 'INBOX',
ADD COLUMN     "imapUid" INTEGER,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Email_processedAt_idx" ON "Email"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Email_imapMailbox_imapUid_key" ON "Email"("imapMailbox", "imapUid");
