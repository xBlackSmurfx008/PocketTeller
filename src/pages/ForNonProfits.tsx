import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, BookOpen, Users, Shield, BarChart3 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const ForNonProfits = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Reveal>
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pocket Banker for Non-Profits
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-foreground">
                Empower Your Community with Financial Education Tools
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Provide Ongoing Guidance and Reminders Through Pocket Banker
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
                As a non-profit, you serve communities in need—now give them the tools to manage finances independently. Pay for access to our AI-powered app, offering reminders, education, and budgeting on their phones, without you managing their money.
              </p>
              <Button size="lg" className="text-lg px-8 py-4">
                Learn More
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
              <h2 className="text-3xl font-bold text-center mb-12">Why Pocket Banker for Non-Profits?</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-center">
                  Your mission is impact, not money management. Pocket Banker delivers accessible financial education tools, inspired by organizations like NEFE and Operation HOPE. Offer ongoing reminders and guidance when you can't be there, helping community members build habits for long-term stability.
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
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Daily Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Habit Reminders:</strong> Push notifications for daily spending checks and quick tips on financial literacy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>AI Q&A:</strong> Instant answers to questions like "How do I build an emergency fund?" via chat.</span>
                  </li>
                </ul>
              </Card>

              {/* Weekly Benefits */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Weekly Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Education Modules:</strong> Bite-sized lessons on topics like debt management, integrated with personal tracking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Progress Alerts:</strong> Weekly goal updates to keep users motivated and on track.</span>
                  </li>
                </ul>
              </Card>

              {/* Monthly Benefits */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Monthly Benefits</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Comprehensive Reviews:</strong> Monthly financial health snapshots with educational insights on trends.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span><strong>Budget Realignment:</strong> Tools to adjust budgets based on real data, with tips for better decisions.</span>
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
              <h2 className="text-3xl font-bold text-center mb-12">Features for Community Impact</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Customizable Education</h3>
                    <p className="text-muted-foreground">Tailor content to your community's needs, like basic budgeting or credit building.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Mobile-First Tools</h3>
                    <p className="text-muted-foreground">Easy phone access for underserved groups, with dark/light modes and accessibility features.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Reminders & Notifications</h3>
                    <p className="text-muted-foreground">Automated nudges for bill due dates or overspending, promoting self-reliance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Analytics for You</h3>
                    <p className="text-muted-foreground">Aggregate, anonymized data to measure program impact and refine your outreach.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Secure & Private</h3>
                    <p className="text-muted-foreground">No data selling; complies with standards for non-profits.</p>
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
              <h2 className="text-3xl font-bold mb-6">The Impact: Make a Lasting Difference</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Non-profits using financial literacy tools see improved community outcomes, with resources like those from the Council of Nonprofits emphasizing education over management. Pocket Banker lets you provide real tools without overextending—focus on your mission while users gain independence. "You can't and don't want to manage their money; let's simply give them the actual tools on their phone to do so."
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
                    "Pocket Banker amplified our financial education programs—community members now have tools at their fingertips!"
                  </p>
                  <p className="font-semibold">– Non-Profit Director</p>
                </Card>
                <Card className="p-6">
                  <p className="text-muted-foreground mb-4">
                    "Affordable and effective; reminders keep our participants engaged long-term."
                  </p>
                  <p className="font-semibold">– Education Coordinator</p>
                </Card>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                (Hypothetical inspired by tools like Credit.org.)
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
                  <h3 className="font-semibold mb-2">Sign Up</h3>
                  <p className="text-muted-foreground">Choose your tier and customize educational content.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                  <h3 className="font-semibold mb-2">Distribute Access</h3>
                  <p className="text-muted-foreground">Share app links or codes with your community.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                  <h3 className="font-semibold mb-2">Educate & Track</h3>
                  <p className="text-muted-foreground">Users get tools; you get impact reports.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                  <h3 className="font-semibold mb-2">Expand</h3>
                  <p className="text-muted-foreground">Scale as your programs grow.</p>
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
              <h2 className="text-3xl font-bold mb-6">Ready to Make an Impact?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join non-profits transforming lives with financial tools. Contact us for a free consultation.
              </p>
              <Button size="lg" className="text-lg px-8 py-4">
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default ForNonProfits;