const TrustedByMarquee = () => {
  const phrases = [
    "🔒 Bank‑level security",
    "Private by default", 
    "You own your data",
    "No data selling, ever",
    "Secure token handling"
  ];

  // Duplicate phrases for seamless looping
  const duplicatedPhrases = [...phrases, ...phrases];

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-lg font-semibold mb-4">
          Built with privacy in mind
        </h2>
        <div className="h-10 sm:h-12 flex items-center justify-center overflow-hidden">
          <div className="marquee-container w-full max-w-2xl relative z-10">
            <div className="marquee-content items-center">
              {duplicatedPhrases.map((phrase, index) => (
                <span 
                  key={`${phrase}-${index}`}
                  className="marquee-item inline-flex items-center px-4 py-1.5 sm:py-2 rounded-full bg-background/80 text-sm font-medium border border-border/50 whitespace-nowrap text-foreground"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedByMarquee;