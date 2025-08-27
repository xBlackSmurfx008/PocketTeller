import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import PublicFooter from '@/components/PublicFooter';

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      // Dev mode diagnostics
      if (import.meta.env.DEV) {
        console.log('EmailConfirmation - URL params:', {
          token: token ? 'present' : 'missing',
          tokenHash: tokenHash ? 'present' : 'missing', 
          type,
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing'
        });
      }

      // Handle password recovery redirect
      if (type === 'recovery' && accessToken && refreshToken) {
        if (import.meta.env.DEV) {
          console.log('EmailConfirmation - Redirecting to reset-password');
        }
        navigate(`/reset-password?${searchParams.toString()}`, { replace: true });
        return;
      }

      // Handle email confirmation
      if (type === 'signup' || type === 'email_change') {
        try {
          // Try setSession method first (new format with access/refresh tokens)
          if (accessToken && refreshToken) {
            if (import.meta.env.DEV) {
              console.log('EmailConfirmation - Using setSession method');
            }
            
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }

            setStatus('success');
            setMessage('Your email has been confirmed successfully! You can now access all features.');
            
            toast({
              title: "Email confirmed",
              description: "Welcome! Your account is now fully activated.",
            });

            // Redirect to home after a short delay
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
            
          } else if (token || tokenHash) {
            // Try verifyOtp method (legacy format with token/token_hash)
            if (import.meta.env.DEV) {
              console.log('EmailConfirmation - Using verifyOtp method');
            }
            
            const { error } = await supabase.auth.verifyOtp({
              type: type as 'signup' | 'email_change',
              token_hash: tokenHash || token || '',
            });

            if (error) {
              throw error;
            }

            setStatus('success');
            setMessage('Your email has been confirmed successfully! You can now access all features.');
            
            toast({
              title: "Email confirmed",
              description: "Welcome! Your account is now fully activated.",
            });

            // Redirect to home after a short delay
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
            
          } else {
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email and try again.');
            
            if (import.meta.env.DEV) {
              console.log('EmailConfirmation - No valid tokens found');
            }
          }
        } catch (error: any) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. Please try again.');
          
          toast({
            variant: "destructive",
            title: "Confirmation failed",
            description: error.message || "Please try clicking the link in your email again.",
          });
          
          if (import.meta.env.DEV) {
            console.log('EmailConfirmation - Error details:', error);
          }
        }
      } else {
        setStatus('error');
        setMessage('Invalid confirmation link. Please check your email and try again.');
        
        if (import.meta.env.DEV) {
          console.log('EmailConfirmation - Invalid type:', type);
        }
      }
    };

    // Only process if we have URL parameters
    if (searchParams.toString()) {
      confirmEmail();
    } else {
      setStatus('error');
      setMessage('No confirmation data found. Please check your email and click the confirmation link.');
    }
  }, [searchParams, navigate]);

  // Redirect authenticated users who access this page directly
  useEffect(() => {
    if (user && !searchParams.toString()) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirming your email...';
      case 'success':
        return 'Email confirmed!';
      case 'error':
        return 'Confirmation failed';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <CardTitle>{getTitle()}</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === 'success' && (
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting you to the dashboard...
                </p>
              )}
              
              {status === 'error' && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Common issues and solutions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Check if the email link has expired (usually valid for 24 hours)</li>
                      <li>Make sure you're using the latest email confirmation link</li>
                      <li>Try requesting a new confirmation email</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="w-full"
                  >
                    Request New Confirmation Email
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/auth')} 
                    className="w-full"
                  >
                    Try Magic Link Instead
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/')} 
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>
              )}

              {status === 'loading' && (
                <p className="text-sm text-muted-foreground text-center">
                  Please wait while we confirm your email address...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}