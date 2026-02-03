# CI/CD Instructions

## Continuous Integration

This project uses GitHub Actions for automated testing and building.

### CI Pipeline

The CI pipeline runs on every push to `main` or `develop` branches and on all pull requests.

**Workflow stages:**

1. **Test Job**
   - Runs on Ubuntu with PostgreSQL 15 service
   - Executes Prisma migrations
   - Runs TypeScript type checking
   - Runs Jest test suite with coverage
   - Uploads coverage to Codecov

2. **Build Job**
   - Runs after successful tests
   - Compiles TypeScript to JavaScript
   - Archives build artifacts for 7 days

### Running Tests Locally

#### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally
- `.env` file configured (see `.env.example`)

#### Commands

```bash
# Install dependencies
npm install

# Run Prisma migrations
npm run prisma:migrate

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check
npx tsc --noEmit

# Lint code
npm run lint
```

#### Test Environment Variables

For running tests, set:

```bash
DATABASE_URL=postgresql://test:test@localhost:5432/email_inbox_agent_test
AGENT_PROVIDER=stub
LOG_LEVEL=error
```

### Coverage Requirements

Minimum coverage thresholds enforced:

- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

### Setting Up CI for Your Repository

1. **Enable GitHub Actions** (enabled by default)

2. **Add Repository Secrets** (Settings → Secrets and variables → Actions):
   - No secrets required for basic CI
   - Optional: Add `CODECOV_TOKEN` for private repos

3. **Branch Protection Rules** (Settings → Branches):
   - Require status checks to pass before merging
   - Require branches to be up to date
   - Enable "Require status checks: test, build"

### Adding New Tests

1. Create test files in `tests/` directory with `.test.ts` extension
2. Follow existing test patterns
3. Run locally before pushing: `npm test`
4. Ensure coverage doesn't drop below thresholds

### Troubleshooting CI Failures

**Prisma migration errors:**

```bash
# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate dev
```

**Type errors:**

```bash
# Regenerate Prisma client
npx prisma generate
npx tsc --noEmit
```

**Test failures:**

```bash
# Run specific test file
npx jest tests/retry.test.ts

# Run with verbose output
npx jest --verbose
```

## Deployment Pipeline

### Manual Deployment Steps

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Run migrations on production DB:**

   ```bash
   DATABASE_URL=<prod-url> npm run prisma:deploy
   ```

3. **Start the application:**
   ```bash
   NODE_ENV=production npm start
   ```

### Docker Deployment

```bash
# Build image
docker build -t email-inbox-agent .

# Run with environment variables
docker run -d \
  -e DATABASE_URL=postgresql://... \
  -e GROQ_API_KEY=... \
  -e IMAP_HOST=... \
  -e IMAP_USER=... \
  -e IMAP_PASSWORD=... \
  -p 3000:3000 \
  email-inbox-agent
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/src/main.js --name email-inbox-agent

# Monitor
pm2 monit

# Logs
pm2 logs email-inbox-agent

# Restart
pm2 restart email-inbox-agent
```

## Monitoring in Production

- **Health check:** `GET /health`
- **Metrics:** `GET /metrics`
- **Alerts:** `GET /alerts`
