import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ShadeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Enhanced Input component with label, error states, and icons
 */
export const ShadeInput = React.forwardRef<HTMLInputElement, ShadeInputProps>(
  ({ 
    className,
    containerClassName,
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </Label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        {helper && !error && (
          <p className="text-sm text-muted-foreground">{helper}</p>
        )}
      </div>
    );
  }
);

ShadeInput.displayName = "ShadeInput";