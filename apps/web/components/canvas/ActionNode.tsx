"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);
import { Card } from "@/components/ui/card";
import { MetadataForm } from "./MetadataForm";
import { useZapBuilderStore } from "@/lib/store";
import { getActionStyle } from "@/lib/type-styles";
import { Trash2 } from "lucide-react";
import type { ZapBuilderAction } from "@/lib/types";

interface ActionNodeProps {
  action: ZapBuilderAction;
  index: number;
}

export function ActionNode({ action, index }: ActionNodeProps) {
  const { removeAction, updateActionMetadata } = useZapBuilderStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const connectorRef = useRef<HTMLDivElement>(null);

  // Liquid entrance animation
  useEffect(() => {
    if (wrapperRef.current && cardRef.current && contentRef.current && connectorRef.current) {
      const tl = gsap.timeline();

      // Start with everything collapsed and invisible
      gsap.set(wrapperRef.current, {
        height: 0,
        opacity: 0,
        overflow: "hidden"
      });

      // Measure the natural heights
      gsap.set(contentRef.current, { visibility: "hidden" });
      const cardHeight = contentRef.current.offsetHeight + 48;
      const connectorHeight = 56; // 40px line + 16px margin
      const totalHeight = cardHeight + connectorHeight;
      gsap.set(contentRef.current, { visibility: "visible" });

      // Calculate scroll target (center the card in viewport)
      const cardTop = wrapperRef.current.getBoundingClientRect().top + window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollTarget = cardTop - (viewportHeight / 2) + (totalHeight / 2);

      // Animate wrapper expansion AND scroll simultaneously
      tl.to(wrapperRef.current, {
        height: totalHeight,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
      })
      // Scroll window simultaneously
      .to(window, {
        scrollTo: { y: scrollTarget, autoKill: false },
        duration: 0.6,
        ease: "power3.out",
      }, "<")
      // Then animate content fade in with slight bounce
      .fromTo(
        [cardRef.current, connectorRef.current],
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
          stagger: 0.05
        },
        "-=0.3"
      )
      // Clear inline styles after animation
      .set(wrapperRef.current, { height: "auto", overflow: "visible" });
    }
  }, []);

  const handleDelete = () => {
    if (wrapperRef.current && contentRef.current && connectorRef.current) {
      // Set overflow hidden immediately to prevent layout jumps
      gsap.set(wrapperRef.current, { overflow: "hidden" });

      const tl = gsap.timeline({
        onComplete: () => removeAction(action.id),
      });

      // First fade card content and connector together
      tl.to([contentRef.current, connectorRef.current], {
        opacity: 0,
        y: -15,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.in",
        stagger: 0.02
      })
      // Then collapse the entire wrapper smoothly
      .to(wrapperRef.current, {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
        duration: 0.35,
        ease: "power2.inOut",
      });
    }
  };

  // Get action style
  const actionStyle = getActionStyle(action.availableAction.name);
  const ActionIcon = actionStyle.icon;

  return (
    <div ref={wrapperRef}>
      {/* Card */}
      <Card
        ref={cardRef}
        className="p-6 bg-card/80 backdrop-blur-sm border-border/50 transition-colors hover:border-cyan-500/30"
      >
        <div ref={contentRef} className="flex items-start gap-4">
          {/* Action Number */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${actionStyle.bg} ${actionStyle.text} text-sm font-bold shrink-0`}>
            {index + 1}
          </div>

          {/* Action Icon */}
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${actionStyle.bg} ${actionStyle.text} shrink-0`}>
            <ActionIcon className="h-7 w-7" />
          </div>

          {/* Action Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                  Action
                </p>
                <h4 className="font-semibold text-lg truncate">
                  {action.availableAction.name}
                </h4>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                onClick={handleDelete}
                title="Remove action"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Metadata Form */}
            <MetadataForm
              type="action"
              name={action.availableAction.name}
              metadata={action.actionMetadata}
              onChange={(metadata) => updateActionMetadata(action.id, metadata)}
            />
          </div>
        </div>
      </Card>

      {/* Connector Line (integrated) */}
      <div ref={connectorRef} className="flex justify-center my-2">
        <svg
          width="40"
          height={40}
          viewBox="0 0 40 40"
          fill="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`lineGradient-${action.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            d="M 20 0 L 20 40"
            stroke={`url(#lineGradient-${action.id})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="20"
            cy={38}
            r="4"
            fill="#06b6d4"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}
