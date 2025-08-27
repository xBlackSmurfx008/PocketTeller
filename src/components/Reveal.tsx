import { ReactNode, HTMLAttributes, ElementType } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Reveal = ({ 
  children, 
  as: Component = 'div',
  delay = 0,
  once = true,
  threshold = 0.05,
  rootMargin = '0px 0px -10% 0px',
  className,
  style,
  ...props 
}: RevealProps) => {
  const { ref, isVisible } = useReveal({ 
    threshold, 
    rootMargin, 
    triggerOnce: once 
  });

  return (
    <Component
      ref={ref}
      className={cn(
        'scroll-reveal',
        isVisible && 'in-view',
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        ...style
      }}
      {...props}
    >
      {children}
    </Component>
  );
};