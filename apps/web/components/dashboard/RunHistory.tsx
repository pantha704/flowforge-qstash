"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface Run {
  id: string;
  zapId: string;
  zapName: string;
  status: string;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function RunHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchRuns();
    }
  }, [isOpen, user?.id]);

  const fetchRuns = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await api.getRuns(user.id);
      if (response.success) {
        setRuns(response.runs);
      }
    } catch (error) {
      console.error("Failed to fetch runs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-500/20 text-green-500`;
      case "failed":
        return `${baseClasses} bg-red-500/20 text-red-500`;
      case "running":
        return `${baseClasses} bg-blue-500/20 text-blue-500`;
      case "pending":
        return `${baseClasses} bg-yellow-500/20 text-yellow-500`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400`;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="mr-2">
          <Clock className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Run History
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No runs yet</p>
              <p className="text-sm">Trigger a webhook to see run history</p>
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <span className="font-medium text-sm">{run.zapName}</span>
                  </div>
                  <span className={getStatusBadge(run.status)}>
                    {run.status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{formatDate(run.createdAt)}</span>
                  </div>
                  {run.completedAt && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{formatDate(run.completedAt)}</span>
                    </div>
                  )}
                </div>

                {run.error && (
                  <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-500 font-mono">{run.error}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
