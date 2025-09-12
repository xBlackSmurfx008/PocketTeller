
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutPreferenceProvider } from "@/hooks/useLayoutPreference";
import { DemoProvider } from "@/hooks/useDemo";
import { CoachMarks } from "@/components/CoachMarks";
import { RouteProgress } from "@/components/RouteProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";

// Lazy load page components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ConversationalAI = lazy(() => import("./pages/ConversationalAI"));
const Goals = lazy(() => import("./pages/Goals"));
const Account = lazy(() => import("./pages/Account"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budget = lazy(() => import("./pages/Budget"));
const SharedBudget = lazy(() => import("./pages/SharedBudget"));
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
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <RouteProgress />
                <ScrollToTop />
                <AppLayout>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="pulse h-8 w-8 rounded-full bg-primary/20"></div></div>}>
                    <Routes>
                      <Route path="/" element={<Auth />} />
                      <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <CoachMarks />
                </AppLayout>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </DemoProvider>
      </LayoutPreferenceProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
