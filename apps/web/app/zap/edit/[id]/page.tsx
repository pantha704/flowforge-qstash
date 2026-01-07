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
import { ArrowLeft, ArrowUp, Save, Loader2, Repeat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Zap, AvailableTrigger, ZapBuilderAction } from "@/lib/types";

export default function EditZapPage() {
  const router = useRouter();
  const params = useParams();
  const zapId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { selectedTrigger, triggerMetadata, actions, reset, hydrate, editingZapId } = useZapBuilderStore();
  const hasHydratedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maxRuns, setMaxRuns] = useState<number>(-1);
  const [customRuns, setCustomRuns] = useState<string>("");
  const [zapName, setZapName] = useState<string>("");
  const [zapDescription, setZapDescription] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [originalActionIds, setOriginalActionIds] = useState<Set<string>>(new Set());

  // Fetch existing zap data and hydrate store
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch if we haven't hydrated for this zap yet
    if (editingZapId !== zapId && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
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

          // Track original action IDs (from database)
          setOriginalActionIds(new Set(zap.actions.map((a) => a.id)));

          // Set max runs
          setMaxRuns(zap.maxRuns || -1);
          if (zap.maxRuns && zap.maxRuns > 10) {
            setMaxRuns(0);
            setCustomRuns(zap.maxRuns.toString());
          }

          // Set name/description
          setZapName(zap.name || "");
          setZapDescription(zap.description || "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, zapId]);

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


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
          // Only include id if this action came from the database
          id: originalActionIds.has(a.id) ? a.id : undefined,
          availableActionId: a.availableAction.id,
          actionMetadata: a.actionMetadata,
        })),
        maxRuns: maxRuns === 0 ? parseInt(customRuns) || -1 : maxRuns,
        name: zapName || undefined,
        description: zapDescription || undefined,
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
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="shrink-0 h-8 w-8 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Edit Zap</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Modify your automation workflow
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 md:gap-4 justify-end">
            {/* Repeat Limit Selector */}
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Select
                value={maxRuns.toString()}
                onValueChange={(val) => setMaxRuns(parseInt(val))}
              >
                <SelectTrigger className="w-24 md:w-28 h-8 md:h-9 text-xs md:text-sm">
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
                  className="w-14 md:w-16 h-8 md:h-9"
                />
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="gap-1.5 md:gap-2 h-8 md:h-9 text-xs md:text-sm px-3 md:px-4"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={canvasRef} className="flex flex-col items-center">
          {/* Step 1: Name & Description */}
          <Card className="w-full max-w-lg p-5 bg-card/80 backdrop-blur-sm border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                1
              </div>
              <h3 className="font-medium">Zap Details</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zapName" className="text-sm font-medium">
                  Zap Name
                </Label>
                <Input
                  id="zapName"
                  placeholder="e.g., Send Slack alerts for new emails"
                  value={zapName}
                  onChange={(e) => setZapName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zapDescription" className="text-sm text-muted-foreground">
                  Description (optional)
                </Label>
                <Textarea
                  id="zapDescription"
                  placeholder="Briefly describe what this automation does..."
                  value={zapDescription}
                  onChange={(e) => setZapDescription(e.target.value)}
                  className="min-h-16 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Connector Line */}
          <div className="flex justify-center">
            <ConnectorLine />
          </div>

          {/* Step 2: Trigger Node */}
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-2 mb-2 pl-1">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                2
              </div>
              <h3 className="font-medium text-sm text-muted-foreground">Trigger</h3>
            </div>
            <TriggerNode />
          </div>

          {/* Connector Line */}
          {selectedTrigger && (
            <div className="flex justify-center">
              <ConnectorLine />
            </div>
          )}

          {/* Step 3: Action Nodes */}
          {selectedTrigger && actions.length > 0 && (
            <div className="flex items-center gap-2 mb-2 pl-1 w-full max-w-lg">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                3
              </div>
              <h3 className="font-medium text-sm text-muted-foreground">Actions</h3>
            </div>
          )}

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

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all"
            title="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
