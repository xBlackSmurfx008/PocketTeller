import React, { createContext, useContext } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

// Context for error logging
const ErrorLoggerContext = createContext<{
  logError: (error: Error, errorInfo?: React.ErrorInfo, userId?: string) => void;
}>({
  logError: () => {}
});

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ErrorLoggerContext;
  declare context: React.ContextType<typeof ErrorLoggerContext>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Use proper logger instead of console
    logger.error('React Error Boundary caught error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    logger.info('Error boundary reset by user');
  };

  handleGoHome = () => {
    logger.info('User navigated to home from error boundary');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} reset={this.handleReset} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary provider with proper logger integration
export function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  const logError = (error: Error, errorInfo?: React.ErrorInfo, userId?: string) => {
    logger.error('Application error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      userId,
      url: window.location.href
    });
  };

  return (
    <ErrorLoggerContext.Provider value={{ logError }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ErrorLoggerContext.Provider>
  );
}

// Hook to access error logger from functional components
export function useErrorLogger() {
  const context = useContext(ErrorLoggerContext);
  if (!context) {
    throw new Error('useErrorLogger must be used within ErrorBoundaryProvider');
  }
  return context;
}

// Simple error fallback component
export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-sm w-full p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={reset} size="sm">
          Try again
        </Button>
      </Card>
    </div>
  );
}