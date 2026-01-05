"use client";

import { useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trash2, Zap as ZapIcon } from "lucide-react";
import type { Zap } from "@/lib/types";

interface ZapCardProps {
  zap: Zap;
  onDelete: (id: string) => void;
}

export function ZapCard({ zap, onDelete }: ZapCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cardRef.current, {
        borderColor: "rgba(var(--primary), 0.5)",
        duration: 0.3,
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
      gsap.to(cardRef.current, {
        borderColor: "rgba(var(--border), 1)",
        duration: 0.3,
      });
    }
  };

  const triggerName = zap.trigger?.type?.name || "Unknown Trigger";
  const actionNames = zap.actions?.map((a) => a.type?.name).filter(Boolean) || [];

  return (
    <Card
      ref={cardRef}
      className="zap-card p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-shadow hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger and Action Flow */}
      <div className="flex items-center gap-3 mb-4">
        {/* Trigger Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <ZapIcon className="h-5 w-5" />
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />

        {/* Action Icons */}
        <div className="flex -space-x-2">
          {actionNames.length > 0 ? (
            actionNames.slice(0, 3).map((_, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground border-2 border-background"
              >
                <ZapIcon className="h-4 w-4" />
              </div>
            ))
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ZapIcon className="h-4 w-4" />
            </div>
          )}
          {actionNames.length > 3 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium border-2 border-background">
              +{actionNames.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Zap Details */}
      <h3 className="font-semibold mb-1 truncate">
        {triggerName}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 truncate">
        {actionNames.length > 0
          ? `→ ${actionNames.join(", ")}`
          : "No actions configured"}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          {zap.actions?.length || 0} action{(zap.actions?.length || 0) !== 1 ? "s" : ""}
        </span>
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
