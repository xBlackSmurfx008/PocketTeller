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
    <section className="py-16 bg-muted/30">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-xl lg:text-2xl font-semibold mb-8">
          Built with privacy in mind
        </h2>
        <div className="h-12 sm:h-14 flex items-center justify-center overflow-hidden">
          <div className="marquee-container w-full max-w-4xl relative z-10">
            <div className="marquee-content items-center">
              {duplicatedPhrases.map((phrase, index) => (
                <span 
                  key={`${phrase}-${index}`}
                  className="marquee-item inline-flex items-center px-6 py-3 mx-2 rounded-full bg-background/90 text-sm lg:text-base font-medium border border-border/50 whitespace-nowrap text-foreground hover:bg-background transition-colors duration-300 shadow-sm"
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