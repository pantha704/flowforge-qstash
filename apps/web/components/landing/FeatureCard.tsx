"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  index,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;

      gsap.fromTo(
        card,
        {
          y: 50,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: index * 0.1,
          ease: "power3.out",
        }
      );
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className="group relative p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 transition-colors duration-500 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
