// Script to seed demo emails for portfolio demonstration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoEmails = [
  {
    messageId: 'demo-urgent-1@example.com',
    subject: 'URGENT: Production Server Down',
    from: 'devops@company.com',
    to: 'you@gmail.com',
    body: 'Critical alert: Production server crash detected. Immediate action required.',
    date: new Date('2026-02-04T10:00:00Z'),
    labels: ['urgent', 'infrastructure'],
    priority: 'High',
    suggestedAction: 'respond immediately',
    processedAt: new Date('2026-02-04T10:01:00Z'),
  },
  {
    messageId: 'demo-meeting-1@example.com',
    subject: 'Team Standup - Tomorrow 10 AM',
    from: 'manager@company.com',
    to: 'you@gmail.com',
    body: 'Reminder: Daily standup meeting tomorrow at 10 AM. Please prepare your updates.',
    date: new Date('2026-02-04T09:00:00Z'),
    labels: ['meeting', 'work'],
    priority: 'Medium',
    suggestedAction: 'add to calendar',
    processedAt: new Date('2026-02-04T09:01:00Z'),
  },
  {
    messageId: 'demo-invoice-1@example.com',
    subject: 'Invoice #12345 - Payment Due',
    from: 'billing@vendor.com',
    to: 'you@gmail.com',
    body: 'Your invoice for $599.99 is due on Feb 10, 2026. Please process payment.',
    date: new Date('2026-02-04T08:00:00Z'),
    labels: ['invoice', 'financial'],
    priority: 'High',
    suggestedAction: 'forward to finance',
    processedAt: new Date('2026-02-04T08:01:00Z'),
  },
  {
    messageId: 'demo-newsletter-1@example.com',
    subject: 'Weekly Tech Digest - AI Trends',
    from: 'newsletter@techsite.com',
    to: 'you@gmail.com',
    body: 'This week in AI: New breakthroughs in LLMs, OpenAI updates, and more...',
    date: new Date('2026-02-04T07:00:00Z'),
    labels: ['newsletter', 'informational'],
    priority: 'Low',
    suggestedAction: 'read later',
    processedAt: new Date('2026-02-04T07:01:00Z'),
  },
  {
    messageId: 'demo-task-1@example.com',
    subject: 'Code Review Request: PR #456',
    from: 'github-noreply@github.com',
    to: 'you@gmail.com',
    body: 'Your review has been requested on pull request #456: Add email classification feature',
    date: new Date('2026-02-04T06:00:00Z'),
    labels: ['task', 'code-review', 'work'],
    priority: 'Medium',
    suggestedAction: 'review and respond',
    processedAt: new Date('2026-02-04T06:01:00Z'),
  },
  {
    messageId: 'demo-spam-1@example.com',
    subject: 'CONGRATULATIONS! You won $1,000,000',
    from: 'winner@suspicious.com',
    to: 'you@gmail.com',
    body: 'Click here to claim your prize now! Limited time offer!!!',
    date: new Date('2026-02-04T05:00:00Z'),
    labels: ['spam', 'suspicious'],
    priority: 'Low',
    suggestedAction: 'delete',
    processedAt: new Date('2026-02-04T05:01:00Z'),
  },
];

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  for (const email of demoEmails) {
    await prisma.email.upsert({
      where: { messageId: email.messageId },
      update: email,
      create: email,
    });
  }

  console.log('✅ Demo data seeded successfully!');
  console.log(`   ${demoEmails.length} sample emails added`);
  
  await prisma.$disconnect();
}

seedDemoData().catch((err) => {
  console.error('❌ Error seeding demo data:', err);
  process.exit(1);
});
