"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Clock, Globe, Calendar, Repeat } from "lucide-react";
import { toast } from "sonner";

interface MetadataFormProps {
  type: "trigger" | "action";
  name: string;
  metadata: Record<string, unknown>;
  onChange: (metadata: Record<string, unknown>) => void;
}

// Common timezones
const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "America/New_York (EST)", value: "America/New_York" },
  { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
  { label: "Europe/London (GMT)", value: "Europe/London" },
  { label: "Europe/Paris (CET)", value: "Europe/Paris" },
  { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Asia/Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Australia/Sydney (AEDT)", value: "Australia/Sydney" },
];

// Time interval units
const INTERVAL_UNITS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
];

// Convert user-friendly schedule to cron expression
function buildCronExpression(
  startTime: string,
  intervalValue: number,
  intervalUnit: string
): string {
  const [hours, minutes] = startTime.split(":").map(Number);

  switch (intervalUnit) {
    case "minutes":
      return `*/${intervalValue} * * * *`;
    case "hours":
      return `${minutes} */${intervalValue} * * *`;
    case "days":
      return `${minutes} ${hours} */${intervalValue} * *`;
    case "weeks":
      return `${minutes} ${hours} * * 0`; // Every week on Sunday
    case "months":
      return `${minutes} ${hours} 1 */${intervalValue} *`;
    default:
      return `*/${intervalValue} * * * *`;
  }
}

// Enhanced Scheduler Form Component
function SchedulerForm({ metadata, onChange }: { metadata: Record<string, unknown>; onChange: (m: Record<string, unknown>) => void }) {
  const [startTime, setStartTime] = useState((metadata.startTime as string) || "12:00");
  const [timezone, setTimezone] = useState((metadata.timezone as string) || "UTC");
  const [intervalValue, setIntervalValue] = useState((metadata.intervalValue as number) || 30);
  const [intervalUnit, setIntervalUnit] = useState((metadata.intervalUnit as string) || "minutes");
  const [startDate, setStartDate] = useState((metadata.startDate as string) || new Date().toISOString().split("T")[0]);
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [customCron, setCustomCron] = useState((metadata.cronExpression as string) || "");

  // Update parent when values change
  useEffect(() => {
    const cronExpression = useAdvanced ? customCron : buildCronExpression(startTime, intervalValue, intervalUnit);
    onChange({
      cronExpression,
      timezone,
      startTime,
      intervalValue,
      intervalUnit,
      startDate,
    });
  }, [startTime, timezone, intervalValue, intervalUnit, startDate, useAdvanced, customCron]);

  return (
    <div className="space-y-4">
      {/* Toggle between simple and advanced */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setUseAdvanced(false)}
          className={`px-3 py-1.5 rounded-lg transition-colors ${!useAdvanced ? "bg-cyan-500/20 text-cyan-500" : "text-muted-foreground hover:bg-muted"}`}
        >
          Simple
        </button>
        <button
          type="button"
          onClick={() => setUseAdvanced(true)}
          className={`px-3 py-1.5 rounded-lg transition-colors ${useAdvanced ? "bg-cyan-500/20 text-cyan-500" : "text-muted-foreground hover:bg-muted"}`}
        >
          Advanced (Cron)
        </button>
      </div>

      {!useAdvanced ? (
        <>
          {/* Start Time */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Start Time
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-input/20 dark:bg-input/30">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Repeat Interval */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Repeat every
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                className="bg-background/50 w-24"
              />
              <Select value={intervalUnit} onValueChange={setIntervalUnit}>
                <SelectTrigger className="bg-input/20 dark:bg-input/30 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Starting from
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* Generated Cron Preview */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Cron: </span>
            <code className="text-cyan-500 font-mono">
              {buildCronExpression(startTime, intervalValue, intervalUnit)}
            </code>
          </div>
        </>
      ) : (
        /* Advanced Cron Input */
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Cron Expression</Label>
          <Input
            placeholder="*/5 * * * * (minute hour day month weekday)"
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            className="bg-background/50 font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: minute hour day month weekday
          </p>
        </div>
      )}
    </div>
  );
}

// Enhanced Webhook Form Component
function WebhookForm({ metadata, onChange }: { metadata: Record<string, unknown>; onChange: (m: Record<string, unknown>) => void }) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = (metadata.webhookUrl as string) || "";

  const handleCopy = async () => {
    if (webhookUrl) {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Webhook URL copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Webhook URL</Label>
        <div className="flex gap-2">
          <Input
            value={webhookUrl || "Save the Zap to generate URL"}
            readOnly
            className="bg-background/50 font-mono text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={!webhookUrl}
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          External services will POST data to this URL to trigger your Zap
        </p>
      </div>

      {/* Optional: Webhook Secret */}
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Webhook Secret (optional)</Label>
        <Input
          placeholder="Leave empty for no signature verification"
          value={(metadata.webhookSecret as string) || ""}
          onChange={(e) => onChange({ ...metadata, webhookSecret: e.target.value })}
          className="bg-background/50 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Used to verify webhook signatures (HMAC-SHA256)
        </p>
      </div>
    </div>
  );
}

// Define form fields for each trigger/action type
const actionFields: Record<string, Array<{ key: string; label: string; type: "text" | "email" | "url" | "textarea"; placeholder: string }>> = {
  "Send Email": [
    { key: "to", label: "To Email", type: "email", placeholder: "recipient@example.com" },
    { key: "subject", label: "Subject", type: "text", placeholder: "Email subject line" },
    { key: "body", label: "Body", type: "textarea", placeholder: "Email body content..." },
  ],
  "Send Slack Message": [
    { key: "webhookUrl", label: "Slack Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." },
    { key: "channel", label: "Channel (optional)", type: "text", placeholder: "#general" },
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
  // Special forms for triggers
  if (type === "trigger") {
    if (name === "Schedule (Cron)") {
      return <SchedulerForm metadata={metadata} onChange={onChange} />;
    }
    if (name === "Webhook") {
      return <WebhookForm metadata={metadata} onChange={onChange} />;
    }
    // Generic trigger form
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Configuration</Label>
        <Textarea
          placeholder='{"key": "value"}'
          value={Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : ""}
          onChange={(e) => {
            try {
              const parsed = e.target.value ? JSON.parse(e.target.value) : {};
              onChange(parsed);
            } catch {
              // Invalid JSON
            }
          }}
          className="bg-background/50 font-mono text-sm min-h-20"
        />
      </div>
    );
  }

  // Action forms
  const fields = actionFields[name];

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
              // Invalid JSON
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
