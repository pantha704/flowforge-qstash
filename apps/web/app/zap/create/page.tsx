"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState } from "react";

export default function CreateZapPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { selectedTrigger, triggerMetadata, actions, reset } = useZapBuilderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
    // Reset store when component unmounts
    return () => reset();
  }, [isAuthenticated, router, reset]);

  useGSAP(
    () => {
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
    },
    { scope: containerRef }
  );

  // Validation: check if all required metadata fields are filled
  const validateMetadata = () => {
    // Check trigger metadata for Schedule (Cron)
    if (selectedTrigger?.name === "Schedule (Cron)") {
      if (!triggerMetadata.cronExpression) {
        toast.error("Please select a schedule frequency");
        return false;
      }
    }

    // Check action metadata
    for (const action of actions) {
      const actionName = action.availableAction.name;
      const metadata = action.actionMetadata;

      if (actionName === "Send Email") {
        if (!metadata.to || !metadata.subject || !metadata.body) {
          toast.error(`Please fill in all required fields for "${actionName}"`);
          return false;
        }
      } else if (actionName === "Send Slack Message") {
        if (!metadata.channel || !metadata.message) {
          toast.error(`Please fill in all required fields for "${actionName}"`);
          return false;
        }
      } else if (actionName === "Send Discord Message") {
        if (!metadata.webhookUrl || !metadata.message) {
          toast.error(`Please fill in all required fields for "${actionName}"`);
          return false;
        }
      } else if (actionName === "Send SMS") {
        if (!metadata.phoneNumber || !metadata.message) {
          toast.error(`Please fill in all required fields for "${actionName}"`);
          return false;
        }
      } else if (actionName === "HTTP Request") {
        if (!metadata.url) {
          toast.error(`Please fill in the URL for "${actionName}"`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!selectedTrigger) {
      toast.error("Please select a trigger");
      return;
    }

    if (actions.length === 0) {
      toast.error("Please add at least one action");
      return;
    }

    if (!validateMetadata()) {
      return;
    }

    setIsSaving(true);

    try {
      await api.createZap({
        triggerId: selectedTrigger.id,
        triggerMetadata,
        actions: actions.map((a) => ({
          availableActionId: a.availableAction.id,
          actionMetadata: a.actionMetadata,
        })),
      });

      toast.success("Zap created successfully!");
      reset();
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create zap");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!(selectedTrigger && actions.length > 0);

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-64px)] p-4 md:p-8">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div ref={headerRef} className="flex items-center justify-between mb-8">
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
              <h1 className="text-2xl font-bold">Create New Zap</h1>
              <p className="text-sm text-muted-foreground">
                Connect a trigger with actions to automate your workflow
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Zap
              </>
            )}
          </Button>
        </div>

        {/* Canvas */}
        <div ref={canvasRef} className="flex flex-col items-center">
          {/* Trigger Node */}
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

          {/* Add Action Button + Save Button with liquid split animation */}
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

          {/* Helper Text */}
          {!selectedTrigger && (
            <p className="text-center text-muted-foreground mt-8 max-w-md">
              Start by selecting a trigger. This will determine when your
              automation runs.
            </p>
          )}

          {selectedTrigger && actions.length === 0 && (
            <p className="text-center text-muted-foreground mt-4 max-w-md">
              Click the + button to add actions that will run when your trigger
              fires.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
