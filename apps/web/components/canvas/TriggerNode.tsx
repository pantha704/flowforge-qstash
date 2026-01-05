"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MetadataForm } from "./MetadataForm";
import { api } from "@/lib/api";
import { useZapBuilderStore } from "@/lib/store";
import { Zap, Search, ChevronRight, Edit2 } from "lucide-react";
import type { AvailableTrigger } from "@/lib/types";

export function TriggerNode() {
  const { selectedTrigger, setTrigger, triggerMetadata, setTriggerMetadata } = useZapBuilderStore();
  const [isOpen, setIsOpen] = useState(false);
  const [triggers, setTriggers] = useState<AvailableTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggers.length === 0) {
      fetchTriggers();
    }
  }, [isOpen, triggers.length]);

  useEffect(() => {
    if (selectedTrigger && cardRef.current) {
      gsap.from(cardRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [selectedTrigger]);

  const fetchTriggers = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAvailableTriggers();
      if (response.success) {
        setTriggers(response.availableTriggers);
      }
    } catch (error) {
      console.error("Failed to fetch triggers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrigger = (trigger: AvailableTrigger) => {
    setTrigger(trigger);
    setTriggerMetadata({}); // Reset metadata when changing trigger
    setIsOpen(false);
  };

  const filteredTriggers = triggers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card
        ref={cardRef}
        className="p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-all hover:border-primary/30"
      >
        {/* Header - Clickable to open dialog */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Trigger
            </p>
            <h3 className="font-semibold truncate">
              {selectedTrigger ? selectedTrigger.name : "Select a Trigger"}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedTrigger && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Metadata Form */}
        {selectedTrigger && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <MetadataForm
              type="trigger"
              name={selectedTrigger.name}
              metadata={triggerMetadata}
              onChange={setTriggerMetadata}
            />
          </div>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Trigger</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search triggers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-75 overflow-y-auto space-y-2">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : filteredTriggers.length > 0 ? (
              filteredTriggers.map((trigger) => (
                <Button
                  key={trigger.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleSelectTrigger(trigger)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{trigger.name}</span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No triggers found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
