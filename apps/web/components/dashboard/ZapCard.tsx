"use client";

import { useState } from "react";
import { useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight, Trash2, Zap as ZapIcon, Copy, Check, Clock, Webhook, Calendar,
  Mail, FileSpreadsheet, FolderOpen, FileText, MessageSquare, Globe, Trello, Phone, Play, Infinity
} from "lucide-react";
import { toast } from "sonner";
import type { Zap } from "@/lib/types";

// Animation class mapping for icons
const ICON_ANIMATIONS: Record<string, string> = {
  "Webhook": "animate-icon-rotate",
  "Schedule (Cron)": "animate-icon-clock",
  "New Email Received": "animate-icon-mail",
  "New Form Submission": "animate-icon-file",
  "New Row in Spreadsheet": "animate-icon-file",
  "New File in Drive": "animate-icon-folder",
  "Send Email": "animate-icon-mail",
  "Send Slack Message": "animate-icon-message",
  "Send Discord Message": "animate-icon-message",
  "Create Spreadsheet Row": "animate-icon-file",
  "Create Notion Page": "animate-icon-file",
  "Send SMS": "animate-icon-phone",
  "HTTP Request": "animate-icon-globe",
  "Create Trello Card": "animate-icon-trello",
};

interface ZapCardProps {
  zap: Zap;
  onDelete: (id: string) => void;
  onToggle?: (id: string, isActive: boolean) => Promise<void>;
}

// Color and icon mapping for triggers
const TRIGGER_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  "Webhook": { bg: "bg-blue-500/20", text: "text-blue-500", icon: Webhook },
  "Schedule (Cron)": { bg: "bg-purple-500/20", text: "text-purple-500", icon: Clock },
  "New Email Received": { bg: "bg-red-500/20", text: "text-red-500", icon: Mail },
  "New Form Submission": { bg: "bg-green-500/20", text: "text-green-500", icon: FileText },
  "New Row in Spreadsheet": { bg: "bg-emerald-500/20", text: "text-emerald-500", icon: FileSpreadsheet },
  "New File in Drive": { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: FolderOpen },
};

// Color and icon mapping for actions
const ACTION_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
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
const DEFAULT_STYLE = { bg: "bg-primary/20", text: "text-primary", icon: ZapIcon };

export function ZapCard({ zap, onDelete, onToggle }: ZapCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(zap.isActive ?? true);
  const [isToggling, setIsToggling] = useState(false);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const triggerName = zap.trigger?.type?.name || "Unknown Trigger";
  const triggerStyle = TRIGGER_STYLES[triggerName] || DEFAULT_STYLE;
  const TriggerIcon = triggerStyle.icon;

  const actions = zap.actions || [];
  const isWebhookTrigger = triggerName === "Webhook";
  const isScheduleTrigger = triggerName === "Schedule (Cron)";

  // Construct webhook URL
  const webhookUrl = isWebhookTrigger
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/hooks/${zap.userId}/${zap.id}`
    : null;

  // Get schedule info from trigger metadata
  const scheduleInfo = isScheduleTrigger && zap.trigger?.payload
    ? (zap.trigger.payload as { cronExpression?: string; timezone?: string })
    : null;

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (webhookUrl) {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Webhook URL copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!onToggle || isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(zap.id, checked);
      setIsActive(checked);
    } finally {
      setIsToggling(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      ref={cardRef}
      className={`zap-card p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-all hover:shadow-lg hover:shadow-primary/5 ${!isActive ? 'opacity-60' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header: Trigger Badge + Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${triggerStyle.bg} ${triggerStyle.text}`}>
          <TriggerIcon className="w-3 h-3" />
          {triggerName}
        </div>
        {onToggle && (
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isActive ? 'text-green-500' : 'text-muted-foreground'}`}>
              {isActive ? 'Active' : 'Paused'}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={isToggling}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        )}
      </div>

      {/* Trigger and Action Flow */}
      <div className="flex items-center gap-3 mb-4">
        {/* Trigger Icon */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${triggerStyle.bg} ${triggerStyle.text} ${ICON_ANIMATIONS[triggerName] || 'animate-icon-zap'}`}>
          <TriggerIcon className="h-5 w-5" />
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />

        {/* Action Icons */}
        <div className="flex -space-x-2">
          {actions.length > 0 ? (
            actions.slice(0, 3).map((action, index) => {
              const actionName = action.type?.name || "Unknown";
              const actionStyle = ACTION_STYLES[actionName] || DEFAULT_STYLE;
              const ActionIcon = actionStyle.icon;
              return (
                <div
                  key={index}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${actionStyle.bg} ${actionStyle.text} border-2 border-background ${ICON_ANIMATIONS[actionName] || 'animate-icon-zap'}`}
                  title={actionName}
                >
                  <ActionIcon className="h-4 w-4" />
                </div>
              );
            })
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ZapIcon className="h-4 w-4" />
            </div>
          )}
          {actions.length > 3 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium border-2 border-background">
              +{actions.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Action Badges + Run Stats Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {actions.length > 0 ? (
            actions.map((action, index) => {
              const actionName = action.type?.name || "Unknown";
              const actionStyle = ACTION_STYLES[actionName] || DEFAULT_STYLE;
              const ActionIcon = actionStyle.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${actionStyle.bg} ${actionStyle.text} ${ICON_ANIMATIONS[actionName] || 'animate-icon-zap'}`}
                >
                  <ActionIcon className="w-3 h-3" />
                  <span className="truncate max-w-24">{actionName}</span>
                </div>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground">No actions</span>
          )}
        </div>

        {/* Run Statistics - Right aligned */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
          title={
            zap.maxRuns === -1 || zap.maxRuns === undefined
              ? "Unlimited runs"
              : `${zap._count?.ZapRuns ?? 0} of ${zap.maxRuns} runs used`
          }
        >
          <span className="font-medium">{zap._count?.ZapRuns ?? 0}</span>|
          {zap.maxRuns === -1 || zap.maxRuns === undefined ? (
            <Infinity className="w-3 h-3" />
          ) : (
            <span>/ {zap.maxRuns}</span>
          )}
        </div>
      </div>

      {/* Webhook URL (for webhook triggers) */}
      {isWebhookTrigger && webhookUrl && (
        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-muted-foreground truncate flex-1" title={webhookUrl}>
              {webhookUrl}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUrl}
              className="h-7 w-7 p-0 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Info (for schedule triggers) */}
      {isScheduleTrigger && scheduleInfo?.cronExpression && (
        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
          <code className="text-xs text-muted-foreground">
            {scheduleInfo.cronExpression}
            {scheduleInfo.timezone && ` (${scheduleInfo.timezone})`}
          </code>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ZapIcon className="w-3 h-3" />
            {actions.length} action{actions.length !== 1 ? "s" : ""}
          </span>
          {zap.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(zap.createdAt)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(zap.id);
          }}
          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
