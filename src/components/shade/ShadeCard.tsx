import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ShadeCardProps {
  children: React.ReactNode;
  className?: string;
  /** Card elevation level */
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  /** Whether the card should have hover effects */
  hoverable?: boolean;
  /** Whether the card should be clickable */
  clickable?: boolean;
  onClick?: () => void;
}

interface ShadeCardHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

interface ShadeCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ShadeCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Enhanced Card component with ShadeUI patterns
 */
export function ShadeCard({ 
  children, 
  className, 
  elevation = "sm", 
  hoverable, 
  clickable, 
  onClick 
}: ShadeCardProps) {
  const elevationClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md", 
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  return (
    <Card
      className={cn(
        elevationClasses[elevation],
        hoverable && "transition-shadow duration-200 hover:shadow-lg",
        clickable && "cursor-pointer transition-transform duration-200 hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

export function ShadeCardHeader({ title, description, children, className }: ShadeCardHeaderProps) {
  return (
    <CardHeader className={className}>
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </CardHeader>
  );
}

export function ShadeCardBody({ children, className }: ShadeCardBodyProps) {
  return (
    <CardContent className={className}>
      {children}
    </CardContent>
  );
}

export function ShadeCardFooter({ children, className }: ShadeCardFooterProps) {
  return (
    <CardFooter className={className}>
      {children}
    </CardFooter>
  );
}