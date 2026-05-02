import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmpresaContextType {
  companyId: string | null;
  company: any | null;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType>({ companyId: null, company: null, loading: true });

export const useEmpresa = () => useContext(EmpresaContext);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company_user", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileData?.company_id) return null;

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profileData.company_id)
        .maybeSingle();
      if (companyError) throw companyError;
      return companyData;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return (
    <EmpresaContext.Provider value={{ 
      companyId: company?.id ?? null, 
      company: company ?? null,
      loading: isLoading 
    }}>
      {children}
    </EmpresaContext.Provider>
  );
}
