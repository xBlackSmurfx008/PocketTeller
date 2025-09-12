import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthConfig } from '@/utils/authConfig';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; passwordValidation?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any; errorType?: string | null }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  validatePasswordStrength: (password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Auto-exit demo mode when a real user session is detected
        if (session?.user && !session.user.is_anonymous) {
          const demoState = sessionStorage.getItem('demo-state');
          if (demoState) {
            const parsed = JSON.parse(demoState);
            if (parsed.isDemo) {
              // Exit demo mode immediately when real user signs in
              sessionStorage.removeItem('demo-state');
              // Trigger a custom event to notify demo context
              window.dispatchEvent(new CustomEvent('exit-demo-mode'));
            }
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Validate password strength before attempting signup
      const passwordValidation = await validatePasswordStrength(password);
      
      if (!passwordValidation?.valid) {
        return { 
          error: { message: Array.isArray(passwordValidation?.errors) ? passwordValidation.errors.join(', ') : 'Password validation failed' }, 
          passwordValidation 
        };
      }

      // Check for suspicious activity
      const { data: suspiciousCheck } = await supabase.rpc('check_suspicious_auth_activity', {
        user_email: email.toLowerCase(),
        client_ip: null // Will be handled by the function
      }).single();

      if (suspiciousCheck) {
        // Log security event
        await supabase.rpc('log_security_event', {
          event_type: 'suspicious_signup_attempt',
          event_data: { email: email.toLowerCase(), reason: 'suspicious_activity_detected' },
          severity: 'WARN'
        });
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: AuthConfig.emailConfirmRedirect
        }
      });

      // Log successful signup attempt
      if (!error) {
        await supabase.rpc('log_security_event', {
          event_type: 'user_signup_success',
          event_data: { email: email.toLowerCase() },
          severity: 'INFO'
        });
      }

      return { error, passwordValidation };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check for suspicious activity before signin
      const { data: suspiciousCheck } = await supabase.rpc('check_suspicious_auth_activity', {
        user_email: email.toLowerCase(),
        client_ip: null // Will be handled by the function
      }).single();

      if (suspiciousCheck) {
        // Log security event
        await supabase.rpc('log_security_event', {
          event_type: 'suspicious_signin_attempt',
          event_data: { email: email.toLowerCase(), reason: 'suspicious_activity_detected' },
          severity: 'WARN'
        });
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Log auth attempt
      if (error) {
        await supabase.rpc('log_security_event', {
          event_type: 'signin_failed',
          event_data: { 
            email: email.toLowerCase(), 
            error_type: error.message.includes('Invalid') ? 'invalid_credentials' : 'other'
          },
          severity: 'WARN'
        });
      } else {
        await supabase.rpc('log_security_event', {
          event_type: 'signin_success',
          event_data: { email: email.toLowerCase() },
          severity: 'INFO'
        });
      }

      return { error };
    } catch (err: any) {
      console.error('Signin error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear all state
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const resendConfirmation = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: AuthConfig.emailConfirmRedirect
        }
      });
      
      // Map common errors to structured responses
      if (error) {
        console.error('Resend confirmation error:', error);
        
        // Return structured error info for better UX decisions
        const errorType = error.message.toLowerCase();
        if (errorType.includes('rate') || errorType.includes('limit')) {
          return { error, errorType: 'rate_limit' };
        } else if (errorType.includes('confirmed') || errorType.includes('already')) {
          return { error, errorType: 'already_confirmed' };
        } else if (errorType.includes('delivery') || errorType.includes('provider')) {
          return { error, errorType: 'delivery_failed' };
        }
      }
      
      return { error, errorType: error ? 'unknown' : null };
    } catch (err: any) {
      console.error('Unexpected resend error:', err);
      return { error: err, errorType: 'unknown' };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AuthConfig.passwordResetRedirect
    });
    return { error };
  };

  const sendMagicLink = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: AuthConfig.defaultRedirect
        }
      });
      
      return { error };
    } catch (err: any) {
      console.error('Magic link error:', err);
      return { error: err };
    }
  };

  const validatePasswordStrength = async (password: string): Promise<{ valid: boolean; errors: string[]; strength_score?: number }> => {
    try {
      const { data } = await supabase.rpc('validate_password_strength', {
        password: password
      }).single();
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as Record<string, any>;
        return {
          valid: Boolean(result.valid),
          errors: Array.isArray(result.errors) ? result.errors : [],
          strength_score: typeof result.strength_score === 'number' ? result.strength_score : undefined
        };
      }
      
      return { valid: false, errors: ['Unable to validate password'] };
    } catch (err: any) {
      console.error('Password validation error:', err);
      return { valid: false, errors: ['Password validation failed'] };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    resetPassword,
    sendMagicLink,
    validatePasswordStrength,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}