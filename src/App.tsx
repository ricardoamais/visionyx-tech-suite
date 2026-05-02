import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EmpresaProvider, useEmpresa } from "@/contexts/EmpresaContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
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
import Admin from "./pages/Admin";
import Caixa from "./pages/Caixa";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <EmpresaProvider><EmpresaGate>{children}</EmpresaGate></EmpresaProvider>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const EmpresaGate = ({ children }: { children: ReactNode }) => {
  const { loading } = useEmpresa();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: ReactNode }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (role !== "super_admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/ordens" element={<OrdensServico />} />
                <Route path="/orcamentos" element={<Orcamentos />} />
                <Route path="/financeiro" element={<AdminRoute><Financeiro /></AdminRoute>} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/configuracoes" element={<AdminRoute><Configuracoes /></AdminRoute>} />
                <Route path="/gerenciar" element={<AdminRoute><Gerenciar /></AdminRoute>} />
                <Route path="/admin" element={<SuperAdminRoute><Admin /></SuperAdminRoute>} />
                <Route path="/caixa" element={<Caixa />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
