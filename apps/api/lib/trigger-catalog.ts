/**
 * Which triggers are fully wired end-to-end.
 * Everything else is "coming soon" (shown in UI but not selectable).
 */
export const READY_TRIGGER_NAMES = [
  "Webhook",
  "Schedule (Cron)",
  "Manual",
  "New Form Submission",
  "RSS Feed",
] as const;

export type ReadyTriggerName = (typeof READY_TRIGGER_NAMES)[number];

export function isTriggerReady(name: string): boolean {
  return (READY_TRIGGER_NAMES as readonly string[]).includes(name);
}
