"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
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

interface AddNodeButtonProps {
  hasActions?: boolean;
}

export function AddNodeButton({ hasActions = false }: AddNodeButtonProps) {
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

  // Entrance animation
  useEffect(() => {
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, []);

  // Style transition animation when hasActions changes
  useEffect(() => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.1,
        duration: 0.15,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.5)",
          });
        },
      });
    }
  }, [hasActions]);

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

  // Filled style (when no actions)
  const filledStyle = "w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center cursor-pointer border-0 outline-none hover:scale-105";

  // Dotted style (when has actions)
  const dottedStyle = "w-16 h-16 rounded-full text-cyan-500 hover:text-cyan-400 bg-transparent hover:bg-cyan-500/10 transition-all duration-300 flex items-center justify-center cursor-pointer outline-none hover:scale-105";

  const dottedBorderSvg = `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='%2306b6d4' stroke-width='2' stroke-dasharray='6%2c 8' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          ref={buttonRef}
          type="button"
          className={hasActions ? dottedStyle : filledStyle}
          style={hasActions ? { backgroundImage: dottedBorderSvg } : undefined}
          title="Add an action"
        >
          <Plus className={hasActions ? "w-6 h-6" : "w-8 h-8"} strokeWidth={hasActions ? 2 : 2.5} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add an Action</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
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
          ) : filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="w-full text-left py-4 px-4 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer border-0 bg-transparent"
                onClick={() => handleSelectAction(action)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-500 shrink-0">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-base text-foreground">{action.name}</span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8 text-base">
              No actions found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
