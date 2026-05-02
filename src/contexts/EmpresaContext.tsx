import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmpresaContextType {
  companyId: string | null;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType>({ companyId: null, loading: true });

export const useEmpresa = () => useContext(EmpresaContext);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["company_user", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.company_id ?? null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return (
    <EmpresaContext.Provider value={{ companyId: data ?? null, loading: isLoading }}>
      {children}
    </EmpresaContext.Provider>
  );
}
