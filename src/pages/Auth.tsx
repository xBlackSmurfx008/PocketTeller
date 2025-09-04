import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/utils/authConfig';
import { Play, Eye, EyeOff, ArrowLeft, Mail, RotateCcw, AlertCircle } from 'lucide-react';
import PublicFooter from '@/components/PublicFooter';
import { Reveal } from '@/components/Reveal';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [lastSignUpEmail, setLastSignUpEmail] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const { signUp, signIn, user, resendConfirmation, resetPassword, sendMagicLink } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      const nextPath = searchParams.get('next') || '/';
      navigate(nextPath);
    }
  }, [user, navigate, searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email?.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!password?.trim()) {
      toast({
        title: "Password required", 
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(email.trim(), password);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } else {
      setLastSignUpEmail(email);
      toast({
        title: "Success!",
        description: "Check your email (including spam folder) for the confirmation link.",
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email?.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!password?.trim()) {
      toast({
        title: "Password required", 
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setEmailNotConfirmed(false);
    
    const { error } = await signIn(email.trim(), password);
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setEmailNotConfirmed(true);
        setLastSignUpEmail(email);
        toast({
          title: "Email not confirmed",
          description: "Please check your email and click the confirmation link, or use the resend option below.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign in failed",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    } else {
      const nextPath = searchParams.get('next') || '/';
      navigate(nextPath);
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    const emailToResend = lastSignUpEmail || email;
    if (!emailToResend) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }
    
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    
    if (import.meta.env.DEV) {
      console.log('Auth - Attempting resend for:', emailToResend);
    }
    
    const { error, errorType } = await resendConfirmation(emailToResend);
    
    if (error) {
      const errorMessage = getErrorMessage(error);
      
      // Show specific error with magic link fallback for certain cases
      if (errorType === 'rate_limit') {
        toast({
          title: "Too many requests",
          description: `${errorMessage} Try the magic link option below as an alternative.`,
          variant: "destructive",
        });
      } else if (errorType === 'already_confirmed') {
        toast({
          title: "Account already confirmed",
          description: "Your email is already confirmed. Try signing in directly.",
          variant: "destructive",
        });
      } else if (errorType === 'delivery_failed') {
        toast({
          title: "Email delivery issue",
          description: `${errorMessage} Try the magic link option below.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to resend",
          description: `${errorMessage} Try the magic link option as an alternative.`,
          variant: "destructive",
        });
      }
      
      if (import.meta.env.DEV) {
        console.log('Auth - Resend error:', error, 'Type:', errorType);
      }
    } else {
      toast({
        title: "Confirmation email sent",
        description: `Please check your email (${emailToResend}) including spam folder for the confirmation link.`,
      });
      
      // Start 30-second cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (import.meta.env.DEV) {
        console.log('Auth - Resend successful for:', emailToResend);
      }
    }
    setResendLoading(false);
  };

  const handleMagicLink = async () => {
    const emailToSend = lastSignUpEmail || email;
    if (!emailToSend) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setMagicLinkLoading(true);
    
    const { error } = await sendMagicLink(emailToSend);
    
    if (error) {
      toast({
        title: "Failed to send magic link",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Magic link sent!",
        description: `Check your email (${emailToSend}) for a magic sign-in link that works immediately.`,
      });
    }
    
    setMagicLinkLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password reset email sent",
        description: "Please check your email (including spam folder) for reset instructions.",
      });
      setShowForgotPassword(false);
    }
    setResetLoading(false);
  };

  const handleDemoAccess = () => {
    navigate('/demo');
    toast({
      title: "Demo Mode",
      description: "Starting local demo with sample data - your session won't be saved.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Back to Home Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          {/* Test Environment Alert */}
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a test environment. Bank connections are currently disabled. You can explore features using the Demo. Real bank linking will be available at launch.
            </AlertDescription>
          </Alert>
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Welcome to Pocket Banker</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to get started.
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Demo Button - Prominent placement */}
              <div className="text-center space-y-2">
                <Button 
                  onClick={handleDemoAccess}
                  variant="outline" 
                  className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try Demo - No Signup Required
                </Button>
                <p className="text-xs text-muted-foreground">
                  Explore Pocket Banker with sample data
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with your account
                  </span>
                </div>
              </div>

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  {showForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Button type="submit" className="w-full" disabled={resetLoading}>
                          {resetLoading ? "Sending reset email..." : "Send Reset Email"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="w-full" 
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {emailNotConfirmed && lastSignUpEmail && (
                        <Alert>
                          <Mail className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p>Email not confirmed for <strong>{lastSignUpEmail}</strong>. Check your inbox.</p>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleResendConfirmation}
                                  disabled={resendLoading || resendCooldown > 0}
                                >
                                  {resendLoading ? (
                                    <RotateCcw className="h-3 w-3 animate-spin" />
                                  ) : resendCooldown > 0 ? (
                                    `Wait ${resendCooldown}s`
                                  ) : (
                                    "Resend"
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={handleMagicLink}
                                  disabled={magicLinkLoading}
                                >
                                  {magicLinkLoading ? (
                                    <RotateCcw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Use magic link instead"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pr-10"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="w-full text-sm" 
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot password?
                        </Button>
                      </form>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="signup">
                  <div className="space-y-4">
                    {lastSignUpEmail && (
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p>Confirmation email sent to <strong>{lastSignUpEmail}</strong>. Check spam folder if needed.</p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleResendConfirmation}
                                disabled={resendLoading || resendCooldown > 0}
                              >
                                {resendLoading ? (
                                  <RotateCcw className="h-3 w-3 animate-spin" />
                                ) : resendCooldown > 0 ? (
                                  `Wait ${resendCooldown}s`
                                ) : (
                                  "Resend"
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleMagicLink}
                                disabled={magicLinkLoading}
                              >
                                {magicLinkLoading ? (
                                  <RotateCcw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Use magic link instead"
                                )}
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10"
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password strength: {password.length >= 8 ? "Good" : "Too short"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10"
                            required
                            placeholder="Confirm your password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-xs text-destructive">
                            Passwords don't match
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}