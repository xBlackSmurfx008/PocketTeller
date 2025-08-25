const TrustedByMarquee = () => {
  const companies = [
    "🔒 Bank-level security",
    "Built with privacy in mind",
    "Updated with the best financial knowledge available"
  ];

  return (
    <section className="py-12 overflow-hidden bg-muted/30" aria-hidden="true">
      <div className="relative">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-6">
          Built with privacy in mind
        </h3>
        <div className="marquee-container">
          <div className="marquee-content">
            {/* First set */}
            {companies.map((company, index) => (
              <div key={index} className="marquee-item">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-background/80 text-sm font-medium border border-border/50">
                  {company}
                </span>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {companies.map((company, index) => (
              <div key={`duplicate-${index}`} className="marquee-item">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-background/80 text-sm font-medium border border-border/50">
                  {company}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedByMarquee;