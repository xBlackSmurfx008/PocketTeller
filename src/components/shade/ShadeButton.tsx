import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShadeButtonProps extends ButtonProps {
  /** Enhanced loading state */
  loading?: boolean;
  /** Button intent for semantic styling */
  intent?: "primary" | "secondary" | "danger" | "success" | "warning";
}

/**
 * Enhanced Button component with additional ShadeUI patterns
 * Maintains compatibility with existing Button API while adding new features
 */
export const ShadeButton = React.forwardRef<HTMLButtonElement, ShadeButtonProps>(
  ({ className, intent, loading, disabled, children, ...props }, ref) => {
    // Map intent to existing button variants
    const getVariant = () => {
      switch (intent) {
        case "primary":
          return "default";
        case "secondary":
          return "secondary";
        case "danger":
          return "destructive";
        case "success":
          return "default"; // Could be extended with success variant
        case "warning":
          return "outline"; // Could be extended with warning variant
        default:
          return props.variant || "default";
      }
    };

    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        className={cn(
          // Enhanced micro-interactions
          "btn-shimmer transition-all duration-300 ease-out",
          // Enhanced states
          loading && "opacity-70 cursor-wait",
          // Intent-based styling
          intent === "primary" && "btn-magnetic shadow-lg hover:shadow-xl",
          intent === "secondary" && "hover:scale-105",
          className
        )}
        variant={getVariant()}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </Button>
    );
  }
);

ShadeButton.displayName = "ShadeButton";