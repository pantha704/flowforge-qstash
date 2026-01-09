"use client"
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Zap, LogOut, BookOpen, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "./ui/sheet";

// NavLinks component - extracted outside to avoid re-creation during render
const NavLinks = ({
    mobile = false,
    mounted,
    isAuthenticated,
    router,
    handleLogout
}: {
    mobile?: boolean;
    mounted: boolean;
    isAuthenticated: boolean;
    router: ReturnType<typeof useRouter>;
    handleLogout: () => void;
}) => {
    const baseClass = mobile
        ? "w-full justify-start text-base py-3"
        : "text-muted-foreground hover:text-primary transition-colors font-medium";

    return (
        <>
            <Button
                variant="ghost"
                size={mobile ? "lg" : "sm"}
                onClick={() => router.push("/docs")}
                className={baseClass}
            >
                <BookOpen className="h-4 w-4 mr-2" />
                API Docs
            </Button>

            {mounted && isAuthenticated ? (
                <>
                    <Button
                        variant="ghost"
                        size={mobile ? "lg" : "sm"}
                        onClick={() => router.push("/dashboard")}
                        className={baseClass}
                    >
                        Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        size={mobile ? "lg" : "sm"}
                        onClick={handleLogout}
                        className={`${baseClass} ${mobile ? "text-destructive" : "hover:text-destructive"}`}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        variant="ghost"
                        size={mobile ? "lg" : "sm"}
                        onClick={() => router.push("/login")}
                        className={baseClass}
                    >
                        Login
                    </Button>
                    {mobile ? (
                        <Button
                            size="lg"
                            onClick={() => router.push("/signup")}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm mt-2"
                        >
                            Register
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => router.push("/signup")}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                        >
                            Register
                        </Button>
                    )}
                </>
            )}
        </>
    );
};

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
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container mx-auto flex h-14 md:h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div
                    className="flex items-center gap-2 font-bold text-xl cursor-pointer tracking-tighter"
                    onClick={() => router.push("/")}
                >
                    <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <Zap className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                    </div>
                    <span className="text-xl md:text-2xl font-bold">FlowForge</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    <NavLinks
                        mounted={mounted}
                        isAuthenticated={isAuthenticated}
                        router={router}
                        handleLogout={handleLogout}
                    />
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-70 sm:w-80">
                            <div className="flex flex-col gap-1 mt-8">
                                <NavLinks
                                    mobile
                                    mounted={mounted}
                                    isAuthenticated={isAuthenticated}
                                    router={router}
                                    handleLogout={handleLogout}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};
