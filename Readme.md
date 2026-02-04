# Email Inbox Agent 🤖📧

> **AI-powered email classification system** that automatically processes your Gmail inbox, categorizes emails using AI, and provides intelligent insights through a REST API.

[![CI](https://github.com/Rajeev-Foryou/email-inbox-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Rajeev-Foryou/email-inbox-agent/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Demo](#demo)
- [Setup Guide](#setup-guide)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)

---

## 🎯 Overview

Email Inbox Agent is an automated email management system that:

- **Connects to Gmail** via IMAP every 5 minutes
- **Classifies emails** using Groq's AI (llama-3.3-70b-versatile)
- **Extracts metadata**: labels, priority, suggested actions
- **Stores in PostgreSQL** for querying and analysis
- **Exposes REST API** for integration with other tools

**Perfect for:** Portfolio projects, email automation, AI integration demos, production email management

---

## ✨ Features

### Core Functionality

- ✅ **Automated Email Processing** - Cron-based IMAP fetching (configurable interval)
- 🤖 **AI Classification** - Groq/OpenAI-compatible LLM integration
- 🏷️ **Smart Labeling** - Urgent, meeting, invoice, task, spam, etc.
- 📊 **Priority Detection** - High/Medium/Low priority assignment
- 💡 **Action Suggestions** - "respond immediately", "archive", "forward to finance"
- 🔄 **Idempotency** - Duplicate detection via UID and messageId
- 📈 **Metrics & Monitoring** - Real-time performance tracking
- 🔔 **Alerting System** - Configurable thresholds for errors and duplicates

### Production-Ready

- 🐳 **Docker Support** - Multi-stage builds with health checks
- 🚀 **CI/CD Pipeline** - GitHub Actions with automated testing
- 📝 **Structured Logging** - JSON logs with Pino
- 🔒 **Security** - Rate limiting, PII protection, App Password auth
- ♻️ **Retry Logic** - Exponential backoff for transient failures
- 🧪 **Test Coverage** - 28%+ branch coverage with Jest

---

## 🛠️ Tech Stack

| Category          | Technologies                        |
| ----------------- | ----------------------------------- |
| **Language**      | TypeScript 5.3, Node.js 20+         |
| **Framework**     | Fastify 4.27 (REST API)             |
| **Database**      | PostgreSQL 15+, Prisma ORM 6.19     |
| **AI/ML**         | Groq API (llama-3.3-70b-versatile)  |
| **Email**         | node-imap 0.9.6, mailparser 3.9.3   |
| **Scheduler**     | node-cron 4.2.1                     |
| **Observability** | Pino 10.3 (logging), custom metrics |
| **Testing**       | Jest 29, ts-jest                    |
| **DevOps**        | Docker, PM2, GitHub Actions, Render |

---

## 🎬 Demo

**Live API:** https://email-inbox-agent.onrender.com

### Try These Endpoints:

```bash
# Health check
curl https://email-inbox-agent.onrender.com/health

# Get all classified emails
curl https://email-inbox-agent.onrender.com/emails

# Filter by priority
curl https://email-inbox-agent.onrender.com/emails?priority=High

# Filter by labels
curl https://email-inbox-agent.onrender.com/emails?labels=urgent

# View metrics
curl https://email-inbox-agent.onrender.com/metrics
```

---

## 🚀 Setup Guide

### Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 20+** installed ([Download](https://nodejs.org/))
- ✅ **PostgreSQL 15+** running locally or remotely
- ✅ **Gmail account** with IMAP enabled
- ✅ **Groq API key** (free at [console.groq.com](https://console.groq.com))

### Step 1: Clone Repository

```bash
git clone https://github.com/Rajeev-Foryou/email-inbox-agent.git
cd email-inbox-agent
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Gmail App Password

1. **Enable 2-Factor Authentication** on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Create a new app password for "Mail"
4. Copy the 16-character password (remove spaces)

### Step 4: Get Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com) (free tier available)
2. Create a new API key
3. Copy the key (starts with `gsk_`)

### Step 5: Environment Configuration

Create `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/email_inbox_agent"

# Gmail IMAP Settings
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=abcdefghijklmnop  # Gmail App Password (16 chars, no spaces)

# AI Configuration
AGENT_TYPE=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
INGESTION_CRON_SCHEDULE=*/5 * * * *  # Every 5 minutes
```

### Step 6: Database Setup

```bash
# Create database
createdb email_inbox_agent

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### Step 7: Seed Demo Data (Optional)

```bash
npm run seed
```

This adds 6 sample classified emails for testing.

### Step 8: Start Application

**Development mode (with hot reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

### Step 9: Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# View emails
curl http://localhost:3000/emails

# Check metrics
curl http://localhost:3000/metrics
```

---

## 📚 API Documentation

### Base URL

- **Local:** `http://localhost:3000`
- **Production:** `https://email-inbox-agent.onrender.com`

### Endpoints

#### `GET /health`

Health check endpoint

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

---

#### `GET /emails`

Retrieve all classified emails

**Query Parameters:**

- `priority` (optional): Filter by priority (`High`, `Medium`, `Low`)
- `labels` (optional): Filter by label (comma-separated)
- `skip` (optional): Pagination offset (default: 0)
- `take` (optional): Number of results (default: 50, max: 100)

**Example Requests:**

```bash
# All emails
GET /emails

# High priority only
GET /emails?priority=High

# Urgent emails
GET /emails?labels=urgent

# Pagination
GET /emails?skip=10&take=20
```

**Response:**

```json
[
  {
    "id": "cm5abc123...",
    "messageId": "demo-urgent-1@example.com",
    "subject": "URGENT: Production Server Down",
    "from": "devops@company.com",
    "to": "you@gmail.com",
    "body": "Critical alert...",
    "date": "2026-02-04T10:00:00Z",
    "labels": ["urgent", "infrastructure"],
    "priority": "High",
    "suggestedAction": "respond immediately",
    "processedAt": "2026-02-04T10:01:00Z",
    "createdAt": "2026-02-04T10:01:00Z"
  }
]
```

---

#### `GET /emails/:id`

Get specific email by ID

**Response:**

```json
{
  "id": "cm5abc123...",
  "subject": "...",
  ...
}
```

---

#### `GET /metrics`

System performance metrics

**Response:**

```json
{
  "counters": {
    "emails_fetched": 1250,
    "emails_processed": 1198,
    "emails_failed": 12,
    "emails_duplicate": 40
  },
  "histograms": {
    "ingestion_duration_ms": { "p50": 2340, "p95": 4500 },
    "classification_duration_ms": { "p50": 450, "p95": 890 }
  }
}
```

---

#### `GET /alerts`

Recent system alerts

**Response:**

```json
{
  "alerts": [
    {
      "id": "alert_123",
      "severity": "warning",
      "message": "High number of duplicate emails",
      "metadata": { "count": 15 },
      "timestamp": "2026-02-04T10:30:00Z"
    }
  ]
}
```

---

## 🌐 Deployment

### Option 1: Render (Recommended - Free Tier)

1. **Create PostgreSQL Database:**
   - Go to [render.com](https://render.com) → New PostgreSQL
   - Copy the "Internal Database URL"

2. **Create Web Service:**
   - Connect your GitHub repo
   - Runtime: Docker (auto-detected)
   - Branch: `main`

3. **Set Environment Variables:**

   ```
   DATABASE_URL=<paste from step 1>
   IMAP_USER=your-email@gmail.com
   IMAP_PASSWORD=<gmail app password>
   GROQ_API_KEY=<your groq key>
   NODE_ENV=production
   ```

4. **Deploy:** Render auto-deploys from GitHub

**Deployment Guide:** [Full Render Setup](docs/DEPLOYMENT.md)

---

### Option 2: Docker

```bash
# Build image
docker build -t email-inbox-agent .

# Run container
docker run -d \
  --name email-agent \
  --env-file .env \
  -p 3000:3000 \
  email-inbox-agent
```

---

### Option 3: PM2 (VPS/Cloud)

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🧑‍💻 Development

### Project Structure

```
email-inbox-agent/
├── src/
│   ├── agents/          # AI classification (Groq, Stub)
│   ├── api/             # REST API routes (Fastify)
│   ├── config/          # Environment validation
│   ├── db/              # Database (Prisma, migrations)
│   ├── email/           # IMAP client
│   ├── scripts/         # Utility scripts
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Logging, metrics, retry
│   └── main.ts          # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # SQL migrations
├── tests/               # Jest unit tests
├── Dockerfile           # Multi-stage Docker build
├── .env.example         # Environment template
└── package.json
```

### Available Scripts

```bash
npm run dev              # Start dev server (hot reload)
npm run build            # Compile TypeScript
npm start                # Run production build
npm run seed             # Seed demo data
npm test                 # Run tests
npm run test:coverage    # Test with coverage
npm run lint             # Run ESLint
npm run prisma:migrate   # Create migration
npm run prisma:deploy    # Apply migrations
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) - Ultra-fast LLM inference
- [Fastify](https://fastify.io) - High-performance web framework
- [Prisma](https://prisma.io) - Next-generation ORM

---

## 📧 Contact

**Rajeev Kumar**

- GitHub: [@Rajeev-Foryou](https://github.com/Rajeev-Foryou)
- Project: [email-inbox-agent](https://github.com/Rajeev-Foryou/email-inbox-agent)

---

**⭐ If this project helped you, please star it on GitHub!**bash
npm run dev

````

**Production Mode:**

```bash
npm run build
npm start
````

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

✅ **Required Steps Before Production:**

1. ✅ **Environment Variables** - Set all required env vars (see `.env.example`)
2. ✅ **Database Migrations** - Automatically run on startup via `prisma migrate deploy`
3. ✅ **Agent Provider** - Set `AGENT_PROVIDER=groq` with valid API key
4. ✅ **Logging** - Set `NODE_ENV=production` for JSON logs
5. ✅ **Process Manager** - Use PM2 or systemd for auto-restart
6. ⚠️ **Monitoring** - Scrape `/metrics` endpoint with Prometheus
7. ⚠️ **Alerting** - Monitor `/alerts` or integrate custom handlers

### Production Deployment Features

✅ **Automatic Database Migration** - Application runs `prisma migrate deploy` on startup  
✅ **IMAP Connection Cleanup** - Connections properly closed after each ingestion cycle  
✅ **Idempotency** - Duplicate emails prevented via UID + messageId constraints  
✅ **Error Recovery** - Scheduler continues on failures, alerts on consecutive errors  
✅ **Backpressure** - Max 100 emails processed per run to prevent overload  
✅ **Email Body Truncation** - Bodies limited to 10,000 chars to prevent DB bloat  
✅ **Graceful Shutdown** - SIGTERM/SIGINT handlers for clean process termination

### Critical Production Notes

⚠️ **IMAP Connection Limits:**  
Gmail allows ~15 concurrent IMAP connections per account. The app uses 1 connection per ingestion cycle (every 5 minutes by default).

⚠️ **First Deployment:**  
On fresh deployments, the app automatically runs database migrations. Ensure `DATABASE_URL` is accessible and database exists.

⚠️ **Gmail App Passwords:**  
Regular Gmail passwords will NOT work. Generate app-specific password at: https://myaccount.google.com/apppasswords

⚠️ **Metrics Persistence:**  
Metrics are in-memory and reset on restart. For production monitoring, scrape `/metrics` endpoint regularly.

⚠️ **Error Alerting:**  
Built-in alerts log to console by default. For production, add webhook handlers in `src/utils/alerting.ts`.

### Process Manager (PM2)

Use the included `ecosystem.config.js`:

```bash
# Install PM2
npm install -g pm2

# Build application
npm run build

# Start with PM2 config
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs email-inbox-agent

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
