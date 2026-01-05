"use client"
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Zap, LogOut, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export const Appbar = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div
                    className="flex items-center gap-2 font-bold text-xl cursor-pointer tracking-tighter"
                    onClick={() => router.push("/")}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <span className="text-2xl font-bold">FlowForge</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* API Docs Button - Always visible */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/docs")}
                        className="text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        <BookOpen className="h-4 w-4 mr-2" />
                        API
                    </Button>

                    {mounted && isAuthenticated ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/dashboard")}
                                className="text-muted-foreground hover:text-primary transition-colors font-medium"
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-destructive transition-colors font-medium"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/login")}
                                className="text-muted-foreground hover:text-primary transition-colors font-medium"
                            >
                                Login
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => router.push("/signup")}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                            >
                                Register
                            </Button>
                        </>
                    )}
                    <div className="pl-2 border-l border-border/50 ml-2">
                        <ModeToggle />
                    </div>
                </div>
            </div>
        </nav>
    );
};
