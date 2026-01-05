"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ZapCard } from "@/components/dashboard/ZapCard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Zap } from "lucide-react";
import type { Zap as ZapType } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [zaps, setZaps] = useState<ZapType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchZaps = async () => {
      try {
        const response = await api.getZaps();
        if (response.success) {
          setZaps(response.zaps);
        }
      } catch (error) {
        toast.error("Failed to load zaps");
      } finally {
        setIsLoading(false);
      }
    };

    fetchZaps();
  }, [isAuthenticated, router]);

  useGSAP(
    () => {
      if (!isLoading && cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll(".zap-card");
        gsap.from(cards, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        });
      }
    },
    { scope: containerRef, dependencies: [isLoading, zaps] }
  );

  const handleDelete = async (zapId: string) => {
    try {
      await api.deleteZap(zapId);
      setZaps((prev) => prev.filter((z) => z.id !== zapId));
      toast.success("Zap deleted successfully");
    } catch (error) {
      toast.error("Failed to delete zap");
    }
  };

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-64px)] p-4 md:p-8">
      <div className="container mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Zaps</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your automated workflows
            </p>
          </div>
          <Button
            onClick={() => router.push("/zap/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Zap
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && zaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No zaps yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first automated workflow to connect your apps and save time.
            </p>
            <Button onClick={() => router.push("/zap/create")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Zap
            </Button>
          </div>
        )}

        {/* Zaps Grid */}
        {!isLoading && zaps.length > 0 && (
          <div ref={cardsRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zaps.map((zap) => (
              <ZapCard key={zap.id} zap={zap} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
