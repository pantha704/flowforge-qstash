"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useZapBuilderStore } from "@/lib/store";
import { Plus, Search, Zap } from "lucide-react";
import type { AvailableAction } from "@/lib/types";

export function AddNodeButton() {
  const { addAction } = useZapBuilderStore();
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState<AvailableAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && actions.length === 0) {
      fetchActions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (buttonRef.current) {
      gsap.from(buttonRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(1.7)",
      });
    }
  }, []);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAvailableActions();
      if (response.success) {
        setActions(response.availableActions);
      }
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAction = (action: AvailableAction) => {
    addAction(action);
    setIsOpen(false);
  };

  const filteredActions = actions.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full border-dashed border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all group"
        >
          <Plus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an Action</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          ) : filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleSelectAction(action)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{action.name}</span>
                </div>
              </Button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No actions found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
