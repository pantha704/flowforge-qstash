# FlowForge

> A serverless **workflow automation** platform (Zapier-style): connect a trigger to ordered actions so recurring multi-step work is not manual.

**Assignment context:** Eubrics Part 3 — *Show us something you've automated yourself.*  
**Repo:** [github.com/pantha704/flowforge-qstash](https://github.com/pantha704/flowforge-qstash)

## Live demo

| | URL |
|---|-----|
| **Frontend** | [flowforge-qstash-web.vercel.app](https://flowforge-qstash-web.vercel.app) |
| **API** | [flowforge-qstash-api.vercel.app/api](https://flowforge-qstash-api.vercel.app/api) |

Sign up on the frontend, create a zap from a starter template, then use **Run** or a webhook/form URL to execute end-to-end.

---

## Problem → automation

**Manual pain:** Forwarding webhook events, form leads, or “when X happens do Y then Z” via copy-paste scripts and one-off curl commands.

**What FlowForge automates:**

1. Define a **Zap** = one **trigger** + ordered **actions**
2. When the trigger fires, a **ZapRun** is stored and a **worker** executes actions in order
3. Action fields can inject trigger data with `{{templates}}` (e.g. form `{{email}}` → email body)
4. Optional filters, variables, delays — without leaving the pipeline

**Example personal workflows this supports:**

- Contact form → Discord / email (with spam honeypot)
- GitHub webhook → notify Discord only when `action=opened`
- Public RSS → Discord when a new item appears
- Manual “test fire” from the dashboard with sample JSON

---

## Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + Bun workspaces |
| Web | Next.js, Tailwind, shadcn/ui, GSAP |
| API | Next.js App Router (serverless) |
| DB | PostgreSQL + Prisma |
| Cron / schedules | Upstash QStash |
| Email | Resend (optional; demo mode without key) |
| Auth | JWT (+ optional Google / GitHub OAuth) |

---

## Architecture

```
[Webhook] [Public Form] [QStash Cron] [RSS Poll] [Manual Run]
      │          │            │           │           │
      └──────────┴────────────┴───────────┴───────────┘
                            │
              Create ZapRun (trigger payload)
                            │
              POST /api/worker  (optional WORKER_SECRET)
                            │
         resolveTemplates → executeAction (per step)
         Filter can stop chain without failing the run
```

- **No Kafka / no long-running processor.** Worker is an HTTP route.
- **Local `next dev`:** worker always hits `http://localhost:PORT` so a production `APP_URL` cannot desync local DB + worker.
- **Production:** QStash schedules call your public `APP_URL` for cron/RSS.

---

## Project structure

```
flowforge-qstash/
├── apps/
│   ├── web/                 # Dashboard + zap builder
│   └── api/                 # Serverless API
│       ├── app/api/
│       │   ├── auth/        # signup, signin, OAuth, password reset
│       │   ├── zap/         # CRUD + POST /zap/:id/run (test fire)
│       │   ├── hooks/       # Webhook receiver
│       │   ├── forms/       # Public form trigger
│       │   ├── cron/        # Schedule callback
│       │   ├── poll/rss/    # RSS poll callback
│       │   ├── worker/      # Execute actions
│       │   └── runs/        # Run history
│       ├── lib/             # security, enqueue-worker, rss, catalog
│       └── .env.example
├── packages/
│   ├── db/                  # Prisma schema, seed, .env.example
│   └── executors/           # Action implementations + templates
├── DEPLOY.md
└── TODO.md
```

---

## Features

### Triggers

| Trigger | Status | Notes |
|---------|--------|--------|
| Webhook | ✅ | Optional HMAC (`webhookSecret`) |
| Schedule (Cron) | ✅ | QStash → `/api/cron/:zapId` |
| Manual | ✅ | Dashboard **Run** / `POST /api/zap/:id/run` |
| New Form Submission | ✅ | Hosted form, honeypot, embed snippet |
| RSS Feed | ✅ | QStash poll; first poll baselines only |
| Email / Sheets / Drive | Coming soon | Shown greys out in UI |

### Actions

| Action | Status | Notes |
|--------|--------|--------|
| Send Email | ✅ | Resend; demo log if no key |
| HTTP Request | ✅ | |
| Discord / Slack | ✅ | User supplies webhook URL |
| Filter Condition | ✅ | Stops remaining steps (not a failure) |
| Delay | ✅ | Max 15s (serverless-safe) |
| Log Message | ✅ | |
| Set Variable | ✅ | Later steps: `{{vars.name}}` |
| Sheets / Notion / Trello | ⚠️ | Needs OAuth or env keys |
| SMS | Stub | Needs Twilio |

### Platform

- Zap enable/disable, edit, run history with **payload inspector**
- Variable substitution: `{{field}}`, `{{trigger.path}}`, `{{vars.x}}`
- Opt-in `WORKER_SECRET` and per-zap webhook HMAC
- Starter templates on create (GitHub→Discord, Form→Email, RSS, etc.)

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) (package manager for this repo)
- PostgreSQL (e.g. [Neon](https://neon.tech))
- Optional: [Upstash QStash](https://console.upstash.com/qstash) for schedules/RSS
- Optional: [Resend](https://resend.com) for real email delivery

### 1. Clone & install

```bash
git clone https://github.com/pantha704/flowforge-qstash.git
cd flowforge-qstash
bun install
```

### 2. Environment files (from examples)

```bash
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

| Example file | Copy to | Purpose |
|--------------|---------|---------|
| `packages/db/.env.example` | `packages/db/.env` | Prisma `DATABASE_URL` |
| `apps/api/.env.example` | `apps/api/.env.local` | API secrets & integrations |
| `apps/web/.env.example` | `apps/web/.env.local` | `NEXT_PUBLIC_API_URL` |

Fill at least:

```bash
# packages/db/.env  and  apps/api/.env.local
DATABASE_URL="postgresql://..."

# apps/api/.env.local
JWT_SECRET="long-random-string"
APP_URL="http://localhost:3001"   # public URL in production (for QStash)
# QSTASH_TOKEN=...                # needed for Schedule / RSS schedules
# RESEND_API_KEY=...              # optional
# WORKER_SECRET=...               # optional — protects /api/worker

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

Full variable list lives in each `.env.example` and in the table below.

### 3. Database

```bash
cd packages/db
bunx prisma generate
bunx prisma db push
bun run seed          # registers triggers/actions catalog
cd ../..
```

Re-run `bun run seed` after pulls that add new trigger/action names.

### 4. Run locally

```bash
bun run dev
```

| App | Default URL |
|-----|-------------|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |

(`apps/api` uses port **3001**; keep `NEXT_PUBLIC_API_URL` and `APP_URL` consistent.)

### 5. Smoke-test a webhook

1. Sign up → **Create New Zap** → template **Webhook → Discord** (or Log only)
2. Save → copy webhook URL from the dashboard card
3. Fire:

```bash
curl -X POST "http://localhost:3001/api/hooks/{userId}/{zapId}" \
  -H "Content-Type: application/json" \
  -d '{"event":"test","message":"Hello FlowForge!"}'
```

4. Open **Run History** and expand **Trigger payload**.

Optional HMAC (only if the zap’s webhook secret is set):

```bash
BODY='{"message":"hi"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "your-secret" | awk '{print $2}')
curl -X POST "$HOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-flowforge-signature: $SIG" \
  -d "$BODY"
```

---

## Environment variables (summary)

### API (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL |
| `JWT_SECRET` | Yes | JWT signing |
| `APP_URL` | Prod / QStash | Public API origin (no trailing slash) |
| `QSTASH_TOKEN` | For cron/RSS | Upstash QStash |
| `QSTASH_CURRENT_SIGNING_KEY` | Optional | QStash request verification |
| `QSTASH_NEXT_SIGNING_KEY` | Optional | Key rotation |
| `RESEND_API_KEY` | Optional | Real email send |
| `WORKER_SECRET` | Optional | Shared secret for `/api/worker` |
| `NOTION_API_KEY` / `TRELLO_*` | Optional | Integrations |
| Google / GitHub OAuth vars | Optional | Login + Sheets connection |

### Web (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API base **including** `/api` |

---

## Key API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/hooks/:userId/:zapId` | Webhook trigger |
| `GET`/`POST` | `/api/forms/:userId/:zapId` | Public form |
| `POST` | `/api/cron/:zapId` | Schedule callback (QStash) |
| `POST` | `/api/poll/rss/:zapId` | RSS poll (QStash) |
| `POST` | `/api/zap/:id/run` | Manual / test run (JWT) |
| `POST` | `/api/worker` | Execute ZapRun actions |
| `GET` | `/api/runs?userId=` | Run history |

---

## Deploy

See [DEPLOY.md](./DEPLOY.md).

1. Two Vercel projects: API root `apps/api`, web root `apps/web`
2. Set env vars from the examples (production `APP_URL` + `NEXT_PUBLIC_API_URL` to the deployed hosts)
3. Run migrations/seed against production `DATABASE_URL`
4. Redeploy

---

## AI tools & keys used

Per assignment: AI may help build, but you must understand the code for a live interview.

| Area | Tooling / keys |
|------|----------------|
| **AI assistants** | Claude, Cursor, Grok — scaffolding UI/docs, iterative refactors, test scripts |
| **Not AI** | Core pipeline design: webhook/form/cron → `ZapRun` → worker → `executeAction`; QStash only for schedules; opt-in secrets; template resolution |
| **Service keys (runtime)** | `DATABASE_URL`, `JWT_SECRET`, optional `QSTASH_*`, `RESEND_API_KEY`, OAuth client IDs/secrets as needed — **never commit real secrets**; use `.env.example` only |
| **AI API keys** | None required to run FlowForge itself (no LLM in the product path) |

You should be able to change hooks → worker → executors, filters, and forms **without AI** in an interview.

---

## Further reading

- [TODO.md](./TODO.md) — feature status and next ideas  
- [DEPLOY.md](./DEPLOY.md) — Vercel deployment detail  

## Credits

Inspired by [Zapier](https://zapier.com/). Built as a full-stack serverless learning project (100xDevs cohort lineage + interview automation assignment).
