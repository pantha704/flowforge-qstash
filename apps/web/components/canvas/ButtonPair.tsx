"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useZapBuilderStore } from "@/lib/store";
import { getActionStyle } from "@/lib/type-styles";
import { Search } from "lucide-react";
import type { AvailableAction } from "@/lib/types";

interface ButtonPairProps {
  hasActions: boolean;
  onSave: () => void;
  canSave: boolean;
  isSaving: boolean;
}

export function ButtonPair({ hasActions, onSave, canSave, isSaving }: ButtonPairProps) {
  const { addAction } = useZapBuilderStore();
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState<AvailableAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && actions.length === 0) {
      fetchActions();
    }
  }, [isOpen, actions.length]);

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

  // Filled style (when no actions - single button)
  const filledStyle = "w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center cursor-pointer border-0 outline-none hover:scale-105";

  // Dotted style (when has actions)
  const dottedStyle = "w-16 h-16 rounded-full text-cyan-500 hover:text-cyan-400 bg-transparent hover:bg-cyan-500/10 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none hover:scale-105";

  const dottedBorderSvg = `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='%2306b6d4' stroke-width='2' stroke-dasharray='6%2c 8' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`;

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Add Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
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

          <div className="max-h-75 overflow-y-auto space-y-1">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : filteredActions.length > 0 ? (
              filteredActions.map((action) => {
                const style = getActionStyle(action.name);
                const Icon = style.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    className={`w-full text-left py-4 px-4 rounded-lg hover:${style.bg} transition-colors cursor-pointer border-0 bg-transparent`}
                    onClick={() => handleSelectAction(action)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.bg} ${style.text} shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-medium text-base text-foreground">{action.name}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8 text-base">
                No actions found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      {hasActions && (
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center cursor-pointer border-0 outline-none hover:scale-105 disabled:hover:scale-100"
          title="Save Zap"
        >
          {isSaving ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Save className="w-8 h-8" strokeWidth={2.5} />
          )}
        </button>
      )}
    </div>
  );
}
