import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutPreferenceProvider } from "@/hooks/useLayoutPreference";
import { DemoProvider } from "@/hooks/useDemo";
import { AccentProvider } from "@/contexts/AccentProvider";

import { RouteProgress } from "@/components/RouteProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import { AppShell } from "@/components/layouts/AppShell";
import { ErrorBoundaryProvider } from "@/components/ErrorBoundary";

// Lazy load page components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Demo = lazy(() => import("./pages/Demo"));
const Dashboard = lazy(() => import("@/components/Dashboard"));
const ConversationalAI = lazy(() => import("./pages/ConversationalAI"));
const Goals = lazy(() => import("./pages/Goals"));
const Account = lazy(() => import("./pages/Account"));
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

const queryClient = new QueryClient();

const App = () => (
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
                    <RouteProgress />
                    <ScrollToTop />
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="pulse h-8 w-8 rounded-full bg-primary/20"></div></div>}>
                        <Routes>
                          <Route path="/" element={<Index />} />
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
                          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
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

export default App;