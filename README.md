# FlowForge (QStash Serverless Version)

> A serverless Zapier clone using Upstash QStash instead of Kafka - optimized for free-tier cloud deployment.

## 🎯 Why QStash over Kafka?

| Aspect             | Kafka                    | QStash                 |
| ------------------ | ------------------------ | ---------------------- |
| Hosting            | Self-hosted or managed   | Serverless (Upstash)   |
| Always-on cost     | High (processor polling) | Zero (pay-per-message) |
| Free tier friendly | ❌ Exceeds limits        | ✅ 500 msgs/day free   |
| Setup complexity   | Docker + 4 services      | Just env vars          |
| Local development  | Requires Docker          | Works immediately      |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────-┐
│                    QStash Architecture                       │
├─────────────────────────────────────────────────────────────-┤
│                                                              │
│  [Frontend]         [API (Serverless)]                       │
│  Next.js :3000  ──► Next.js API Routes :3001                 │
│                     ├── /api/auth/*                          │
│                     ├── /api/zap                             │
│                     ├── /api/trigger/available               │
│                     └── /api/action/available                │
│                                                              │
│  [External Webhook]                                          │
│        │                                                     │
│        ▼                                                     │
│  /api/hooks/[userId]/[zapId]                                 │
│        │                                                     │
│        ├── 1. Create ZapRun in DB                            │
│        └── 2. QStash.publish() ──────► /api/worker           │
│                                              │               │
│                                              ▼               │
│                                        Execute Actions       │
│                                        (Email, HTTP, etc.)   │
└─────────────────────────────────────────────────────────────-┘
```

**No Processor, No Kafka, No Docker!**

## 📦 Project Structure

```
flowforge-qstash/
├── apps/
│   ├── web/           # Frontend (Next.js + Shadcn + GSAP)
│   └── api/           # Serverless API (Next.js App Router)
│       └── app/api/
│           ├── auth/     # signup, signin
│           ├── zap/      # CRUD
│           ├── hooks/    # Webhook receiver → QStash
│           └── worker/   # QStash callback (executes actions)
├── packages/
│   ├── db/            # Prisma schema + client
│   └── executors/     # Shared action executors
└── turbo.json
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# packages/db/.env
DATABASE_URL="postgresql://..."

# apps/api/.env.local
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
QSTASH_TOKEN="qstash_xxx"                 # From Upstash
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"      # For verifying callbacks
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
RESEND_API_KEY="re_xxx"
APP_URL="http://localhost:3001"           # Your API URL
```

### 2. Get QStash Credentials

1. Go to [upstash.com](https://upstash.com)
2. Create a QStash instance
3. Copy Token and Signing Keys

### 3. Run Locally

```bash
# Install dependencies
bun install

# Generate Prisma client
cd packages/db && bunx prisma generate && cd ../..

# Start both apps
bun run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

### 4. Test Webhook

```bash
curl -X POST "http://localhost:3001/api/hooks/1/your-zap-id" \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```

> **Note**: QStash verification is enabled by default. For local testing without QStash, temporarily export the handler directly in `/api/worker/route.ts`.

## 🌐 Deployment

Deploy both apps to Vercel:

```bash
# Deploy from root
vercel --prod
```

Set environment variables in Vercel dashboard for both apps.

## 📄 License

MIT
