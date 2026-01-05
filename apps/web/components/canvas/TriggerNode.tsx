"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
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
import { getTriggerStyle } from "@/lib/type-styles";
import { Search, ChevronRight } from "lucide-react";
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
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
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

  // Get style for selected trigger
  const selectedStyle = selectedTrigger ? getTriggerStyle(selectedTrigger.name) : getTriggerStyle("");
  const SelectedIcon = selectedStyle.icon;

  return (
    <>
      <Card
        ref={cardRef}
        className="p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-all hover:border-cyan-500/30"
      >
        {/* Header - Clickable to open dialog */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${selectedStyle.bg} ${selectedStyle.text} shrink-0`}>
            <SelectedIcon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">
              Trigger
            </p>
            <h3 className="font-semibold text-lg truncate">
              {selectedTrigger ? selectedTrigger.name : "Select a Trigger"}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* Metadata Form */}
        {selectedTrigger && (
          <div className="mt-6 pt-6 border-t border-border/50">
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
            <DialogTitle className="text-lg font-semibold">Select a Trigger</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search triggers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : filteredTriggers.length > 0 ? (
              filteredTriggers.map((trigger) => {
                const style = getTriggerStyle(trigger.name);
                const Icon = style.icon;
                return (
                  <button
                    key={trigger.id}
                    type="button"
                    className={`w-full text-left py-4 px-4 rounded-lg hover:${style.bg} transition-colors cursor-pointer border-0 bg-transparent`}
                    onClick={() => handleSelectTrigger(trigger)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.bg} ${style.text} shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-medium text-base text-foreground">{trigger.name}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8 text-base">
                No triggers found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
