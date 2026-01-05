"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { setToken, isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.signup(name, email, password);
      if (response.token) {
        setToken(response.token);
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(response.error || "Signup failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[100px] rounded-full" />
      </div>

      <Card
        ref={cardRef}
        className="w-full max-w-sm bg-card/80 backdrop-blur-xl border-border/50"
      >
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription className="text-base">Get started with FlowForge today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/50"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
