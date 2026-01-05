"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Save, Loader2 } from "lucide-react";

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function SaveButton({ onClick, disabled = false, isSaving = false }: SaveButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Entrance animation
  useEffect(() => {
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center cursor-pointer border-0 outline-none hover:scale-105 disabled:hover:scale-100"
      title="Save Zap"
    >
      {isSaving ? (
        <Loader2 className="w-8 h-8 animate-spin" />
      ) : (
        <Save className="w-8 h-8" strokeWidth={2.5} />
      )}
    </button>
  );
}
