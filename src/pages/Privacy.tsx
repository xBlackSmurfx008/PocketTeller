import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Budget AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our budgeting and financial management application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Personal Information</h4>
              <ul>
                <li>Email address and password for account creation</li>
                <li>Profile information you choose to provide</li>
                <li>Financial goals and budget preferences</li>
              </ul>
              
              <h4>Financial Data</h4>
              <ul>
                <li>Bank account information (through Plaid integration)</li>
                <li>Transaction history and categorization</li>
                <li>Bill information and payment schedules</li>
                <li>Budget allocations and spending patterns</li>
              </ul>

              <h4>Usage Data</h4>
              <ul>
                <li>App usage patterns and feature interactions</li>
                <li>Chat conversations with our AI assistant</li>
                <li>Device information and browser type</li>
              </ul>
            </CardContent>
          </Card>

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