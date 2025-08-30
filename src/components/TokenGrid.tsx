import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TokenGridProps {
  children: ReactNode;
  className?: string;
}

const TokenGrid = ({ children, className }: TokenGridProps) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      "auto-rows-fr", // Equal height rows
      className
    )}>
      {children}
    </div>
  );
};

export default TokenGrid;