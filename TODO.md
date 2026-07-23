# FlowForge QStash - TODO / Future Work

## Triggers

| Trigger                    | Status  | Notes |
| -------------------------- | ------- | ----- |
| **Webhook**                | ✅ Done | Optional HMAC `webhookSecret` |
| **Schedule (Cron)**        | ✅ Done | QStash → `/api/cron/:zapId` |
| **Manual**                 | ✅ Done | Dashboard **Run** / `POST /api/zap/:id/run` |
| **New Form Submission**    | ✅ Done | Hosted form + honeypot + embed snippet |
| **RSS Feed**               | ✅ Done | QStash poll → `/api/poll/rss/:zapId` (public feeds) |
| **New Email Received**     | ❌ TODO | Needs inbound email provider |
| **New Row in Spreadsheet** | ❌ TODO | Google OAuth + poll/watch |
| **New File in Drive**      | ❌ TODO | Google Drive push |

Coming-soon triggers appear greys out in the picker.

---

## Actions

| Action                     | Status  | Notes |
| -------------------------- | ------- | ----- |
| **Send Email**             | ✅ Done | Resend (demo without key) |
| **HTTP Request**           | ✅ Done | Any method |
| **Send Discord Message**   | ✅ Done | User webhook URL |
| **Send Slack Message**     | ✅ Done | User webhook URL |
| **Filter Condition**       | ✅ Done | Stops pipeline (not a failure) |
| **Delay**                  | ✅ Done | Max 15s (serverless cap) |
| **Log Message**            | ✅ Done | Server logs + demo |
| **Set Variable**           | ✅ Done | `{{vars.name}}` in later steps |
| **Create Spreadsheet Row** | ⚠️      | Google OAuth |
| **Create Notion Page**     | ⚠️      | `NOTION_API_KEY` |
| **Create Trello Card**     | ⚠️      | Trello keys |
| **Send SMS**               | ❌ TODO | Twilio |

---

## Platform

### Done

- [x] Enable/disable, edit, run history
- [x] Variable substitution `{{field}}` / `{{trigger.x}}` / `{{vars.x}}`
- [x] Optional `WORKER_SECRET`, webhook HMAC
- [x] Starter templates (incl. GitHub, RSS, filter)
- [x] Test run + expandable trigger payload in history

### Next (optional / needs keys)

- [ ] Google token refresh
- [ ] Error notification email on failed runs
- [ ] Real Twilio / inbound email
- [ ] Timezone → UTC cron conversion

---

## Reseed after pull

```bash
cd packages/db && bun run seed   # or: bunx tsx seed.ts
```

New catalog rows: Manual, RSS Feed, Filter Condition, Delay, Log Message, Set Variable.
