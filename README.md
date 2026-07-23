# FlowForge (QStash Serverless Version)

> A serverless Zapier clone using Upstash's QStash instead of Kafka - optimized for free-tier cloud deployment.

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
│  [Webhook] [Public Form] [QStash Cron]                          │
│        │         │              │                               │
│        ▼         ▼              ▼                               │
│  /api/hooks/*  /api/forms/*  /api/cron/*                        │
│        │                                                        │
│        ├── 1. Create ZapRun (trigger payload)                   │
│        └── 2. Call /api/worker (optional WORKER_SECRET)         │
│                                                │                │
│                                                ▼                │
│                          resolveTemplates + executeAction       │
│                          (Email, HTTP, Discord, …)              │
└─────────────────────────────────────────────────────────────────┘
```

**No Processor, No Kafka, No Docker!** Cron uses QStash schedules; worker is a direct call (cost-friendly free tier).

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

- **Triggers**: Webhook, Schedule (Cron), Manual (test run), New Form Submission, RSS Feed poll
- **Actions**: Email, HTTP, Discord/Slack, Filter, Delay, Log, Set Variable (+ Sheets/Notion/Trello when keyed)
- **Templates**: `{{field}}`, `{{trigger.path}}`, `{{vars.name}}` (missing keys → empty string)
- **Auth**: JWT + optional Google/GitHub login
- **Safety (opt-in)**: `WORKER_SECRET`, per-Zap webhook HMAC, form honeypot
- **UI**: Run History with payload inspector, Test Run, starter templates (GitHub, RSS, filters)
- **Serverless**: Scales to zero; cron/RSS via QStash

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/pantha704/flowforge-qstash.git
cd flowforge-qstash
bun install
```

### 2. Environment Setup

Copy the examples (safe defaults; optional secrets leave empty):

```bash
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

| File | Purpose |
|------|---------|
| `packages/db/.env.example` | Prisma `DATABASE_URL` |
| `apps/api/.env.example` | API, QStash, Resend, optional `WORKER_SECRET` |
| `apps/web/.env.example` | `NEXT_PUBLIC_API_URL` |

```bash
# apps/api/.env.local (essentials)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
QSTASH_TOKEN="qstash_xxx"                 # From Upstash Console
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
RESEND_API_KEY="re_xxx"                   # optional
APP_URL="http://localhost:3001"           # API origin (no /api suffix)
# WORKER_SECRET=""                        # optional — when set, protects /api/worker

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
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
| `QSTASH_CURRENT_SIGNING_KEY` | For QStash webhook verification           |
| `QSTASH_NEXT_SIGNING_KEY`    | Rotated signing key                       |
| `RESEND_API_KEY`             | Resend API key for emails (optional)      |
| `APP_URL`                    | Public API URL for **QStash** callbacks (production) |
| `WORKER_SECRET`              | Optional shared secret for `/api/worker`  |

> **Local dev:** In `next dev`, the worker always calls `http://localhost:PORT` even if `APP_URL` points at Vercel — so local DB + worker stay in sync. QStash schedules still need a public `APP_URL` (or tunnel) to hit your machine.

### Web (apps/web)

| Variable              | Description                |
| --------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL` | API URL with `/api` suffix |

## 🔌 Trigger → action data flow

1. Webhook / form / cron / RSS / manual creates a `ZapRun` with trigger payload in `metadata`
2. Worker runs `resolveTemplates` then each action (Filter can stop the chain without failing)
3. `Set Variable` writes `run.vars` → later steps use `{{vars.myKey}}`

| Endpoint | Purpose |
|----------|---------|
| `POST /api/hooks/:userId/:zapId` | Webhook |
| `GET/POST /api/forms/:userId/:zapId` | Public form (+ honeypot) |
| `POST /api/cron/:zapId` | Schedule callback (QStash) |
| `POST /api/poll/rss/:zapId` | RSS poll (QStash) |
| `POST /api/zap/:id/run` | Manual / test run (JWT) |

Optional HMAC for webhooks:

```bash
BODY='{"message":"hi"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "your-secret" | awk '{print $2}')
curl -X POST "$HOOK_URL" -H "Content-Type: application/json" \
  -H "x-flowforge-signature: $SIG" -d "$BODY"
```

**GitHub recipe:** Create zap from template “GitHub → Discord”, copy webhook URL into repo → Settings → Webhooks (JSON). Filter step keeps `action=opened`.

**RSS:** First poll only baselines `lastGuid` (no flood); later new items fire the zap.

## 🤖 AI tools used

AI assistants (Claude / Cursor / Grok) helped with scaffolding UI, docs, and boilerplate.
Architecture decisions (webhook → ZapRun → worker → executors, QStash for cron, opt-in secrets, form trigger) and the runtime paths are intentionally small enough to change without AI in an interview.

## 🙏 Inspiration

This project is inspired by [Zapier](https://zapier.com/), the popular workflow automation platform. FlowForge is a learning project that recreates core Zapier concepts using modern serverless technologies.

## 🎓 Credits

Built as part of the [100xDevs](https://100xdevs.com/) cohort to learn full-stack development with serverless architecture.
