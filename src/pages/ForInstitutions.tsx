import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Building2, TrendingUp, Shield, Users, BarChart3, Clock, MessageCircle, Target, HelpCircle, Lock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useNavigate } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";

const ForInstitutions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      {/* Hero Section */}
      <Reveal>
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
                Pocket Banker for Financial Institutions
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-foreground">
                Elevate Your Members' Financial Health
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Affordable, AI-powered budgeting as a value-add for your checking accounts.
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
                Help members course-correct daily, weekly, and monthly—without adding workload to your staff.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-4">
                  Schedule a Demo
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Subhead Section */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-muted-foreground">
                Give members the modern money app they're asking for: real-time guidance, smart notifications, and budgets that sync with their accounts so goals stay on track.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Why Pocket Banker Section */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why Pocket Banker?</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-12">
                <p className="text-center">
                  You're building relationships, not just managing accounts. Pocket Banker is an affordable, branded experience that improves financial wellness, deepens engagement, and creates clear paths to deposits and future lending—without adding headcount or manual coaching.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Built for checking value</h3>
                  <p className="text-muted-foreground">Turn your account into a daily financial hub members actually use.</p>
                </Card>
                <Card className="p-6 text-center">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Frictionless adoption</h3>
                  <p className="text-muted-foreground">Works with leading aggregators for secure data sync; no manual entry required.</p>
                </Card>
                <Card className="p-6 text-center">
                  <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Brand-forward</h3>
                  <p className="text-muted-foreground">White-label visuals and messaging so it feels like your app from day one.</p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Member Benefits by Cadence */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Member Benefits by Cadence</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Daily */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Daily</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Real-time notifications for low balances, off-track spending, and bill-due nudges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>AI insights for quick, contextual answers (e.g., "What can I cut to save $50 this week?")</span>
                  </li>
                </ul>
              </Card>

              {/* Weekly */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Weekly</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Spending reviews with clean visuals and recommendations to realign budgets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Goal check-ins that nudge toward small, achievable wins</span>
                  </li>
                </ul>
              </Card>

              {/* Monthly */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Monthly</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Budget vs. actual reporting with auto-categorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Bill management overview to help avoid fees and surprises</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Features Tailored for Institutions */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Features Tailored for Institutions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Building2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">White-label branding</h3>
                    <p className="text-muted-foreground">Your logo, colors, tone—fully customizable.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Secure account syncing</h3>
                    <p className="text-muted-foreground">Via supported data aggregators (e.g., Plaid®).*</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">AI coaching at scale</h3>
                    <p className="text-muted-foreground">24/7 guidance that reduces routine questions and supports frontline teams.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Secure sharing</h3>
                    <p className="text-muted-foreground">Members can share read-only reports with advisors or family.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Analytics for you</h3>
                    <p className="text-muted-foreground">Anonymized trend insights to inform product strategy and outreach.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Impact Section */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">The Impact: Invest in Your Members, Grow Together</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Financially confident members keep primary relationships, use more products, and are better prepared for loans when the time is right. Pocket Banker turns your checking account into a daily engagement engine—so you can focus staff on high-value conversations.
              </p>
              <Card className="p-6 max-w-2xl mx-auto">
                <p className="text-muted-foreground mb-4">
                  "Pocket Banker transformed our member engagement—fewer overdrafts, more qualified loan inquiries."
                </p>
                <p className="font-semibold">— Credit Union Executive</p>
                <p className="text-sm text-muted-foreground mt-2">(illustrative testimonial—replace with a verified quote when available)</p>
              </Card>
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
                  <p className="text-muted-foreground">Branded setup via API/SDK or iframe. Typical launches complete in weeks (timelines vary by provider).</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                  <h3 className="font-semibold mb-2">Launch</h3>
                  <p className="text-muted-foreground">Offer as a free perk with checking (or bundle into select tiers).</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                  <h3 className="font-semibold mb-2">Engage</h3>
                  <p className="text-muted-foreground">Members link accounts, receive personalized budgets, alerts, and tips.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                  <h3 className="font-semibold mb-2">Grow</h3>
                  <p className="text-muted-foreground">Use anonymous insights to target education, deepen relationships, and identify lending readiness.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQs */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">FAQs</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Does this replace our financial counseling?</h3>
                      <p className="text-muted-foreground">No—Pocket Banker handles day-to-day guidance between touchpoints and escalates to your team when needed.</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Is member data sold or shared?</h3>
                      <p className="text-muted-foreground">No. We don't sell data. Analytics for institutions are aggregated and anonymized.</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Which cores/digital providers are supported?</h3>
                      <p className="text-muted-foreground">We integrate through standard APIs and major data aggregators; ask for current compatibility.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Compliance & Security */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Compliance & Security</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Privacy by design; members control connections and sharing.</p>
                </Card>
                <Card className="p-6 text-center">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Encryption in transit and at rest; role-based access.</p>
                </Card>
                <Card className="p-6 text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">We never move money or make lending decisions on behalf of members.</p>
                </Card>
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-4">
                  Schedule a Demo
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Request a Quote
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default ForInstitutions;