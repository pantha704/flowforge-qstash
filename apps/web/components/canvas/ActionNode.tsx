"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetadataForm } from "./MetadataForm";
import { useZapBuilderStore } from "@/lib/store";
import { Zap, Trash2, GripVertical } from "lucide-react";
import type { ZapBuilderAction } from "@/lib/types";

interface ActionNodeProps {
  action: ZapBuilderAction;
  index: number;
}

export function ActionNode({ action, index }: ActionNodeProps) {
  const { removeAction, updateActionMetadata } = useZapBuilderStore();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        height: 0,
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, []);

  const handleDelete = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        height: 0,
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => removeAction(action.id),
      });
    }
  };

  return (
    <Card
      ref={cardRef}
      className="p-5 bg-card/80 backdrop-blur-sm border-border/50 transition-all hover:border-primary/30"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1 cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-4 w-4" />
          <span className="text-[10px] font-mono">{index + 1}</span>
        </div>

        {/* Action Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shrink-0">
          <Zap className="h-5 w-5" />
        </div>

        {/* Action Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Action
              </p>
              <h4 className="font-semibold truncate">
                {action.availableAction.name}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Metadata Form */}
          <MetadataForm
            type="action"
            name={action.availableAction.name}
            metadata={action.actionMetadata}
            onChange={(metadata) => updateActionMetadata(action.id, metadata)}
          />
        </div>
      </div>
    </Card>
  );
}
