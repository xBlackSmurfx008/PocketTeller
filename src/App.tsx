
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
import { AccentProvider } from "@/contexts/AccentProvider";
import { CoachMarks } from "@/components/CoachMarks";
import { RouteProgress } from "@/components/RouteProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppShell } from "@/components/layouts/AppShell";

// Lazy load page components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ConversationalAI = lazy(() => import("./pages/ConversationalAI"));
const Goals = lazy(() => import("./pages/Goals"));
const Account = lazy(() => import("./pages/Account"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budget = lazy(() => import("./pages/Budget"));
const SharedBudget = lazy(() => import("./pages/SharedBudget"));
const Demo = lazy(() => import("./pages/Demo"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const ForInstitutions = lazy(() => import("./pages/ForInstitutions"));
const ForNonProfits = lazy(() => import("./pages/ForNonProfits"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="budget-ai-theme">
          <LayoutPreferenceProvider>
            <DemoProvider>
              <AccentProvider>
                <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <RouteProgress />
                <ScrollToTop />
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="pulse h-8 w-8 rounded-full bg-primary/20"></div></div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AppShell><Auth /></AppShell>} />
                    <Route path="/demo" element={<AppShell><Demo /></AppShell>} />
                    <Route path="/confirm" element={<AppShell><EmailConfirmation /></AppShell>} />
                    <Route path="/reset-password" element={<AppShell><ResetPassword /></AppShell>} />
                    <Route path="/chat" element={<AppShell><ProtectedRoute><ConversationalAI /></ProtectedRoute></AppShell>} />
                    <Route path="/chat/:threadId" element={<AppShell><ProtectedRoute><ConversationalAI /></ProtectedRoute></AppShell>} />
                    <Route path="/goals" element={<AppShell><ProtectedRoute><Goals /></ProtectedRoute></AppShell>} />
                    <Route path="/transactions" element={<AppShell><ProtectedRoute><Transactions /></ProtectedRoute></AppShell>} />
                    <Route path="/budget" element={<AppShell><ProtectedRoute><Budget /></ProtectedRoute></AppShell>} />
                    <Route path="/account" element={<AppShell><ProtectedRoute><Account /></ProtectedRoute></AppShell>} />
                    <Route path="/share/budget/:token" element={<AppShell><SharedBudget /></AppShell>} />
                    <Route path="/for-institutions" element={<AppShell><ForInstitutions /></AppShell>} />
                    <Route path="/for-nonprofits" element={<AppShell><ForNonProfits /></AppShell>} />
                    <Route path="/privacy" element={<AppShell><Privacy /></AppShell>} />
                    <Route path="/terms" element={<AppShell><Terms /></AppShell>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<AppShell><NotFound /></AppShell>} />
                  </Routes>
                </Suspense>
                <CoachMarks />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </AccentProvider>
      </DemoProvider>
    </LayoutPreferenceProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
