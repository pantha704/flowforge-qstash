import {
  Zap, Clock, Webhook, Mail, FileText, FileSpreadsheet, FolderOpen,
  MessageSquare, Phone, Globe, Trello
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TypeStyle {
  bg: string;
  text: string;
  icon: LucideIcon;
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
  "Send Slack Message": { bg: "bg-purple-500/20", text: "text-purple-500", icon: MessageSquare },
  "Create Spreadsheet Row": { bg: "bg-emerald-500/20", text: "text-emerald-500", icon: FileSpreadsheet },
  "Send Discord Message": { bg: "bg-indigo-500/20", text: "text-indigo-500", icon: MessageSquare },
  "Create Notion Page": { bg: "bg-gray-500/20", text: "text-gray-400", icon: FileText },
  "Send SMS": { bg: "bg-green-500/20", text: "text-green-500", icon: Phone },
  "HTTP Request": { bg: "bg-cyan-500/20", text: "text-cyan-500", icon: Globe },
  "Create Trello Card": { bg: "bg-blue-500/20", text: "text-blue-500", icon: Trello },
};

// Default style for unknown types
export const DEFAULT_STYLE: TypeStyle = { bg: "bg-primary/20", text: "text-primary", icon: Zap };

// Helper functions
export function getTriggerStyle(name: string): TypeStyle {
  return TRIGGER_STYLES[name] || DEFAULT_STYLE;
}

export function getActionStyle(name: string): TypeStyle {
  return ACTION_STYLES[name] || DEFAULT_STYLE;
}
