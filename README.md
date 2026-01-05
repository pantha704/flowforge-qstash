# FlowForge (QStash Serverless Version)

> A serverless Zapier clone using Upstash QStash instead of Kafka - optimized for free-tier cloud deployment.

## 🔗 Live Demo

- **Frontend**: [flowforge-qstash-web.vercel.app](https://flowforge-qstash-web.vercel.app)
- **API**: [flowforge-qstash-api.vercel.app/api](https://flowforge-qstash-api.vercel.app/api)

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
┌─────────────────────────────────────────────────────────────────┐
│                    QStash Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Frontend]           [API (Serverless)]                        │
│  Next.js :3000   ──►  Next.js API Routes :3002                  │
│                       ├── /api/auth/*  (signup, signin)         │
│                       ├── /api/zap     (CRUD)                   │
│                       ├── /api/trigger/available                │
│                       ├── /api/action/available                 │
│                       └── /api/schedule (QStash cron)           │
│                                                                 │
│  [External Webhook]                                             │
│        │                                                        │
│        ▼                                                        │
│  POST /api/hooks/[userId]/[zapId]                               │
│        │                                                        │
│        ├── 1. Create ZapRun record in DB                        │
│        ├── 2. (Local) Call /api/worker directly                 │
│        └── 2. (Prod) QStash.publish() → /api/worker             │
│                                                │                │
│                                                ▼                │
│                                          Execute Actions        │
│                                          (Email, HTTP, etc.)    │
└─────────────────────────────────────────────────────────────────┘
```

**No Processor, No Kafka, No Docker!**

## 📦 Project Structure

```
flowforge-qstash/
├── apps/
│   ├── web/           # Frontend (Next.js + Shadcn + TailwindCSS + GSAP)
│   └── api/           # Serverless API (Next.js App Router)
│       └── app/api/
│           ├── auth/       # signup, signin (bcryptjs + JWT)
│           ├── zap/        # CRUD operations
│           ├── hooks/      # Webhook receiver → QStash/worker
│           ├── worker/     # QStash callback (executes actions)
│           └── schedule/   # QStash cron scheduling
├── packages/
│   ├── db/            # Prisma schema + client (PostgreSQL)
│   └── executors/     # Shared action executors (Email, HTTP, etc.)
└── turbo.json
```

## ✨ Features

- **Triggers**: Webhook, Schedule (Cron)
- **Actions**: Send Email (Resend), HTTP Request, Discord/Slack webhooks
- **Auth**: JWT-based authentication
- **UI**: Modern glassmorphic design with GSAP animations
- **Serverless**: Fully serverless, scales to zero

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/pantha704/flowforge-qstash.git
cd flowforge-qstash
bun install
```

### 2. Environment Setup

```bash
# packages/db/.env
DATABASE_URL="postgresql://..."

# apps/api/.env.local
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
QSTASH_TOKEN="qstash_xxx"                 # From Upstash Console
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"      # For webhook verification
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
RESEND_API_KEY="re_xxx"                   # From Resend.com
APP_URL="http://localhost:3002"           # Your API URL

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3002/api"
```

### 3. Get Credentials

1. **QStash**: [console.upstash.com/qstash](https://console.upstash.com/qstash) - Get Token & Signing Keys
2. **Resend**: [resend.com](https://resend.com) - Get API Key for emails
3. **Database**: Use [Neon](https://neon.tech) or any PostgreSQL provider

### 4. Run Locally

```bash
# Generate Prisma client
cd packages/db && bunx prisma generate && cd ../..

# Seed the database (optional)
cd packages/db && bunx prisma db push && cd ../..

# Start both apps
bun run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3002

### 5. Test Webhook

After creating a Zap, you'll get a webhook URL. Test it with:

```bash
curl -X POST "http://localhost:3002/api/hooks/{userId}/{zapId}" \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "message": "Hello FlowForge!"}'
```

## 🌐 Deployment (Vercel)

See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

Quick overview:

1. Create 2 Vercel projects: `flowforge-api` and `flowforge-web`
2. Set root directory to `apps/api` and `apps/web` respectively
3. Configure environment variables
4. Deploy!

## 📋 Environment Variables

### API (apps/api)

| Variable                     | Description                               |
| ---------------------------- | ----------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string              |
| `JWT_SECRET`                 | Secret for JWT tokens                     |
| `QSTASH_TOKEN`               | Upstash QStash token                      |
| `QSTASH_CURRENT_SIGNING_KEY` | For webhook verification                  |
| `QSTASH_NEXT_SIGNING_KEY`    | Rotated signing key                       |
| `RESEND_API_KEY`             | Resend API key for emails                 |
| `APP_URL`                    | Your deployed API URL (no trailing slash) |

### Web (apps/web)

| Variable              | Description                |
| --------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL` | API URL with `/api` suffix |

## 🙏 Inspiration

This project is inspired by [Zapier](https://zapier.com/), the popular workflow automation platform. FlowForge is a learning project that recreates core Zapier concepts using modern serverless technologies.

## 🎓 Credits

Built as part of the [100xDevs](https://100xdevs.com/) cohort to learn full-stack development with serverless architecture.
