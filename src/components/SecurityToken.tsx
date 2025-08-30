import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SecurityTokenProps {
  icon: ReactNode;
  title: string;
  description?: string;
  variant?: 'default' | 'hidden' | 'clone';
  className?: string;
}

const SecurityToken = ({ 
  icon, 
  title, 
  description, 
  variant = 'default', 
  className 
}: SecurityTokenProps) => {
  return (
    <div 
      className={cn(
        "group relative p-6 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
        "hover:shadow-md hover:scale-105 card-hover-lift",
        variant === 'hidden' && "opacity-50 scale-95",
        variant === 'clone' && "border-primary/20 bg-primary/5",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
          variant === 'clone' ? "bg-primary/20" : "bg-primary/10"
        )}>
          {icon}
        </div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {/* Subtle glow effect for clones */}
      {variant === 'clone' && (
        <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default SecurityToken;