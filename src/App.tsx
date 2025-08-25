
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutPreferenceProvider } from "@/hooks/useLayoutPreference";
import { DemoProvider } from "@/hooks/useDemo";
import { CoachMarks } from "@/components/CoachMarks";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ConversationalAI from "./pages/ConversationalAI";
import Goals from "./pages/Goals";
import Account from "./pages/Account";
import Transactions from "./pages/Transactions";
import SharedBudget from "./pages/SharedBudget";
import Demo from "./pages/Demo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="budget-ai-theme">
      <LayoutPreferenceProvider>
        <DemoProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/chat" element={<ConversationalAI />} />
                  <Route path="/chat/:threadId" element={<ConversationalAI />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/share/budget/:token" element={<SharedBudget />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CoachMarks />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </DemoProvider>
      </LayoutPreferenceProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
