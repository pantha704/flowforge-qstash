"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      richColors
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
