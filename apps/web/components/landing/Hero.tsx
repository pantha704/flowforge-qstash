"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Zap, CheckCircle2, Mail, Database, GitBranch, Bell, Webhook, Settings } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "next-themes";

export default function Hero() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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

    // Set mounted to true after hydration
    setMounted(true);

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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-background py-20"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen dark:mix-blend-lighten opacity-50" />

      <div className="container mx-auto px-6 md:px-8 relative text-center">
        <div className="space-y-8 md:space-y-10 max-w-4xl mx-auto">
          {/* "Not backed by Y Combinator" Badge */}
          <div className="flex justify-center mb-12 -mt-4">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              duration={1}
              clockwise={false}
              className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-4 py-2"
            >
              <span className="text-muted-foreground text-sm">Not backed by</span>
              <Image
                src="/image.png"
                alt="Y Combinator"
                width={24}
                height={24}
                className="rounded-sm"
              />
              <span className="font-semibold text-foreground">Combinator</span>
            </HoverBorderGradient>
          </div>

          <h1
            ref={titleRef}
            className="text-2xl z-12 xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent pb-2 px-4 w-full"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          >
            Automate at the speed of thought.
          </h1>

          <p
            ref={subtitleRef}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground w-full max-w-2xl mx-auto leading-relaxed px-6"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          >
            Connect your favorite apps and let workflows run themselves. No coding required. Just pure productivity.
          </p>

          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button
              onClick={() => router.push(mounted && isAuthenticated ? "/dashboard" : "/signup")}
              className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_0_theme(colors.primary.DEFAULT/30%)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="mr-2">{mounted && isAuthenticated ? "Go to Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/docs")}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 font-medium shadow-sm transition-all hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm"
            >
              View Documentation
            </button>
          </div>

          {/* Sparkles Effect */}
          <div className="flex justify-center w-full mt-12 px-4">
            <div className="w-full h-72 relative">
              {/* Gradients */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-[2px] w-[85%] blur-sm" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px w-[85%]" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-[40%] blur-sm" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-[40%]" />

              {/* Core component */}
              <SparklesCore
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={1200}
                className="w-full h-full"
                particleColor={resolvedTheme === 'dark' ? '#FFFFFF' : '#0284c7'}
              />

              {/* Radial Gradient to prevent sharp edges */}
              <div className="absolute inset-0 w-full h-full bg-background [mask-image:radial-gradient(500px_300px_at_top,transparent_20%,white)]"></div>
            </div>
          </div>
        </div>

        {/* Decorative Floating Elements */}
        <div
          ref={decorativeRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-40 max-w-[1400px]"
        >
          {/* Row 1: Settings - Left (curved in from edge) */}
          <div className="absolute top-[15%] left-[10%] p-3 mt-2 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-medium hidden lg:block">
             <Settings className="w-6 h-6 text-rose-500" style={{ filter: 'drop-shadow(0 0 8px rgb(244 63 94 / 0.6))' }} />
          </div>

          {/* Row 2: CheckCircle - Right (curved in from edge) */}
          <div className="absolute top-[20%] right-[7%] p-4 mt-2 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-2xl shadow-lg animate-float-slow hidden lg:block">
             <CheckCircle2 className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px rgb(34 197 94 / 0.6))' }} />
          </div>

          {/* Row 3: Zap - Left (widest point) */}
          <div className="absolute top-[35%] left-[3%] p-4 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-2xl shadow-lg animate-float-fast hidden lg:block">
             <Zap className="w-8 h-8 text-cyan-500" style={{ filter: 'drop-shadow(0 0 8px rgb(6 182 212 / 0.6))' }} />
          </div>

          {/* Row 4: Database - Right (widest point) */}
          <div className="absolute top-[40%] right-[3%] p-3 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-medium hidden lg:block">
             <Database className="w-6 h-6 text-purple-500" style={{ filter: 'drop-shadow(0 0 8px rgb(168 85 247 / 0.6))' }} />
          </div>

          {/* Row 5: Mail - Left (middle) */}
          <div className="absolute top-[55%] left-[4%] p-3 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-slow hidden lg:block">
             <Mail className="w-6 h-6 text-blue-500" style={{ filter: 'drop-shadow(0 0 8px rgb(59 130 246 / 0.6))' }} />
          </div>

          {/* Row 6: Bell - Right (middle) */}
          <div className="absolute top-[58%] right-[4%] p-3 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-fast hidden lg:block">
             <Bell className="w-6 h-6 text-yellow-500" style={{ filter: 'drop-shadow(0 0 8px rgb(234 179 8 / 0.6))' }} />
          </div>

          {/* Row 7: GitBranch - Left (curving back in) */}
          <div className="absolute top-[72%] left-[8%] p-3 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-medium hidden lg:block">
             <GitBranch className="w-6 h-6 text-orange-500" style={{ filter: 'drop-shadow(0 0 8px rgb(249 115 22 / 0.6))' }} />
          </div>

          {/* Row 8: Webhook - Right (curving back in) */}
          <div className="absolute top-[75%] right-[8%] p-3 mb-2 ml-1 bg-slate-300/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 rounded-xl shadow-lg animate-float-slow hidden lg:block">
             <Webhook className="w-5 h-5 text-teal-500" style={{ filter: 'drop-shadow(0 0 8px rgb(20 184 166 / 0.6))' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
