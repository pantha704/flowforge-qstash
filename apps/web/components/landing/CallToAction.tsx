"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Send } from "lucide-react";
import { useAuthStore } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

const CONTACT_EMAIL = "prathamjaiswal204@gmail.com";

export default function CallToAction() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
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

      setMounted(true);
    },
    { scope: containerRef }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

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

            <button
              onClick={() => router.push(mounted && isAuthenticated ? "/dashboard" : "/signup")}
              className="group inline-flex h-14 items-center justify-center rounded-full bg-background text-foreground px-8 text-lg font-medium transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary"
            >
              <span className="mr-2">{mounted && isAuthenticated ? "Go to Dashboard" : "Start for free"}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Get in Touch
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main container with SVG and form fields */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Left side - SVG Icon (vertically centered) */}
              <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:items-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 md:w-16 md:h-16 text-primary"
                  >
                    <path
                      d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Right side - Subject and Message fields */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-muted-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Send button section - below the main container */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Sending to: <span className="text-primary font-medium">{CONTACT_EMAIL}</span>
              </p>
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span>Send Message</span>
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
