import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">AD</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet key={location.pathname} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
