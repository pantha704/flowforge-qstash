import {
  Zap, Clock, Webhook, Mail, FileText, FileSpreadsheet, FolderOpen,
  Phone, Globe, Trello
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
  "New Email Received": { bg: "bg-red-500/20", text: "text-red-500", icon: Mail },
  "New Form Submission": { bg: "bg-green-500/20", text: "text-green-500", icon: FileText },
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
  "Send SMS": { bg: "bg-green-500/20", text: "text-green-500", icon: Phone, disabled: true, disabledReason: "Available soon" },
  "HTTP Request": { bg: "bg-cyan-500/20", text: "text-cyan-500", icon: Globe },
  "Create Trello Card": { bg: "bg-blue-500/20", text: "text-blue-500", icon: Trello },
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
