import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-brand-gradient text-white shadow-glow hover:brightness-110",
        glass: "border border-white/10 bg-white/5 text-white/95 backdrop-blur-md hover:bg-white/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Enhanced onClick with error handling
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        try {
          onClick(event);
        } catch (error) {
          console.error('Button onClick error:', error);
        }
      }
    }, [onClick]);

    // Development-only accessibility warnings
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        // Check for icon-only buttons without aria-label
        const hasIconOnly = props.children && 
          React.Children.toArray(props.children).some((child) => 
            React.isValidElement(child) && 
            child.type && 
            typeof child.type === 'function'
          );
        
        if (hasIconOnly && !props['aria-label'] && !props.title) {
          console.warn('Button with icon should have aria-label or title for accessibility');
        }
      }
    }, [props.children, props['aria-label'], props.title]);
    
    return (
      <Comp
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
