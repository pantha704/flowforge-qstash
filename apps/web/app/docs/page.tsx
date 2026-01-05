"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Key,
  Webhook,
  Play,
  FileText,
  Copy,
  Check,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sidebar navigation items
const navigation = [
  { id: "introduction", label: "Introduction", icon: FileText },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "zaps", label: "Zaps", icon: Zap },
  { id: "triggers", label: "Triggers", icon: Play },
  { id: "actions", label: "Actions", icon: ArrowRight },
];

// Code block component with copy functionality
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-zinc-300">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-zinc-400" />
        )}
      </button>
    </div>
  );
}

// Endpoint component
function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-amber-500/20 text-amber-400",
    DELETE: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="border border-border/50 rounded-lg p-4 bg-card/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <span className={cn("px-2 py-1 rounded text-xs font-mono font-bold", methodColors[method])}>
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function DocsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("introduction");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://flowforge-api.vercel.app/api";

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-64px)] bg-card/50 border-r border-border/50 transition-all duration-300 z-40",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4 text-foreground">API Reference</h2>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 p-2 bg-card border border-border/50 rounded-r-lg hover:bg-muted transition-colors"
        style={{ left: sidebarOpen ? "256px" : "0" }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-8 pb-20",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        <div className="max-w-4xl mx-auto px-8">
          {/* Introduction */}
          <section id="introduction" className="mb-16">
            <h1 className="text-4xl font-bold mb-4">FlowForge API</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Build powerful automation workflows programmatically. The FlowForge API allows you to create, manage, and trigger zaps from your applications.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-primary mb-2">Base URL</h3>
              <code className="text-sm bg-background px-2 py-1 rounded">{apiBaseUrl}</code>
            </div>

            <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
            <p className="text-muted-foreground mb-4">
              Make your first API request to test the connection:
            </p>
            <CodeBlock
              code={`curl ${apiBaseUrl}/trigger/available \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
            />
          </section>

          {/* Authentication */}
          <section id="authentication" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Authentication</h2>
            <p className="text-muted-foreground mb-6">
              All API requests require authentication using a Bearer token. Obtain a token by signing in.
            </p>

            <div className="space-y-4 mb-6">
              <Endpoint method="POST" path="/auth/signup" description="Register a new user account" />
              <Endpoint method="POST" path="/auth/signin" description="Sign in and receive a JWT token" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Sign In Request</h3>
            <CodeBlock
              language="bash"
              code={`curl -X POST ${apiBaseUrl}/auth/signin \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "yourpassword"}'`}
            />

            <h3 className="text-xl font-semibold mt-6 mb-4">Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
            />

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
              <p className="text-amber-500 text-sm">
                <strong>Important:</strong> Include the token in all subsequent requests as a Bearer token in the Authorization header.
              </p>
            </div>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Webhooks</h2>
            <p className="text-muted-foreground mb-6">
              Trigger your zaps by sending HTTP requests to webhook endpoints. Each zap with a webhook trigger gets a unique URL.
            </p>

            <div className="space-y-4 mb-6">
              <Endpoint method="POST" path="/hooks/:userId/:zapId" description="Trigger a zap via webhook" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Trigger a Webhook</h3>
            <CodeBlock
              code={`curl -X POST ${apiBaseUrl}/hooks/1/abc123-def456 \\
  -H "Content-Type: application/json" \\
  -d '{"data": "your payload here"}'`}
            />

            <h3 className="text-xl font-semibold mt-6 mb-4">Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "message": "Webhook received",
  "zapRunId": "run_123abc"
}`}
            />
          </section>

          {/* Zaps */}
          <section id="zaps" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Zaps</h2>
            <p className="text-muted-foreground mb-6">
              Manage your automation workflows. A zap consists of a trigger and one or more actions.
            </p>

            <div className="space-y-4 mb-6">
              <Endpoint method="GET" path="/zap" description="List all your zaps" />
              <Endpoint method="POST" path="/zap" description="Create a new zap" />
              <Endpoint method="GET" path="/zap/:id" description="Get a specific zap" />
              <Endpoint method="DELETE" path="/zap/:id" description="Delete a zap" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Create a Zap</h3>
            <CodeBlock
              code={`curl -X POST ${apiBaseUrl}/zap \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "triggerId": "trigger-uuid",
    "triggerMetadata": {},
    "actions": [
      {
        "availableActionId": "action-uuid",
        "actionMetadata": {
          "to": "user@example.com",
          "subject": "Hello",
          "body": "World"
        }
      }
    ]
  }'`}
            />
          </section>

          {/* Triggers */}
          <section id="triggers" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Triggers</h2>
            <p className="text-muted-foreground mb-6">
              Triggers define what starts your zap. Get the list of available trigger types.
            </p>

            <div className="space-y-4 mb-6">
              <Endpoint method="GET" path="/trigger/available" description="List all available trigger types" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Available Triggers</h3>
            <CodeBlock
              code={`curl ${apiBaseUrl}/trigger/available \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
            />

            <h3 className="text-xl font-semibold mt-6 mb-4">Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "success": true,
  "availableTriggers": [
    { "id": "uuid1", "name": "Webhook" },
    { "id": "uuid2", "name": "Schedule (Cron)" },
    { "id": "uuid3", "name": "New Email Received" }
  ]
}`}
            />
          </section>

          {/* Actions */}
          <section id="actions" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Actions</h2>
            <p className="text-muted-foreground mb-6">
              Actions define what happens when your zap is triggered.
            </p>

            <div className="space-y-4 mb-6">
              <Endpoint method="GET" path="/action/available" description="List all available action types" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Available Actions</h3>
            <CodeBlock
              code={`curl ${apiBaseUrl}/action/available \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
            />

            <h3 className="text-xl font-semibold mt-6 mb-4">Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "success": true,
  "availableActions": [
    { "id": "uuid1", "name": "Send Email" },
    { "id": "uuid2", "name": "HTTP Request" },
    { "id": "uuid3", "name": "Send Slack Message" }
  ]
}`}
            />
          </section>

          {/* Back to Home */}
          <div className="border-t border-border/50 pt-8">
            <Button onClick={() => router.push("/")} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
