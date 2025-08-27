import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholder = "data:image/svg+xml,%3csvg%20width='100'%20height='100'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20width='100'%20height='100'%20fill='%23f0f0f0'/%3e%3c/svg%3e",
  onLoad,
  onError 
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          "w-full h-full object-cover"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
      
      {!isLoaded && !hasError && (
        <div className={cn(
          "absolute inset-0 bg-muted/20 animate-pulse",
          "flex items-center justify-center"
        )}>
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className={cn(
          "absolute inset-0 bg-muted/10",
          "flex items-center justify-center text-muted-foreground"
        )}>
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;