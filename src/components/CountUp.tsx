import { useEffect, useState, useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  animateOnChange?: boolean;
  animateOnMount?: boolean;
}

const CountUp: React.FC<CountUpProps> = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  animateOnChange = true,
  animateOnMount = true
}) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useReveal();
  const previousEndRef = useRef<number>(0);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isVisible) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setCount(end);
      previousEndRef.current = end;
      return;
    }

    // Determine if we should animate
    const shouldAnimate = (animateOnMount && !hasAnimatedRef.current) || 
                         (animateOnChange && hasAnimatedRef.current);
    
    if (!shouldAnimate) {
      setCount(end);
      previousEndRef.current = end;
      return;
    }

    const startValue = hasAnimatedRef.current ? previousEndRef.current : 0;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        hasAnimatedRef.current = true;
        previousEndRef.current = end;
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration, animateOnChange, animateOnMount]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default CountUp;