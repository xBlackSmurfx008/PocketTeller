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

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      // Clamp values to prevent excessive movement
      const clampedX = Math.max(-20, Math.min(20, deltaX));
      const clampedY = Math.max(-20, Math.min(20, deltaY));

      setValues({ x: clampedX, y: clampedY });
    };

    const handleMouseLeave = () => {
      setValues({ x: 0, y: 0 });
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [strength]);

  return { ref, values };
};