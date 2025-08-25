import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useReveal = (options: UseRevealOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<any>(null);
  const { threshold = 0, rootMargin = '0px 0px -10% 0px', triggerOnce = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Fallback for browsers without IntersectionObserver or immediate visibility
    if (!('IntersectionObserver' in window)) {
      console.log('useReveal: IntersectionObserver not available, showing content immediately');
      setIsVisible(true);
      return;
    }

    // Check if element is already in viewport
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isInViewport) {
      console.log('useReveal: Element already in viewport, showing immediately');
      setIsVisible(true);
      if (triggerOnce) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log('useReveal: Element became visible');
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    // Safety timeout fallback
    const timeoutId = setTimeout(() => {
      console.log('useReveal: Timeout fallback triggered');
      setIsVisible(true);
    }, 100);

    return () => {
      observer.unobserve(element);
      clearTimeout(timeoutId);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};