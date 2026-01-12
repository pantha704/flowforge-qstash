"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Shield, Link, BarChart3, Clock, Users } from "lucide-react";
import FeatureCard from "./FeatureCard";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Instant Integration",
    description: "Connect over 5,000 apps with a few clicks. No complex API knowledge required.",
    icon: Link,
  },
  {
    title: "Real-time Automation",
    description: "Triggers run instantly. Experience latency-free workflows that keep your business moving.",
    icon: Zap,
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade encryption and SOC2 compliance ensure your data remains safe and private.",
    icon: Shield,
  },
  {
    title: "Detailed Analytics",
    description: "Track every task and workflow with comprehensive dashboards and reporting tools.",
    icon: BarChart3,
  },
  {
    title: "Scheduling",
    description: "Schedule tasks to run at specific times or intervals to match your business hours.",
    icon: Clock,
  },
  {
    title: "Team Collaboration",
    description: "Share workflows and specific folder access with your team members easily.",
    icon: Users,
  },
];

export default function Features() {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(headerRef.current, {
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Powerful features for <br />
            <span className="text-primary">modern workflows</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to automate your work and save time, built for teams of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              index={idx}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
