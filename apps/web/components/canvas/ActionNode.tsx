"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
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
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, []);

  const handleDelete = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
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
      className="p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-all hover:border-cyan-500/30"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1 cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-5 w-5" />
          <span className="text-xs font-mono font-medium">{index + 1}</span>
        </div>

        {/* Action Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
          <Zap className="h-7 w-7" />
        </div>

        {/* Action Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                Action
              </p>
              <h4 className="font-semibold text-lg truncate">
                {action.availableAction.name}
              </h4>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
              onClick={handleDelete}
              title="Remove action"
            >
              <Trash2 className="h-5 w-5" />
            </button>
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
