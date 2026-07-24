/**
 * Which triggers are fully wired end-to-end.
 * Everything else is "coming soon" (shown in UI but not selectable / rejected on create).
 */
export const READY_TRIGGER_NAMES = [
  "Webhook",
  "Schedule (Cron)",
  "Manual",
  "New Form Submission",
  "RSS Feed",
] as const;

export type ReadyTriggerName = (typeof READY_TRIGGER_NAMES)[number];

/** Human-readable reasons for greying out unfinished triggers */
export const TRIGGER_UNAVAILABLE_REASON: Record<string, string> = {
  "New Email Received": "Coming soon — needs inbound email provider",
  "New Row in Spreadsheet": "Coming soon — needs Google Sheets OAuth + poll",
  "New File in Drive": "Coming soon — needs Google Drive OAuth + poll",
};

export function isTriggerReady(name: string): boolean {
  return (READY_TRIGGER_NAMES as readonly string[]).includes(name);
}

export function getTriggerUnavailableReason(name: string): string {
  return (
    TRIGGER_UNAVAILABLE_REASON[name] ||
    "This trigger is not set up yet (coming soon)"
  );
}
