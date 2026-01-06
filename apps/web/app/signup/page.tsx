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
import { Zap, Loader2, Github } from "lucide-react";
import Link from "next/link";

// Google icon SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

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
      if (response.token && response.user) {
        setAuth(response.token, response.user);
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

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    try {
      const response = await api.getGoogleLoginUrl();
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch {
      toast.error("Failed to start Google signup");
      setSocialLoading(null);
    }
  };

  const handleGitHubLogin = async () => {
    setSocialLoading("github");
    try {
      const response = await api.getGitHubLoginUrl();
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch {
      toast.error("Failed to start GitHub signup");
      setSocialLoading(null);
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
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={!!socialLoading}
              className="h-11"
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5 mr-2" />
                  Google
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleGitHubLogin}
              disabled={!!socialLoading}
              className="h-11"
            >
              {socialLoading === "github" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-center text-sm text-muted-foreground">
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
