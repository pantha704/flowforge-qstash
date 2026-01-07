"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

// Map icon names to animation classes
const ICON_ANIMATION_MAP: Record<string, string> = {
  // Triggers
  "Webhook": "animate-icon-rotate",
  "Schedule (Cron)": "animate-icon-clock",
  "New Email Received": "animate-icon-mail",
  "New Form Submission": "animate-icon-file",
  "New Row in Spreadsheet": "animate-icon-file",
  "New File in Drive": "animate-icon-folder",

  // Actions
  "Send Email": "animate-icon-mail",
  "Send Slack Message": "animate-icon-message",
  "Send Discord Message": "animate-icon-message",
  "Create Spreadsheet Row": "animate-icon-file",
  "Create Notion Page": "animate-icon-file",
  "Send SMS": "animate-icon-phone",
  "HTTP Request": "animate-icon-globe",
  "Create Trello Card": "animate-icon-trello",
};

interface AnimatedIconProps {
  icon: LucideIcon;
  name: string;
  className?: string;
  size?: number;
}

/**
 * Wrapper component that applies hover animations to icons based on their type.
 * Uses CSS animations defined in globals.css
 */
export function AnimatedIcon({
  icon: Icon,
  name,
  className = "",
  size = 16
}: AnimatedIconProps) {
  const animationClass = ICON_ANIMATION_MAP[name] || "animate-icon-zap";

  return (
    <span className={`inline-flex ${animationClass}`}>
      <Icon className={className} size={size} />
    </span>
  );
}

/**
 * HOC to wrap any icon with animation based on its purpose
 */
export function withAnimation(
  Icon: LucideIcon,
  name: string
): React.FC<{ className?: string; size?: number }> {
  return function AnimatedWrapper({ className, size }) {
    return <AnimatedIcon icon={Icon} name={name} className={className} size={size} />;
  };
}
