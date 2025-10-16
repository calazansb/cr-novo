import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "@/components/Auth/AuthCallback";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { seedObjetoProcedimento } from "@/lib/seed-objeto-procedimento";
import OneDriveCallback from "./pages/OneDriveCallback";

console.log('🎯 App.tsx carregado!');

const queryClient = new QueryClient();

const App = () => {
  console.log('🏃 App component renderizando...');
  console.log('🌐 Window location:', window.location.href);
  
  useEffect(() => {
    const runSeed = async () => {
      const hasSeeded = localStorage.getItem('objeto-procedimento-seeded');
      if (!hasSeeded) {
        const success = await seedObjetoProcedimento();
        if (success) {
          localStorage.setItem('objeto-procedimento-seeded', 'true');
        }
      }
    };
    runSeed();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/reset-password" element={<ResetPasswordForm />} />
              <Route path="/onedrive/callback" element={<OneDriveCallback />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
