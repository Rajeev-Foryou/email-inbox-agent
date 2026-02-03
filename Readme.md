# Email Inbox Agent

AI-powered email inbox classification and labeling system that automatically processes Gmail messages, categorizes them using AI, and stores structured metadata for intelligent email management.

## Overview

The Email Inbox Agent connects to Gmail via IMAP, fetches unread emails, classifies them using AI (Groq/OpenAI-compatible API), and persists labeled results to PostgreSQL. It runs on a configurable schedule with built-in retry logic, idempotency, metrics, and alerting.

**Key Features:**

- 📧 **IMAP Email Fetching** - Safe, non-destructive email retrieval (marks as seen only after successful processing)
- 🤖 **AI Classification** - Groq/OpenAI-compatible API for intelligent email categorization
- 🗄️ **PostgreSQL Persistence** - Structured storage with Prisma ORM
- ♻️ **Idempotency** - UID-based duplicate prevention with unique constraints
- 🔄 **Retry Logic** - Exponential backoff for transient failures
- 📊 **Observability** - Structured logging (Pino), metrics, and alerting
- ⏰ **Scheduled Processing** - Cron-based ingestion (default: every 5 minutes)
- 🧪 **Test Coverage** - Unit and integration tests with Jest
- 🚀 **CI/CD** - GitHub Actions workflow with PostgreSQL service

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         main.ts                              │
│  (Bootstrap: loadConfig → startServer → startScheduler)      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ API Server   │  │ Email Scheduler  │  │ Email Service   │
│ (Fastify)    │  │ (node-cron)      │  │ (Orchestration) │
└──────────────┘  └──────────────────┘  └─────────────────┘
                                               │
                        ┌──────────────────────┼──────────────────┐
                        ▼                      ▼                  ▼
                 ┌─────────────┐       ┌─────────────┐   ┌──────────────┐
                 │ EmailClient │       │ AI Agent    │   │ EmailRepo    │
                 │ (IMAP)      │       │ (Groq/Stub) │   │ (Prisma)     │
                 └─────────────┘       └─────────────┘   └──────────────┘
```

## Prerequisites

- **Node.js** 20+ (ESM support required)
- **PostgreSQL** 15+
- **Gmail Account** with IMAP enabled
- **Groq API Key** (or OpenAI-compatible API)
- **App Password** for Gmail (2FA required)

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_inbox_agent"

# Gmail IMAP
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password  # Generate at https://myaccount.google.com/apppasswords

# AI Provider
AGENT_PROVIDER=groq  # Options: groq, stub
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile

# Server
PORT=3000
NODE_ENV=development  # Options: development, production
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Or for production (no prompts)
npm run prisma:deploy
```

### 4. Run Application

**Development Mode:**

```bash
npm run dev
```

**Production Mode:**

```bash
npm run build
npm start
```

## Environment Variables

| Variable         | Required | Default                   | Description                                    |
| ---------------- | -------- | ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`   | ✅       | -                         | PostgreSQL connection string                   |
| `IMAP_HOST`      | ✅       | -                         | IMAP server hostname (e.g., imap.gmail.com)    |
| `IMAP_PORT`      | ✅       | -                         | IMAP server port (993 for SSL)                 |
| `IMAP_USER`      | ✅       | -                         | Gmail email address                            |
| `IMAP_PASSWORD`  | ✅       | -                         | Gmail app password                             |
| `AGENT_PROVIDER` | ❌       | `stub`                    | AI provider: `groq` or `stub`                  |
| `GROQ_API_KEY`   | ⚠️       | -                         | Groq API key (required if AGENT_PROVIDER=groq) |
| `GROQ_MODEL`     | ❌       | `llama-3.3-70b-versatile` | Groq model name                                |
| `PORT`           | ❌       | `3000`                    | HTTP server port                               |
| `NODE_ENV`       | ❌       | `development`             | Environment: `development` or `production`     |

⚠️ = Required when using Groq provider

## API Endpoints

| Method | Path          | Description                       |
| ------ | ------------- | --------------------------------- |
| `GET`  | `/health`     | Health check endpoint             |
| `GET`  | `/emails`     | List processed emails (paginated) |
| `GET`  | `/emails/:id` | Get email by ID                   |
| `GET`  | `/metrics`    | Prometheus-style metrics          |
| `GET`  | `/alerts`     | Active alerts (last 1 hour)       |

### Example Requests

**Health Check:**

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

**List Emails:**

```bash
curl http://localhost:3000/emails?limit=10&offset=0
```

**Get Metrics:**

```bash
curl http://localhost:3000/metrics
```

## Email Classification

The AI agent classifies emails with:

- **Labels** - Tags like `urgent`, `spam`, `promotional`, `work`, `personal`
- **Priority** - `high`, `medium`, `low`
- **Suggested Action** - `reply`, `archive`, `delete`, `flag`, `no_action`

**Stub Agent** (for testing):

- Rule-based classification using keyword matching
- No external API calls
- Deterministic results

**Groq Agent** (production):

- Uses Groq's LLaMA models via OpenAI-compatible API
- JSON-structured responses with robust parsing
- Configurable temperature and max tokens

## Testing

**Run All Tests:**

```bash
npm test
```

**Watch Mode:**

```bash
npm run test:watch
```

**Coverage Report:**

```bash
npm run test:coverage
```

**Test Suites:**

- `tests/stubAgent.test.ts` - AI agent classification logic
- `tests/retry.test.ts` - Exponential backoff retry utility
- `tests/metrics.test.ts` - Metrics collection system
- `tests/ingest.stub.test.ts` - Integration test with stub agent

## Observability

### Structured Logging

Uses Pino for JSON-structured logs:

```typescript
// Development: Pretty-printed colored logs
{"level":"info","time":"2026-02-02T12:00:00.000Z","module":"EmailService","msg":"Email processed"}

// Production: JSON for log aggregation
{"level":"info","time":"2026-02-02T12:00:00.000Z","module":"EmailService","emailId":"abc-123"}
```

### Metrics

Available metrics (Prometheus-compatible):

- `emails_fetched_total` - Total emails fetched from IMAP
- `emails_processed_total` - Successfully processed emails
- `emails_failed_total` - Failed email processing attempts
- `emails_duplicate_total` - Duplicate emails skipped (idempotency)
- `classification_duration_ms` - AI classification latency (histogram)
- `classification_errors_total` - AI classification failures

Access: `GET /metrics`

### Alerting

Built-in alerts with severity levels:

- `HIGH_ERROR_RATE` - Error rate > 50% (CRITICAL)
- `CLASSIFICATION_TIMEOUT` - AI response > 10s (WARNING)
- `IMAP_CONNECTION_FAILED` - IMAP connection errors (CRITICAL)

Access: `GET /alerts`

## Retry & Resilience

Exponential backoff retry for:

- **AI API calls** - 3 attempts, 1s initial delay
- **Database operations** - 3 attempts, 100ms initial delay
- **IMAP operations** - 3 attempts, 500ms initial delay

Retryable errors:

- Network errors (ECONNRESET, ETIMEDOUT)
- Axios HTTP 5xx errors
- Prisma connection/transaction errors

## Idempotency

Prevents duplicate processing via:

- **UID tracking** - IMAP UID + mailbox stored in database
- **Unique constraint** - `@@unique([imapMailbox, imapUid])`
- **Pre-check** - `isUidProcessed()` before classification

Emails are skipped if already processed, incrementing `emails_duplicate_total` metric.

## Deployment

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- Runs on push/PR to `main` branch
- PostgreSQL service container
- Test + build jobs
- See [CI.md](CI.md) for full documentation

### Production Checklist

1. **Environment Variables** - Set all required env vars
2. **Database Migrations** - Run `npm run prisma:deploy`
3. **Agent Provider** - Set `AGENT_PROVIDER=groq` with valid API key
4. **Logging** - Set `NODE_ENV=production` for JSON logs
5. **Process Manager** - Use PM2 or systemd for auto-restart
6. **Monitoring** - Scrape `/metrics` endpoint with Prometheus
7. **Alerting** - Monitor `/alerts` or integrate custom handlers

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "email-agent" -- start

# View logs
pm2 logs email-agent

# Monitor
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Development

### Project Structure

```
.
├── src/
│   ├── main.ts                 # Application entry point
│   ├── agents/
│   │   ├── index.ts            # Agent factory (stub/groq)
│   │   ├── groqAgent.ts        # Groq AI integration
│   │   └── stubAgent.ts        # Rule-based test agent
│   ├── api/
│   │   ├── server.ts           # Fastify HTTP server
│   │   └── emailRoutes.ts      # Email REST endpoints
│   ├── config/
│   │   └── env.ts              # Environment variable loader
│   ├── db/
│   │   ├── prisma.ts           # Prisma client instance
│   │   └── emailRepository.ts  # Email data access layer
│   ├── email/
│   │   └── emailClient.ts      # IMAP client wrapper
│   ├── services/
│   │   ├── emailIngestionService.ts      # Orchestration logic
│   │   └── emailIngestionScheduler.ts    # Cron scheduler
│   ├── scripts/
│   │   ├── testImap.ts         # IMAP connection test
│   │   └── triggerIngestion.ts # Manual ingestion trigger
│   └── utils/
│       ├── logger.ts           # Pino structured logging
│       ├── retry.ts            # Exponential backoff utility
│       ├── metrics.ts          # Metrics collector
│       └── alerting.ts         # Alert management
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
├── tests/
│   ├── stubAgent.test.ts       # Agent unit tests
│   ├── retry.test.ts           # Retry logic tests
│   ├── metrics.test.ts         # Metrics tests
│   └── ingest.stub.test.ts     # Integration test
├── .github/workflows/
│   └── ci.yml                  # CI/CD pipeline
├── package.json
├── tsconfig.json
├── jest.config.cjs
└── CI.md                       # CI/CD documentation
```

### Adding Custom Agents

1. Create agent class implementing classification interface:

```typescript
export class MyAgent {
  async classifyEmail(email: ParsedEmail): Promise<ClassificationResult> {
    return {
      labels: ["custom"],
      priority: "medium",
      suggestedAction: "archive",
    };
  }
}
```

2. Register in `src/agents/index.ts`:

```typescript
export function getAgent(): EmailAgent {
  if (process.env.AGENT_PROVIDER === "custom") {
    return new MyAgent();
  }
  // ... existing logic
}
```

3. Set `AGENT_PROVIDER=custom` in `.env`

## Troubleshooting

### IMAP Connection Fails

**Error:** `AUTHENTICATIONFAILED` or `Invalid credentials`

**Solution:**

1. Enable IMAP in Gmail Settings → Forwarding and POP/IMAP
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use App Password (not regular Gmail password) in `IMAP_PASSWORD`

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**

```bash
npm run prisma:generate
# or
npx prisma generate
```

### Database Migration Issues

**Error:** `P3018: A migration failed to apply`

**Solution:**

```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Or manually fix and re-apply
npx prisma migrate resolve --applied <migration_name>
```

### AI Classification Errors

**Error:** `Failed to parse AI response`

**Solution:**

1. Check `GROQ_API_KEY` is valid
2. Verify model name in `GROQ_MODEL`
3. Check Groq API status at https://status.groq.com
4. Review logs for response structure issues

### Test Failures

**Error:** `Worker process failed to exit gracefully`

**Solution:** Non-blocking warning - tests still pass. To fix:

```bash
npm test -- --detectOpenHandles
```

## License

MIT

## Support

For issues and questions:

- Create an issue on GitHub
- Check [CI.md](CI.md) for CI/CD documentation
- Review test files in `tests/` for usage examples
