"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MetadataFormProps {
  type: "trigger" | "action";
  name: string;
  metadata: Record<string, unknown>;
  onChange: (metadata: Record<string, unknown>) => void;
}

// Define form fields for each trigger/action type
const triggerFields: Record<string, Array<{ key: string; label: string; type: "text" | "email" | "url" | "textarea"; placeholder: string }>> = {
  "Webhook": [
    { key: "webhookUrl", label: "Webhook URL (auto-generated)", type: "url", placeholder: "Will be generated after saving" },
  ],
  "Schedule (Cron)": [
    { key: "cronExpression", label: "Cron Expression", type: "text", placeholder: "*/5 * * * * (every 5 minutes)" },
    { key: "timezone", label: "Timezone", type: "text", placeholder: "UTC" },
  ],
  "New Email Received": [
    { key: "emailAddress", label: "Email Address to Monitor", type: "email", placeholder: "inbox@example.com" },
    { key: "folder", label: "Folder", type: "text", placeholder: "INBOX" },
  ],
  "New Form Submission": [
    { key: "formId", label: "Form ID", type: "text", placeholder: "Enter your form ID" },
  ],
  "New Row in Spreadsheet": [
    { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", placeholder: "Enter Google Sheet ID" },
    { key: "sheetName", label: "Sheet Name", type: "text", placeholder: "Sheet1" },
  ],
  "New File in Drive": [
    { key: "folderId", label: "Folder ID", type: "text", placeholder: "Enter Google Drive folder ID" },
    { key: "fileType", label: "File Type (optional)", type: "text", placeholder: "pdf, jpg, etc." },
  ],
};

const actionFields: Record<string, Array<{ key: string; label: string; type: "text" | "email" | "url" | "textarea"; placeholder: string }>> = {
  "Send Email": [
    { key: "to", label: "To Email", type: "email", placeholder: "recipient@example.com" },
    { key: "subject", label: "Subject", type: "text", placeholder: "Email subject line" },
    { key: "body", label: "Body", type: "textarea", placeholder: "Email body content..." },
  ],
  "Send Slack Message": [
    { key: "channel", label: "Channel", type: "text", placeholder: "#general" },
    { key: "message", label: "Message", type: "textarea", placeholder: "Your message here..." },
  ],
  "Create Spreadsheet Row": [
    { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", placeholder: "Enter Google Sheet ID" },
    { key: "sheetName", label: "Sheet Name", type: "text", placeholder: "Sheet1" },
    { key: "values", label: "Values (comma separated)", type: "text", placeholder: "value1, value2, value3" },
  ],
  "Send Discord Message": [
    { key: "webhookUrl", label: "Discord Webhook URL", type: "url", placeholder: "https://discord.com/api/webhooks/..." },
    { key: "message", label: "Message", type: "textarea", placeholder: "Your message here..." },
  ],
  "Create Notion Page": [
    { key: "databaseId", label: "Database ID", type: "text", placeholder: "Enter Notion database ID" },
    { key: "title", label: "Page Title", type: "text", placeholder: "New page title" },
    { key: "content", label: "Content", type: "textarea", placeholder: "Page content..." },
  ],
  "Send SMS": [
    { key: "phoneNumber", label: "Phone Number", type: "text", placeholder: "+1234567890" },
    { key: "message", label: "Message", type: "textarea", placeholder: "SMS message (160 chars max)" },
  ],
  "HTTP Request": [
    { key: "url", label: "URL", type: "url", placeholder: "https://api.example.com/endpoint" },
    { key: "method", label: "Method", type: "text", placeholder: "GET, POST, PUT, DELETE" },
    { key: "body", label: "Request Body (JSON)", type: "textarea", placeholder: '{"key": "value"}' },
  ],
  "Create Trello Card": [
    { key: "listId", label: "List ID", type: "text", placeholder: "Enter Trello list ID" },
    { key: "title", label: "Card Title", type: "text", placeholder: "New card title" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Card description..." },
  ],
};

export function MetadataForm({ type, name, metadata, onChange }: MetadataFormProps) {
  const fields = type === "trigger" ? triggerFields[name] : actionFields[name];

  // If no specific fields defined, show a generic JSON input
  if (!fields || fields.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Configuration (JSON)</Label>
        <Textarea
          placeholder='{"key": "value"}'
          value={Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : ""}
          onChange={(e) => {
            try {
              const parsed = e.target.value ? JSON.parse(e.target.value) : {};
              onChange(parsed);
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="bg-background/50 font-mono text-sm min-h-20"
        />
      </div>
    );
  }

  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...metadata, [key]: value });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key} className="text-sm text-muted-foreground">
            {field.label}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={field.key}
              placeholder={field.placeholder}
              value={(metadata[field.key] as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="bg-background/50 min-h-20"
            />
          ) : (
            <Input
              id={field.key}
              type={field.type}
              placeholder={field.placeholder}
              value={(metadata[field.key] as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="bg-background/50"
            />
          )}
        </div>
      ))}
    </div>
  );
}
