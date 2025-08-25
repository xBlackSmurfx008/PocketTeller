import { useEffect, useRef, useState } from 'react';

interface ParallaxValues {
  x: number;
  y: number;
}

export const useParallax = (strength: number = 0.1) => {
  const [values, setValues] = useState<ParallaxValues>({ x: 0, y: 0 });
  const ref = useRef<any>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Disable on mobile or if reduced motion is preferred
    const isMobile = window.innerWidth < 768;
    if (prefersReducedMotion || isMobile) return;

    let animationFrame: number;
    let cachedRect: DOMRect | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      if (animationFrame) return; // Throttle to one calculation per frame

      animationFrame = requestAnimationFrame(() => {
        if (!ref.current) return;

        // Use cached rect or get new one
        if (!cachedRect) {
          cachedRect = ref.current.getBoundingClientRect();
        }

        const centerX = cachedRect.left + cachedRect.width / 2;
        const centerY = cachedRect.top + cachedRect.height / 2;

        const deltaX = (e.clientX - centerX) * strength;
        const deltaY = (e.clientY - centerY) * strength;

        // Clamp values to prevent excessive movement
        const clampedX = Math.max(-20, Math.min(20, deltaX));
        const clampedY = Math.max(-20, Math.min(20, deltaY));

        setValues({ x: clampedX, y: clampedY });
        animationFrame = 0;
      });
    };

    const handleMouseLeave = () => {
      setValues({ x: 0, y: 0 });
      cachedRect = null; // Clear cache when mouse leaves
    };

    // Update cached rect on resize
    const handleResize = () => {
      cachedRect = null;
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('resize', handleResize);

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [strength]);

  return { ref, values };
};