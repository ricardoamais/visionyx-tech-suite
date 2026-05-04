 import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
 import { AppSidebar } from "@/components/AppSidebar";
 import { Outlet, useLocation, Link } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

   const breadcrumbParts = breadcrumb.split(" > ");

   return (
     <SidebarProvider>
       <div className="min-h-screen flex w-full bg-background">
         <AppSidebar />
         <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
           <header className="h-16 flex items-center border-b border-border/40 px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20">
             <div className="flex items-center gap-4 flex-1">
               <SidebarTrigger className="h-9 w-9 border border-border/50 hover:bg-muted/50 transition-colors" />
               
               <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground/60">
                 {breadcrumbParts.map((part, i) => (
                   <div key={part} className="flex items-center">
                     {i > 0 && <ChevronRight className="w-3.5 h-3.5 mx-2 opacity-40" />}
                     <span className={i === breadcrumbParts.length - 1 ? "text-foreground font-bold tracking-tight" : "hover:text-foreground/80 cursor-default transition-colors"}>
                       {part}
                     </span>
                   </div>
                 ))}
               </div>
             </div>

             <div className="flex items-center gap-2">
               <div className="hidden sm:flex relative max-w-[200px] lg:max-w-[300px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                 <Input 
                   placeholder="Pesquisar..." 
                   className="h-9 pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 w-full rounded-full transition-all focus-visible:bg-muted/50"
                 />
               </div>
               
               <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/50 text-muted-foreground">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
               </Button>
             </div>
           </header>

           <main className="flex-1 overflow-auto bg-[#fafbfc] dark:bg-background/20 p-4 lg:p-8">
             <div className="max-w-7xl mx-auto">
               <ErrorBoundary>
                 <Outlet key={location.pathname} />
               </ErrorBoundary>
             </div>
           </main>
         </div>
       </div>
     </SidebarProvider>
   );
}
