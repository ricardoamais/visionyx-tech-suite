import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout() {
  const location = useLocation();
  const { user, role } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("nome").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  return (
    <SidebarProvider>
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
