import { Zap, CheckCircle, Users, BarChart3, Globe, Shield } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Built for speed',
    description: 'Lightning-fast financial tracking with real-time updates and instant categorization.'
  },
  {
    icon: CheckCircle,
    title: 'Smart tracking',
    description: 'Automatically categorize transactions and track expenses with AI-powered insights.'
  },
  {
    icon: Users,
    title: 'Team collaboration',
    description: 'Share budgets and financial goals with family members or financial advisors.'
  },
  {
    icon: BarChart3,
    title: 'Insights & reporting',
    description: 'Detailed analytics and beautiful charts to understand your financial patterns.'
  },
  {
    icon: Globe,
    title: 'Bank integrations',
    description: 'Connect with 10,000+ banks and financial institutions securely via Plaid.'
  },
  {
    icon: Shield,
    title: 'Enterprise ready',
    description: 'Bank-level security with encryption and compliance for peace of mind.'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Everything you need for{' '}
            <span className="gradient-text">modern finance</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive tools designed to simplify your financial life and help you make smarter money decisions.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass rounded-2xl p-8 hover-scale transition-all duration-300 hover:shadow-[0_0_30px_hsl(250_100%_75%/0.1)] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;