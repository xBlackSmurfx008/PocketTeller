import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, BookOpen, Users, Shield, BarChart3, Phone, MessageCircle, TrendingUp, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useNavigate } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";
import { ContactDialog } from "@/components/ContactDialog";
import { useState } from "react";

const ForNonProfits = () => {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState<"demo" | "quote" | "consultation" | "general">("general");

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
                Pocket Banker for Non-Profits
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-foreground">
                Empower Your Community with Real Financial Skills
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
                Give the people you serve an AI-powered app that builds habits, delivers reminders, and answers money questions—right on their phone. You fund access; they keep control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => {
                    setContactType("consultation");
                    setContactOpen(true);
                  }}
                >
                  Contact Us
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate("/demo")}
                >
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Why Pocket Banker Section */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why Pocket Banker</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-center">
                  You're built for impact, not money management. Pocket Banker extends your reach between workshops and office hours with accessible financial education inspired by leaders in the space—delivered as daily, weekly, and monthly nudges that stick.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* What Participants Get */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What participants get</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Daily */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Daily</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Habit reminders for spending check-ins and bite-size literacy tips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>AI Q&A for questions like "How do I start an emergency fund?"</span>
                  </li>
                </ul>
              </Card>

              {/* Weekly */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Weekly</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Micro-lessons on debt, budgeting, and credit—connected to their own activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Progress alerts to keep goals on track</span>
                  </li>
                </ul>
              </Card>

              {/* Monthly */}
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Monthly</h3>
                <ul className="text-left space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Financial health snapshots that explain trends in plain language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Budget realignment tools with suggestions based on real data</span>
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
              <h2 className="text-3xl font-bold text-center mb-12">Features for community impact</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Customizable education</h3>
                    <p className="text-muted-foreground">Tailor content to your audience (basic budgeting, credit building, first-time homebuyer prep, and more).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Mobile-first + accessible</h3>
                    <p className="text-muted-foreground">Works on any phone; light/dark modes and accessibility features built-in.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Smart reminders</h3>
                    <p className="text-muted-foreground">Bill-due nudges and overspending alerts that promote self-reliance (not dependency).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Impact analytics</h3>
                    <p className="text-muted-foreground">Aggregate, anonymized dashboards show engagement, goal progress, and skill gains—so you can report outcomes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Secure & private</h3>
                    <p className="text-muted-foreground">We don't sell data. Privacy controls and nonprofit-friendly standards as table stakes.</p>
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
              <h2 className="text-3xl font-bold mb-6">The impact</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nonprofits that emphasize financial literacy see stronger long-term outcomes. Pocket Banker helps you scale that approach—no account access required—so participants build independence while you stay focused on your mission.
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
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <p className="text-muted-foreground mb-4">
                    "Pocket Banker amplified our financial education programs—community members now have tools at their fingertips!"
                  </p>
                  <p className="font-semibold">— Non-Profit Director</p>
                </Card>
                <Card className="p-6">
                  <p className="text-muted-foreground mb-4">
                    "Affordable and effective; the reminders keep our participants engaged long-term."
                  </p>
                  <p className="font-semibold">— Education Coordinator</p>
                </Card>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                (Testimonials illustrative; similar to outcomes reported by well-known literacy initiatives.)
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
              <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
                  <h3 className="font-semibold mb-2">Sign up</h3>
                  <p className="text-muted-foreground">Pick a tier and select your education tracks.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                  <h3 className="font-semibold mb-2">Distribute access</h3>
                  <p className="text-muted-foreground">Share links or codes to your community.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                  <h3 className="font-semibold mb-2">Educate & track</h3>
                  <p className="text-muted-foreground">Participants use the app; you see anonymized impact.</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                  <h3 className="font-semibold mb-2">Expand</h3>
                  <p className="text-muted-foreground">Scale to more programs as outcomes grow.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Who It's For */}
      <Reveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Who it's for</h2>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <Card className="p-6">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold">Community development orgs</h3>
                </Card>
                <Card className="p-6">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold">Housing & workforce nonprofits</h3>
                </Card>
                <Card className="p-6">
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold">Schools, churches, and social-service agencies</h3>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQs */}
      <Reveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">FAQs</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Do we ever handle participants' money?</h3>
                      <p className="text-muted-foreground">No. You sponsor access; participants keep complete control.</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Can we customize content?</h3>
                      <p className="text-muted-foreground">Yes—select modules by audience (e.g., rebuilding credit, managing irregular income).</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">What about privacy?</h3>
                      <p className="text-muted-foreground">We do not sell data. Aggregated analytics only; no individual financial details.</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Does it replace counseling?</h3>
                      <p className="text-muted-foreground">No—it fills the gaps between sessions with daily reinforcement.</p>
                    </div>
                  </div>
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
              <h2 className="text-3xl font-bold mb-6">Ready to make a lasting difference—without adding headcount?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join nonprofits transforming financial confidence with Pocket Banker.
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => {
                  setContactType("consultation");
                  setContactOpen(true);
                }}
              >
                Contact Us for a Free Consultation
              </Button>
            </div>
          </div>
        </section>
      </Reveal>
      
      <ContactDialog 
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultType={contactType}
      />
    </div>
  );
};

export default ForNonProfits;