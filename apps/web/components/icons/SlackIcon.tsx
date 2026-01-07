"use client";

import React from "react";

interface SlackIconProps {
  className?: string;
  size?: number;
}

/**
 * Official Slack logo SVG with brand colors.
 * Uses the official Slack brand palette:
 * - #36C5F0 (blue)
 * - #2EB67D (green)
 * - #ECB22E (yellow)
 * - #E01E5A (pink/red)
 */
export function SlackIcon({ className = "", size = 24 }: SlackIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`slack-icon ${className}`}
      fill="none"
    >
      {/* Top-left - Blue */}
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      {/* Top-right - Green */}
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      {/* Bottom-right - Yellow */}
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.272 0a2.528 2.528 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.521 2.522v6.312z"
        fill="#2EB67D"
      />
      {/* Bottom-left - Pink */}
      <path
        d="M15.163 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.272a2.527 2.527 0 0 1-2.521-2.521 2.527 2.527 0 0 1 2.521-2.521h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.521h-6.315z"
        fill="#ECB22E"
      />
    </svg>
  );
}

export default SlackIcon;
