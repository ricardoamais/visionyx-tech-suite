import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Equipamentos from "./pages/Equipamentos";
import OrdensServico from "./pages/OrdensServico";
import Orcamentos from "./pages/Orcamentos";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Gerenciar from "./pages/Gerenciar";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/clientes" element={<ErrorBoundary><Clientes /></ErrorBoundary>} />
              <Route path="/equipamentos" element={<ErrorBoundary><Equipamentos /></ErrorBoundary>} />
              <Route path="/ordens" element={<ErrorBoundary><OrdensServico /></ErrorBoundary>} />
              <Route path="/orcamentos" element={<ErrorBoundary><Orcamentos /></ErrorBoundary>} />
              <Route path="/financeiro" element={<ErrorBoundary><Financeiro /></ErrorBoundary>} />
              <Route path="/estoque" element={<ErrorBoundary><Estoque /></ErrorBoundary>} />
              <Route path="/relatorios" element={<ErrorBoundary><Relatorios /></ErrorBoundary>} />
              <Route path="/configuracoes" element={<ErrorBoundary><Configuracoes /></ErrorBoundary>} />
              <Route path="/gerenciar" element={<ErrorBoundary><Gerenciar /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
