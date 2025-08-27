import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8 px-4 content-visible">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 ripple-effect"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-gradient">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">Last updated: December 2024</p>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={100}>
            <Card className="card-hover-lift">
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  Budget AI is committed to protecting your privacy and financial data. This Privacy Policy 
                  explains how we collect, use, and safeguard your information when you use our application.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={200}>
            <Card className="card-hover-lift">
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Personal Information</h4>
                <ul>
                  <li>Email address and authentication credentials</li>
                  <li>Profile information you choose to provide</li>
                  <li>Communication preferences</li>
                </ul>
                
                <h4>Financial Information</h4>
                <ul>
                  <li>Bank account connections through Plaid (encrypted)</li>
                  <li>Transaction data and spending patterns</li>
                  <li>Budget and financial goal information</li>
                  <li>Bill and payment information you enter</li>
                </ul>
                
                <h4>Usage Information</h4>
                <ul>
                  <li>App usage patterns and feature interactions</li>
                  <li>AI conversation history and preferences</li>
                  <li>Device information and browser type</li>
                </ul>
              </CardContent>
            </Card>
          </Reveal>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li>Provide personalized budgeting recommendations</li>
                <li>Analyze spending patterns and financial health</li>
                <li>Send bill reminders and budget alerts</li>
                <li>Improve our AI-powered financial insights</li>
                <li>Maintain and improve our services</li>
                <li>Communicate with you about your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Supabase</h4>
              <p>We use Supabase for secure data storage and authentication. Your data is encrypted and stored in compliance with industry standards.</p>
              
              <h4>Plaid</h4>
              <p>We integrate with Plaid to securely connect your bank accounts. Plaid's privacy practices are governed by their own privacy policy.</p>
              
              <h4>Google Gemini AI</h4>
              <p>Chat conversations may be processed by Google's Gemini AI to provide intelligent financial advice. Chat data is not permanently stored by Google.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Mode</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                When using our demo mode, you can have up to 5 conversations without creating an account. Demo conversations are processed by our AI but are not saved to your profile. To continue using the service beyond the demo limit, you must create a free account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure authentication, and regular security audits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain communications</li>
                <li>Request clarification about our data practices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                Email: privacy@budgetai.app<br />
                Address: [Your Company Address]
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;