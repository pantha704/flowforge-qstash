"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CallToAction() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(contentRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="py-20 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <div
          ref={contentRef}
          className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-16 md:px-16 md:py-20 text-center text-primary-foreground shadow-2xl"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to automate your workflow?
            </h2>
            <p className="max-w-2xl mx-auto text-primary-foreground/80 text-lg md:text-xl">
              Join thousands of teams who save hours every week. Start building your first Zap today.
            </p>

            <button className="group inline-flex h-14 items-center justify-center rounded-full bg-background text-foreground px-8 text-lg font-medium transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary">
              <span className="mr-2">Start for free</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
