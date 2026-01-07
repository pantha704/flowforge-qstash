"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { TriggerNode } from "@/components/canvas/TriggerNode";
import { ActionNode } from "@/components/canvas/ActionNode";
import { ConnectorLine } from "@/components/canvas/ConnectorLine";
import { ButtonPair } from "@/components/canvas/ButtonPair";
import { api } from "@/lib/api";
import { useZapBuilderStore, useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Repeat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Zap, AvailableTrigger, ZapBuilderAction } from "@/lib/types";

export default function EditZapPage() {
  const router = useRouter();
  const params = useParams();
  const zapId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { selectedTrigger, triggerMetadata, actions, reset, hydrate, editingZapId } = useZapBuilderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maxRuns, setMaxRuns] = useState<number>(-1);
  const [customRuns, setCustomRuns] = useState<string>("");

  // Fetch existing zap data and hydrate store
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch if we haven't hydrated for this zap yet
    if (editingZapId !== zapId) {
      const fetchZap = async () => {
        try {
          const response = await api.getZap(zapId);
          const zap: Zap = response.zap;

          // Convert to store format
          if (!zap.trigger) {
            toast.error("Zap has no trigger configured");
            router.push("/dashboard");
            return;
          }

          const trigger: AvailableTrigger = {
            id: zap.trigger.type.id,
            name: zap.trigger.type.name,
          };

          const zapActions: ZapBuilderAction[] = zap.actions.map((action) => ({
            id: action.id,
            availableAction: {
              id: action.type.id,
              name: action.type.name,
            },
            actionMetadata: (action.metadata as Record<string, unknown>) || {},
          }));

          const triggerMeta = (zap.trigger.payload as Record<string, unknown>) || {};

          // Hydrate store
          hydrate(zapId, trigger, triggerMeta, zapActions);

          // Set max runs
          setMaxRuns(zap.maxRuns || -1);
          if (zap.maxRuns && zap.maxRuns > 10) {
            setMaxRuns(0);
            setCustomRuns(zap.maxRuns.toString());
          }
        } catch {
          toast.error("Failed to load zap");
          router.push("/dashboard");
        } finally {
          setIsLoading(false);
        }
      };

      fetchZap();
    } else {
      setIsLoading(false);
    }

    return () => reset();
  }, [isAuthenticated, router, zapId, hydrate, editingZapId, reset]);

  useGSAP(
    () => {
      if (!isLoading) {
        gsap.from(headerRef.current, {
          y: -30,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        });

        gsap.from(canvasRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          delay: 0.2,
          ease: "power3.out",
        });
      }
    },
    { scope: containerRef, dependencies: [isLoading] }
  );

  const handleSave = async () => {
    if (!selectedTrigger) {
      toast.error("Please select a trigger");
      return;
    }

    if (actions.length === 0) {
      toast.error("Please add at least one action");
      return;
    }

    setIsSaving(true);

    try {
      await api.updateZap(zapId, {
        triggerMetadata,
        actions: actions.map((a) => ({
          id: a.id,
          availableActionId: a.availableAction.id,
          actionMetadata: a.actionMetadata,
        })),
        maxRuns: maxRuns === 0 ? parseInt(customRuns) || -1 : maxRuns,
      });

      toast.success("Zap updated successfully!");
      reset();
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update zap");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!(selectedTrigger && actions.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-64px)] p-4 md:p-8">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div ref={headerRef} className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Zap</h1>
              <p className="text-sm text-muted-foreground">
                Modify your automation workflow
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Repeat Limit Selector */}
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={maxRuns.toString()}
                onValueChange={(val) => setMaxRuns(parseInt(val))}
              >
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder="Runs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Forever</SelectItem>
                  <SelectItem value="1">Once</SelectItem>
                  <SelectItem value="2">Twice</SelectItem>
                  <SelectItem value="5">5 times</SelectItem>
                  <SelectItem value="10">10 times</SelectItem>
                  <SelectItem value="0">Custom</SelectItem>
                </SelectContent>
              </Select>
              {maxRuns === 0 && (
                <Input
                  type="number"
                  min="1"
                  placeholder="#"
                  value={customRuns}
                  onChange={(e) => setCustomRuns(e.target.value)}
                  className="w-16 h-9"
                />
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="gap-2 h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={canvasRef} className="flex flex-col items-center">
          {/* Trigger Node - Read-only for editing (trigger type can't change) */}
          <div className="w-full max-w-lg">
            <TriggerNode />
          </div>

          {/* Connector Line */}
          {selectedTrigger && (
            <div className="flex justify-center">
              <ConnectorLine />
            </div>
          )}

          {/* Action Nodes */}
          {actions.map((action, index) => (
            <div key={action.id} className="w-full max-w-lg">
              <ActionNode action={action} index={index} />
            </div>
          ))}

          {/* Add Action Button + Save Button */}
          {selectedTrigger && (
            <div className="py-4">
              <ButtonPair
                hasActions={actions.length > 0}
                onSave={handleSave}
                canSave={canSave}
                isSaving={isSaving}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
