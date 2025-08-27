import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const Terms = () => {
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
            <h1 className="text-4xl font-bold text-gradient">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Last updated: December 2024</p>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={100}>
            <Card className="card-hover-lift">
              <CardHeader>
                <CardTitle>Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  By accessing and using Budget AI, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          <Card>
            <CardHeader>
              <CardTitle>Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Budget AI is a personal finance management application that provides:
              </p>
              <ul>
                <li>Budget tracking and expense categorization</li>
                <li>Bank account integration through Plaid</li>
                <li>AI-powered financial insights and recommendations</li>
                <li>Bill reminders and financial goal tracking</li>
                <li>Demo mode with limited functionality (5 conversations)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Account Creation</h4>
              <p>
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              
              <h4>Demo Mode</h4>
              <p>
                Demo mode allows limited access to our services without account creation. Demo users can have up to 5 AI conversations before being required to create a full account to continue.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Data and Bank Connections</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Bank Account Integration</h4>
              <p>
                By connecting your bank accounts through Plaid, you authorize us to access your financial data for the purpose of providing budgeting services. We do not store your banking credentials.
              </p>
              
              <h4>Data Accuracy</h4>
              <p>
                While we strive to provide accurate financial insights, you are responsible for verifying all financial information and making informed decisions based on your complete financial picture.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Features</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Our AI assistant provides financial guidance and insights. This information is for educational purposes only and should not be considered professional financial advice. Always consult with qualified financial professionals for important financial decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>You agree not to:</p>
              <ul>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to other users' accounts</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Use automated tools to access the service without permission</li>
                <li>Share false or misleading financial information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our service, you consent to our data practices as described in the Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We strive to maintain high availability but cannot guarantee uninterrupted service. We may temporarily suspend the service for maintenance, updates, or other operational reasons.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Budget AI is provided "as is" without warranties of any kind. We are not liable for any financial decisions made based on our service or any damages resulting from the use of our application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                You may terminate your account at any time. We reserve the right to terminate accounts that violate these terms. Upon termination, you may request deletion of your personal data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We may update these terms from time to time. Significant changes will be communicated to users. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <p>
                Email: legal@budgetai.app<br />
                Address: [Your Company Address]
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;