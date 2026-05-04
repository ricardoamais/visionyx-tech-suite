  import {
    LayoutDashboard, Users, Monitor, ClipboardList, FileText,
    DollarSign, Package, BarChart3, Settings, LogOut, Wrench,
    ShieldCheck, ShoppingCart, Building2, ShieldAlert, Sun, Moon,
     Building, Bell, User, LayoutGrid
  } from "lucide-react";
 import { useTheme } from "next-themes";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

 const mainItems = [
   { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-blue-500" },
   { title: "Clientes", url: "/clientes", icon: Users, color: "text-indigo-500" },
   { title: "Equipamentos", url: "/equipamentos", icon: Monitor, color: "text-sky-500" },
   { title: "Ordens de Serviço", url: "/ordens", icon: ClipboardList, color: "text-amber-500" },
   { title: "Orçamentos", url: "/orcamentos", icon: FileText, color: "text-emerald-500" },
   { title: "Contratos", url: "/contratos", icon: Building, color: "text-violet-500" },
 ];

 const managementItems = [
   { title: "Caixa / PDV", url: "/caixa", icon: ShoppingCart, color: "text-rose-500" },
   { title: "Financeiro", url: "/financeiro", icon: DollarSign, color: "text-green-500" },
   { title: "Estoque", url: "/estoque", icon: Package, color: "text-orange-500" },
   { title: "Relatórios", url: "/relatorios", icon: BarChart3, color: "text-cyan-500" },
   { title: "Configurações", url: "/configuracoes", icon: Settings, color: "text-slate-500" },
 ];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
   const { signOut, user, role } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isActive = (path: string) => location.pathname === path;
    const filteredManagementItems = managementItems.filter(item => 
      !["Financeiro"].includes(item.title)
    );
 
   const { data: profile } = useQuery({
     queryKey: ["profile", user?.id],
     enabled: !!user,
     queryFn: async () => {
       const { data } = await supabase.from("profiles").select("nome").eq("user_id", user!.id).maybeSingle();
       return data;
     },
   });
 
   return (
     <Sidebar collapsible="icon" className="border-r border-sidebar-border/30">
       <SidebarHeader className="p-6 border-b border-sidebar-border/50 bg-sidebar/50">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl grad-blue flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-base font-bold">V</span>
            </div>
           {!collapsed && (
             <div className="min-w-0 flex flex-col">
               <h1 className="text-base font-bold text-sidebar-foreground tracking-tight truncate leading-tight">
                  Visionyx
               </h1>
               <p className="text-[10px] text-muted-foreground truncate uppercase tracking-[0.1em] font-semibold mt-0.5 opacity-70">
                 Enterprise ERP
               </p>
             </div>
           )}
         </div>
       </SidebarHeader>
 
       <SidebarContent className="px-3 py-4 space-y-4">
         <SidebarGroup>
           <SidebarGroupLabel className="px-3 text-sidebar-foreground/30 text-[10px] uppercase font-bold tracking-widest mb-2">Menu Principal</SidebarGroupLabel>
           <SidebarGroupContent>
             <SidebarMenu>
               {mainItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    tooltip={item.title}
                    className={`relative h-10 px-3 transition-all duration-200 group/btn
                      ${isActive(item.url) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}
                    `}
                   >
                     <NavLink to={item.url} end={item.url === "/"} className="flex items-center w-full">
                       {isActive(item.url) && !collapsed && (
                         <div className="absolute left-0 top-2 bottom-2 w-[3px] grad-blue rounded-r-full" />
                       )}
                       <div className={`p-1.5 rounded-lg transition-colors group-hover/btn:bg-sidebar-accent/80 ${isActive(item.url) ? 'bg-sidebar-accent/50' : ''}`}>
                        <item.icon className={`w-4 h-4 ${isActive(item.url) ? 'text-primary' : item.color}`} />
                       </div>
                       {!collapsed && <span className="ml-3 font-medium text-[13px]">{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
 
         <div className="mx-3 h-[1px] bg-sidebar-border/30" />
 
         <SidebarGroup>
           <SidebarGroupLabel className="px-3 text-sidebar-foreground/30 text-[10px] uppercase font-bold tracking-widest mb-2">Administração</SidebarGroupLabel>
           <SidebarGroupContent>
             <SidebarMenu>
               {filteredManagementItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    tooltip={item.title}
                    className={`relative h-10 px-3 transition-all duration-200 group/btn
                      ${isActive(item.url) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}
                    `}
                   >
                     <NavLink to={item.url} className="flex items-center w-full">
                       {isActive(item.url) && !collapsed && (
                         <div className="absolute left-0 top-2 bottom-2 w-[3px] grad-blue rounded-r-full" />
                       )}
                       <div className={`p-1.5 rounded-lg transition-colors group-hover/btn:bg-sidebar-accent/80 ${isActive(item.url) ? 'bg-sidebar-accent/50' : ''}`}>
                        <item.icon className={`w-4 h-4 ${isActive(item.url) ? 'text-primary' : item.color}`} />
                       </div>
                       {!collapsed && <span className="ml-3 font-medium text-[13px]">{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
       </SidebarContent>
 
       <SidebarFooter className="p-4 border-t border-sidebar-border/30 bg-sidebar/30">
         <SidebarMenu>
           <SidebarMenuItem>
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2 py-3 bg-white/5 rounded-xl border border-white/5'}`}>
                 <div className="relative">
                   <div className="w-9 h-9 rounded-lg grad-purple flex items-center justify-center border border-white/10 shadow-md">
                     <span className="text-xs font-bold text-white">
                       {profile?.nome?.substring(0, 2).toUpperCase() || "US"}
                     </span>
                   </div>
                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-sidebar-background rounded-full" />
                 </div>
                 {!collapsed && (
                   <div className="min-w-0 flex-1">
                     <p className="text-xs font-bold text-sidebar-foreground truncate">{profile?.nome || "Usuário"}</p>
                     <p className="text-[10px] text-muted-foreground truncate uppercase font-medium opacity-60">
                       {role === 'admin' ? 'Administrador' : 'Técnico'}
                     </p>
                   </div>
                 )}
                 {!collapsed && (
                   <button 
                     onClick={signOut}
                     className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                     title="Sair do sistema"
                   >
                     <LogOut className="w-4 h-4" />
                   </button>
                 )}
              </div>
           </SidebarMenuItem>
 
           <SidebarMenuItem className="mt-2">
             <SidebarMenuButton
               onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
               tooltip={collapsed ? (resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro") : undefined}
               className="h-9 px-3 opacity-60 hover:opacity-100 transition-opacity"
             >
               {resolvedTheme === "dark" ? (
                 <Sun className="w-4 h-4" />
               ) : (
                 <Moon className="w-4 h-4" />
               )}
               {!collapsed && <span className="text-xs font-medium">{resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
       </SidebarFooter>
     </Sidebar>
   );
}
