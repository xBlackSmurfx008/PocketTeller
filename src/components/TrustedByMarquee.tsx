import { useState, useEffect } from 'react';

const TrustedByMarquee = () => {
  const phrases = [
    "🔒 Bank‑level security",
    "Private by default", 
    "You own your data",
    "No data selling, ever",
    "Secure token handling"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
        setFade(true);
      }, 150);
    }, 2500);

    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-lg font-semibold mb-4">
          Built with privacy in mind
        </h3>
        <div className="h-8 flex items-center justify-center">
          <span 
            className={`inline-flex items-center px-4 py-2 rounded-full bg-background/80 text-sm font-medium border border-border/50 transition-all duration-150 ${
              fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
            style={{ 
              animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : undefined 
            }}
          >
            {phrases[currentIndex]}
          </span>
        </div>
      </div>
    </section>
  );
};

export default TrustedByMarquee;