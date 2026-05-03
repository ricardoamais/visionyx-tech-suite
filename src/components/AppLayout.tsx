 import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
 import { AppSidebar } from "@/components/AppSidebar";
 import { Outlet, useLocation, Link } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BillingManager } from "./BillingManager";

 import { Bell, Search, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";

 const routeLabels: Record<string, string> = {
   "/": "Dashboard",
   "/clientes": "Gestão > Clientes",
   "/equipamentos": "Gestão > Equipamentos",
   "/ordens": "Operacional > Ordens de Serviço",
   "/orcamentos": "Operacional > Orçamentos",
   "/contratos": "Gestão > Contratos",
   "/caixa": "Financeiro > Caixa / PDV",
   "/financeiro": "Financeiro > Geral",
   "/estoque": "Gestão > Estoque",
   "/relatorios": "Análise > Relatórios",
   "/configuracoes": "Sistema > Configurações",
   "/equipe": "Sistema > Equipe",
   "/admin": "Sistema > Platform Admin",
 };

 export function AppLayout() {
   const location = useLocation();
   const breadcrumb = routeLabels[location.pathname] || "Página";

  return (
    <SidebarProvider>
      <BillingManager />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xs font-semibold text-primary">
                  {profile?.nome?.substring(0, 2).toUpperCase() || "US"}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{profile?.nome || "Usuário"}</p>
                <p className="text-xs text-muted-foreground capitalize">{role === 'admin' ? 'Administrador' : 'Técnico'}</p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <ErrorBoundary>
              <Outlet key={location.pathname} />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
