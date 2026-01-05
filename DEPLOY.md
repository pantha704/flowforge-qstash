# FlowForge QStash - Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository with this code
- Upstash QStash account (for QSTASH_TOKEN)
- Neon/PostgreSQL database (for DATABASE_URL)
- Resend account (for RESEND_API_KEY)

## Deployment Steps

### 1. Push to GitHub

```bash
cd flowforge-qstash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/flowforge-qstash.git
git push -u origin main
```

### 2. Deploy API (Vercel Dashboard)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:

   - **Root Directory**: `apps/api`
   - **Framework Preset**: Next.js (auto-detected)

4. Add Environment Variables:

   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   QSTASH_TOKEN=qstash_xxx
   QSTASH_CURRENT_SIGNING_KEY=sig_xxx
   QSTASH_NEXT_SIGNING_KEY=sig_xxx
   RESEND_API_KEY=re_xxx
   APP_URL=https://YOUR-API-URL.vercel.app
   ```

5. Deploy → Get URL (e.g., `flowforge-api.vercel.app`)

### 3. Deploy Web (Vercel Dashboard)

1. Create new project, same repository
2. Configure:

   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-detected)

3. Add Environment Variables:

   ```
   NEXT_PUBLIC_API_URL=https://flowforge-api.vercel.app/api
   ```

4. Deploy → Get URL (e.g., `flowforge.vercel.app`)

### 4. Update API's APP_URL

After deploying both, update the API's `APP_URL` environment variable to its actual deployed URL.

## Testing Production

```bash
# Create user
curl -X POST https://flowforge-api.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password"}'

# Trigger webhook
curl -X POST https://flowforge-api.vercel.app/api/hooks/USER_ID/ZAP_ID \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

## Environment Variables Reference

| Variable                     | Where | Description                    |
| ---------------------------- | ----- | ------------------------------ |
| `DATABASE_URL`               | API   | PostgreSQL connection string   |
| `JWT_SECRET`                 | API   | Secret for JWT signing         |
| `QSTASH_TOKEN`               | API   | From Upstash dashboard         |
| `QSTASH_CURRENT_SIGNING_KEY` | API   | For verifying QStash callbacks |
| `QSTASH_NEXT_SIGNING_KEY`    | API   | For key rotation               |
| `RESEND_API_KEY`             | API   | For sending emails             |
| `APP_URL`                    | API   | Your deployed API URL          |
| `NEXT_PUBLIC_API_URL`        | Web   | API URL for frontend           |
