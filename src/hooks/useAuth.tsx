import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthConfig } from '@/utils/authConfig';
import { AuthResponse, PasswordValidation, AuthErrorType, SupabaseError } from '@/types/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<AuthResponse>;
  resendConfirmation: (email: string) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  sendMagicLink: (email: string) => Promise<AuthResponse>;
  validatePasswordStrength: (password: string) => Promise<PasswordValidation>;
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

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Validate password strength before attempting signup
      const passwordValidation = await validatePasswordStrength(password);
      
      if (!passwordValidation.valid) {
        return { 
          error: { 
            message: Array.isArray(passwordValidation.errors) 
              ? passwordValidation.errors.join(', ') 
              : 'Password validation failed' 
          }, 
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: AuthConfig.emailConfirmRedirect,
          // Allow users to access app immediately without email confirmation
          // They can confirm email later via the reminder banner
          data: {
            email_confirmed: false
          }
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

      // If signup successful, user and session are automatically set by the auth state listener
      // No need to manually set them here
      
      return { 
        error: error as SupabaseError | null, 
        passwordValidation,
        user: data?.user ?? null,
        session: data?.session ?? null
      };
    } catch (err) {
      console.error('Signup error:', err);
      return { 
        error: err instanceof Error 
          ? { message: err.message } 
          : { message: 'An unexpected error occurred' }
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
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

      return { error: error as SupabaseError | null };
    } catch (err) {
      console.error('Signin error:', err);
      return { 
        error: err instanceof Error 
          ? { message: err.message } 
          : { message: 'An unexpected error occurred' }
      };
    }
  };

  const signOut = async (): Promise<AuthResponse> => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear all state
      setUser(null);
      setSession(null);
    }
    return { error: error as SupabaseError | null };
  };

  const resendConfirmation = async (email: string): Promise<AuthResponse> => {
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
        let typedErrorType: AuthErrorType = 'unknown';
        
        if (errorType.includes('rate') || errorType.includes('limit')) {
          typedErrorType = 'rate_limit';
        } else if (errorType.includes('confirmed') || errorType.includes('already')) {
          typedErrorType = 'already_confirmed';
        } else if (errorType.includes('delivery') || errorType.includes('provider')) {
          typedErrorType = 'delivery_failed';
        }
        
        return { 
          error: error as SupabaseError, 
          errorType: typedErrorType 
        };
      }
      
      return { error: null, errorType: null };
    } catch (err) {
      console.error('Unexpected resend error:', err);
      return { 
        error: err instanceof Error 
          ? { message: err.message } 
          : { message: 'An unexpected error occurred' },
        errorType: 'unknown' as AuthErrorType
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AuthConfig.passwordResetRedirect
    });
    return { error: error as SupabaseError | null };
  };

  const sendMagicLink = async (email: string): Promise<AuthResponse> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: AuthConfig.defaultRedirect
        }
      });
      
      return { error: error as SupabaseError | null };
    } catch (err) {
      console.error('Magic link error:', err);
      return { 
        error: err instanceof Error 
          ? { message: err.message } 
          : { message: 'An unexpected error occurred' }
      };
    }
  };

  const validatePasswordStrength = async (password: string): Promise<PasswordValidation> => {
    try {
      const { data } = await supabase.rpc('validate_password_strength', {
        password: password
      }).single();
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as Record<string, unknown>;
        return {
          valid: Boolean(result.valid),
          errors: Array.isArray(result.errors) ? result.errors : [],
          strength_score: typeof result.strength_score === 'number' ? result.strength_score : undefined
        };
      }
      
      return { valid: false, errors: ['Unable to validate password'] };
    } catch (err) {
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

/**
 * Hook to access authentication context
 * @throws {Error} If used outside of AuthProvider
 * @returns {AuthContextType} Authentication context with user, session, and auth methods
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}