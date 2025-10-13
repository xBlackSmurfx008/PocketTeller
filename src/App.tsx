import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutPreferenceProvider } from "@/hooks/useLayoutPreference";
import { DemoProvider } from "@/hooks/useDemo";
import { AccentProvider } from "@/contexts/AccentProvider";
import { Capacitor } from '@capacitor/core';

import { RouteProgress } from "@/components/RouteProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import { ErrorBoundaryProvider } from "@/components/ErrorBoundary";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";

// Lazy load page components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Demo = lazy(() => import("./pages/Demo"));
const Dashboard = lazy(() => import("@/components/Dashboard"));
const ConversationalAI = lazy(() => import("./pages/ConversationalAI"));
const Goals = lazy(() => import("./pages/Goals"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budget = lazy(() => import("./pages/Budget"));
const SharedBudget = lazy(() => import("./pages/SharedBudget"));
const ForInstitutions = lazy(() => import("./pages/ForInstitutions"));
const ForNonProfits = lazy(() => import("./pages/ForNonProfits"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const Subscription = lazy(() => import("./pages/Subscription"));
const TestPage = lazy(() => import("./pages/TestPage"));
const Settings = lazy(() => import("./pages/Settings"));
const BankingSettings = lazy(() => import("./pages/BankingSettings"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const NotificationsSettings = lazy(() => import("./pages/NotificationsSettings"));
const AppearanceSettings = lazy(() => import("./pages/AppearanceSettings"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const DataManagementSettings = lazy(() => import("./pages/DataManagementSettings"));

const queryClient = new QueryClient();

// Mobile root component - Navigate to auth page
function MobileRoot() {
  console.log('📱 MobileRoot: Mobile app detected, routing to auth');
  return <Navigate to="/auth" replace />;
}

const App = () => {
  const isNative = Capacitor.isNativePlatform();
  
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="budget-ai-theme">
      <LayoutPreferenceProvider>
        <DemoProvider>
          <AuthProvider>
            <AccentProvider>
              <TooltipProvider>
                <ErrorBoundaryProvider>
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <DeepLinkHandler />
                    <RouteProgress />
                    <ScrollToTop />
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="pulse h-8 w-8 rounded-full bg-primary/20"></div></div>}>
                        <Routes>
                          {/* Mobile apps: skip marketing, go to test page first */}
                          {/* Web apps: show marketing page */}
                          <Route path="/" element={isNative ? <MobileRoot /> : <Index />} />
                          <Route path="/test" element={<TestPage />} />
                          <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/demo" element={<Demo />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/confirm" element={<EmailConfirmation />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/chat" element={<ProtectedRoute><ConversationalAI /></ProtectedRoute>} />
                          <Route path="/chat/:threadId" element={<ProtectedRoute><ConversationalAI /></ProtectedRoute>} />
                          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                          <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/banking" element={<ProtectedRoute><BankingSettings /></ProtectedRoute>} />
            <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
            <Route path="/settings/appearance" element={<ProtectedRoute><AppearanceSettings /></ProtectedRoute>} />
            <Route path="/settings/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
            <Route path="/settings/data" element={<ProtectedRoute><DataManagementSettings /></ProtectedRoute>} />
                          <Route path="/subscription" element={<Subscription />} />
                          <Route path="/share/budget/:token" element={<SharedBudget />} />
                          <Route path="/for-institutions" element={<ForInstitutions />} />
                          <Route path="/for-nonprofits" element={<ForNonProfits />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </AppLayout>
                  </BrowserRouter>
                </ErrorBoundaryProvider>
              </TooltipProvider>
            </AccentProvider>
          </AuthProvider>
        </DemoProvider>
      </LayoutPreferenceProvider>
    </ThemeProvider>
    <Toaster />
    <Sonner />
  </QueryClientProvider>
  );
};

export default App;