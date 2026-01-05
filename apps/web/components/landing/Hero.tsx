"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const decorativeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: 0.2,
      })
        .from(
          subtitleRef.current,
          {
            y: 50,
            opacity: 0,
            duration: 1,
          },
          "-=0.6"
        )
        .from(
          buttonsRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          decorativeRef.current,
          {
            scale: 0.8,
            opacity: 0,
            duration: 1.5,
            ease: "elastic.out(1, 0.6)",
          },
          "-=1"
        );

      // Parallax mouse movement effect
      const handleMouseMove = (e: MouseEvent) => {
        if (!decorativeRef.current) return;
        const { clientX, clientY } = e;
        const xMode = (clientX - window.innerWidth / 2) / 50;
        const yMode = (clientY - window.innerHeight / 2) / 50;

        gsap.to(decorativeRef.current, {
          x: xMode,
          y: yMode,
          duration: 1,
          ease: "power2.out",
        });
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-background pt-40 pb-20"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen dark:mix-blend-lighten opacity-50" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-foreground backdrop-blur-sm mb-6 transition-transform hover:scale-105 cursor-default hover:border-white/20 hover:bg-white/10">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_10px_0_theme(colors.primary.DEFAULT)]"></span>
            New Features Available
          </div>

          <h1
            ref={titleRef}
            className="text-4xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent pb-2"
          >
            Automate at the <br className="hidden md:block" />
            speed of thought.
          </h1>

          <p
            ref={subtitleRef}
            className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed"
          >
            Connect your favorite apps and let workflows run themselves. No coding required. Just pure productivity.
          </p>

          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_0_theme(colors.primary.DEFAULT/30%)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <span className="mr-2">Get Started Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 font-medium shadow-sm transition-all hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm">
              View Documentation
            </button>
          </div>
        </div>

        {/* Decorative Floating Elements */}
        <div
          ref={decorativeRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-20 opacity-40 max-w-[1400px]"
        >
          {/* Example Icons floating - Positioned further out */}
          <div className="absolute top-[20%] left-[5%] p-4 bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-float-slow hidden lg:block">
             <Zap className="w-8 h-8 text-foreground/80" />
          </div>
          <div className="absolute top-[30%] right-[5%] p-4 bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-float-medium hidden lg:block">
             <CheckCircle2 className="w-8 h-8 text-foreground/80" />
          </div>
        </div>
      </div>
    </section>
  );
}
