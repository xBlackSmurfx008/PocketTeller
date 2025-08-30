import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Building2, TrendingUp, Shield, Users, BarChart3 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const ForInstitutions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Reveal>
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
                Pocket Banker for Financial Institutions
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-foreground">
                Elevate Your Members' Financial Health with Pocket Banker
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Affordable AI-Powered Budgeting as a Value-Add for Your Checking Accounts
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
                Empower your credit union or bank members to improve their finances daily, weekly, and monthly—without adding stress to your staff. Provide the app they're asking for: real-time guidance, notifications, and budgets that sync with their accounts to realign them to their goals.
              </p>
              <Button size="lg" className="text-lg px-8 py-4">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Why Pocket Banker Section */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why Pocket Banker?</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-center">
                  As a financial institution, you're not just managing accounts—you're building lifelong relationships. Members demand tools to thrive, and Pocket Banker delivers an affordable solution that helps them manage finances effectively. According to recent trends, white-label budgeting apps like ours help banks and credit unions attract younger customers and maximize cross-selling opportunities. Integrate seamlessly with your core systems for a branded experience that boosts retention and positions you for future loan production.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Benefits Section */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Daily Benefits */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Daily Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Real-Time Notifications:</strong> Alerts for off-track spending or low balances, helping members make immediate adjustments.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>AI Insights:</strong> Quick chats with our Gemini-powered assistant for on-the-spot advice, like "How can I cut daily coffee costs?"</span>
                  </li>
                </ul>
              </Card>

              {/* Weekly Benefits */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Weekly Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Spending Reviews:</strong> Weekly summaries and pie charts to track progress, with recommendations to realign budgets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Goal Check-Ins:</strong> Reminders and task updates to keep members motivated toward weekly milestones.</span>
                  </li>
                </ul>
              </Card>

              {/* Monthly Benefits */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Monthly Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Budget vs. Actual Tracking:</strong> Comprehensive reports showing planned vs. real spending, with auto-categorization for accuracy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Bill Management:</strong> Due date reminders and overviews to avoid late fees, integrated directly with their checking accounts.</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Features Section */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Features Tailored for Your Institution</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Building2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">White-Label Branding</h3>
                    <p className="text-muted-foreground">Fully customizable with your logo, colors, and messaging—feels like an extension of your services.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Plaid Integration</h3>
                    <p className="text-muted-foreground">Secure bank syncing for automated transactions, no manual entry needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">AI Coaching</h3>
                    <p className="text-muted-foreground">Conversational guidance without burdening your staff, reducing support calls by up to 30% (based on industry benchmarks for similar tools).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Analytics for You</h3>
                    <p className="text-muted-foreground">Anonymized insights into member financial health to inform your lending strategies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Impact Section */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">The Impact: Invest in Your Members, Thrive Together</h2>
              <p className="text-lg text-muted-foreground mb-8">
                By offering Pocket Banker, you create financially healthy members ready for loans, investments, and more. Studies show financial wellness programs increase member loyalty and cross-selling by 20-35%. No more staff overload—our AI handles the guidance, freeing your team for high-value interactions. "Invest in your own, and thrive" with a tool that turns checking accounts into comprehensive financial hubs.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Testimonials */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Testimonials</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <p className="text-muted-foreground mb-4">
                    "Pocket Banker transformed our member engagement—fewer overdrafts, more loan inquiries!"
                  </p>
                  <p className="font-semibold">– Credit Union Executive</p>
                </Card>
                <Card className="p-6">
                  <p className="text-muted-foreground mb-4">
                    "Affordable and seamless; our younger members love the AI coach."
                  </p>
                  <p className="font-semibold">– Community Bank Manager</p>
                </Card>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                (Hypothetical based on similar tools like FinLocker.)
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* How It Works */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
                  <h3 className="font-semibold mb-2">Integrate</h3>
                  <p className="text-muted-foreground">White-label setup in 2-4 weeks via API/iframe.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                  <h3 className="font-semibold mb-2">Launch</h3>
                  <p className="text-muted-foreground">Offer as a free perk with your checking accounts.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                  <h3 className="font-semibold mb-2">Engage</h3>
                  <p className="text-muted-foreground">Members link accounts, get personalized budgets and alerts.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                  <h3 className="font-semibold mb-2">Grow</h3>
                  <p className="text-muted-foreground">Use insights to upsell loans to healthier members.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA Section */}
      <Reveal>
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Thrive?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Contact us today to customize Pocket Banker for your institution. Schedule a demo or request a quote.
              </p>
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started
              </Button>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default ForInstitutions;