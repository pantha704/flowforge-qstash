# FlowForge QStash - TODO / Future Work

## Triggers

| Trigger                    | Status  | Implementation Notes                                                   |
| -------------------------- | ------- | ---------------------------------------------------------------------- |
| **Webhook**                | ✅ Done | External services call `/api/hooks/:userId/:zapId`                     |
| **Schedule (Cron)**        | ✅ Done | `/api/schedule` - Uses QStash Schedules API                            |
| **New Email Received**     | ❌ TODO | Requires email provider with inbound hooks (Resend, Mailgun, SendGrid) |
| **New Form Submission**    | ❌ TODO | Build form builder + public form endpoints                             |
| **New Row in Spreadsheet** | ❌ TODO | Google Sheets API + OAuth + polling/webhooks                           |
| **New File in Drive**      | ❌ TODO | Google Drive API + OAuth + push notifications                          |

---

## Actions

| Action                     | Status  | Implementation Notes              |
| -------------------------- | ------- | --------------------------------- |
| **Send Email**             | ✅ Done | Uses Resend API                   |
| **HTTP Request**           | ✅ Done | Fetch with any method             |
| **Send Discord Message**   | ✅ Done | Discord webhooks                  |
| **Send Slack Message**     | ⚠️ Demo | Needs Slack webhook URL from user |
| **Send SMS**               | ❌ TODO | Needs Twilio integration          |
| **Create Spreadsheet Row** | ❌ TODO | Needs Google Sheets API + OAuth   |
| **Create Notion Page**     | ❌ TODO | Needs Notion API integration      |
| **Create Trello Card**     | ❌ TODO | Needs Trello API integration      |

---

## Future Features

### High Priority

- [ ] Zap enable/disable toggle
- [ ] Zap run history UI (list past executions)
- [ ] Zap editing (currently create-only)
- [ ] Error notifications to user

### Medium Priority

- [ ] OAuth flow for Google, Slack, Notion, Trello
- [ ] Variable substitution in actions (use trigger data in email body)
- [ ] Multiple zap runs pagination
- [ ] Rate limiting per user

### Low Priority

- [ ] Template zaps (pre-built workflows)
- [ ] Zap sharing/marketplace
- [ ] Team/organization support
- [ ] Audit logs

---

## Third-Party Integrations Needed

| Service       | API/SDK       | Auth Method              |
| ------------- | ------------- | ------------------------ |
| Google Sheets | `googleapis`  | OAuth 2.0                |
| Google Drive  | `googleapis`  | OAuth 2.0                |
| Slack         | Slack Web API | OAuth 2.0 or Webhook URL |
| Twilio        | `twilio`      | API Key                  |
| Notion        | Notion API    | API Key                  |
| Trello        | Trello API    | API Key                  |
