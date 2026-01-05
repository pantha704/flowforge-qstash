"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface ConnectorLineProps {
  height?: number;
}

export function ConnectorLine({ height = 60 }: ConnectorLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (containerRef.current && pathRef.current && circleRef.current) {
      const length = pathRef.current.getTotalLength();

      // Timeline for liquid animation
      const tl = gsap.timeline();

      // Start with container collapsed
      gsap.set(containerRef.current, {
        height: 0,
        opacity: 0,
        overflow: "hidden"
      });
      gsap.set(circleRef.current, { scale: 0, opacity: 0 });
      gsap.set(pathRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      // Expand container
      tl.to(containerRef.current, {
        height: height + 16,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      })
      // Draw the line
      .to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 0.4,
        ease: "power2.out",
      }, "-=0.1")
      // Pop in the circle
      .to(circleRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(2)",
      }, "-=0.2")
      // Clear inline styles
      .set(containerRef.current, { overflow: "visible" });
    }
  }, [height]);

  const cyanColor = "#06b6d4";

  return (
    <div ref={containerRef} className="flex justify-center my-2">
      <svg
        width="40"
        height={height}
        viewBox={`0 0 40 ${height}`}
        fill="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={cyanColor} />
            <stop offset="100%" stopColor={cyanColor} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={`M 20 0 L 20 ${height}`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          ref={circleRef}
          cx="20"
          cy={height - 2}
          r="4"
          fill={cyanColor}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}
