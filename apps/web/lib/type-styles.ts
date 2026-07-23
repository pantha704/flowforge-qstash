import {
  Zap, Clock, Webhook, Mail, FileText, FileSpreadsheet, FolderOpen,
  Phone, Globe, Trello, Play, Rss, Filter, Timer, ScrollText, Variable
} from "lucide-react";
import { SlackIcon, DiscordIcon, NotionIcon } from "@/components/icons";
import type { ElementType } from "react";

export interface TypeStyle {
  bg: string;
  text: string;
  icon: ElementType;
  disabled?: boolean;
  disabledReason?: string;
}

// Color and icon mapping for triggers
export const TRIGGER_STYLES: Record<string, TypeStyle> = {
  "Webhook": { bg: "bg-blue-500/20", text: "text-blue-500", icon: Webhook },
  "Schedule (Cron)": { bg: "bg-purple-500/20", text: "text-purple-500", icon: Clock },
  "Manual": { bg: "bg-orange-500/20", text: "text-orange-500", icon: Play },
  "New Email Received": { bg: "bg-red-500/20", text: "text-red-500", icon: Mail },
  "New Form Submission": { bg: "bg-green-500/20", text: "text-green-500", icon: FileText },
  "RSS Feed": { bg: "bg-amber-500/20", text: "text-amber-500", icon: Rss },
  "New Row in Spreadsheet": { bg: "bg-emerald-500/20", text: "text-emerald-500", icon: FileSpreadsheet },
  "New File in Drive": { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: FolderOpen },
};

// Color and icon mapping for actions
export const ACTION_STYLES: Record<string, TypeStyle> = {
  "Send Email": { bg: "bg-red-500/20", text: "text-red-500", icon: Mail },
  "Send Slack Message": { bg: "bg-slack/20", text: "text-slack", icon: SlackIcon },
  "Create Spreadsheet Row": { bg: "bg-emerald-500/20", text: "text-emerald-500", icon: FileSpreadsheet },
  "Send Discord Message": { bg: "bg-discord/20", text: "text-discord", icon: DiscordIcon },
  "Create Notion Page": { bg: "bg-gray-800/20", text: "text-gray-100", icon: NotionIcon },
  "Send SMS": { bg: "bg-green-500/20", text: "text-green-500", icon: Phone, disabled: true, disabledReason: "Needs Twilio key" },
  "HTTP Request": { bg: "bg-cyan-500/20", text: "text-cyan-500", icon: Globe },
  "Create Trello Card": { bg: "bg-blue-500/20", text: "text-blue-500", icon: Trello },
  "Filter Condition": { bg: "bg-fuchsia-500/20", text: "text-fuchsia-400", icon: Filter },
  "Delay": { bg: "bg-slate-500/20", text: "text-slate-300", icon: Timer },
  "Log Message": { bg: "bg-lime-500/20", text: "text-lime-400", icon: ScrollText },
  "Set Variable": { bg: "bg-indigo-500/20", text: "text-indigo-300", icon: Variable },
};

// List of disabled actions for quick lookup
export const DISABLED_ACTIONS = Object.entries(ACTION_STYLES)
  .filter(([, style]) => style.disabled)
  .map(([name]) => name);

// Default style for unknown types
export const DEFAULT_STYLE: TypeStyle = { bg: "bg-primary/20", text: "text-primary", icon: Zap };

// Helper functions
export function getTriggerStyle(name: string): TypeStyle {
  return TRIGGER_STYLES[name] || DEFAULT_STYLE;
}

export function getActionStyle(name: string): TypeStyle {
  return ACTION_STYLES[name] || DEFAULT_STYLE;
}

export function isActionDisabled(name: string): boolean {
  return ACTION_STYLES[name]?.disabled ?? false;
}
