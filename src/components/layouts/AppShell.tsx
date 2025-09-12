import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell layout component for non-homepage routes
 * Provides consistent layout structure and theming for app pages
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <main className="w-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
}