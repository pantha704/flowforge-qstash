"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface ConnectorLineProps {
  height?: number;
}

export function ConnectorLine({ height = 60 }: ConnectorLineProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();

      // Set up initial state (hidden)
      gsap.set(pathRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      // Animate the line drawing
      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });
    }
  }, []);

  return (
    <div className="flex justify-center my-2">
      <svg
        width="40"
        height={height}
        viewBox={`0 0 40 ${height}`}
        fill="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={`M 20 0 L 20 ${height}`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Decorative circle at the end */}
        <circle
          cx="20"
          cy={height - 2}
          r="3"
          fill="hsl(var(--primary))"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}
