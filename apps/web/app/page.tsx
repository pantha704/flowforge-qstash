import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CallToAction from "@/components/landing/CallToAction";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      <Features />
      <CallToAction />

      <footer className="w-full py-8 md:py-12 px-4 border-t border-border mt-12 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} FlowForge. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}