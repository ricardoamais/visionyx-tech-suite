import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmpresaContextType {
  empresaId: string | null;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType>({ empresaId: null, loading: true });

export const useEmpresa = () => useContext(EmpresaContext);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["empresa_usuario", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresa_usuarios")
        .select("empresa_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.empresa_id ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <EmpresaContext.Provider value={{ empresaId: data ?? null, loading: isLoading }}>
      {children}
    </EmpresaContext.Provider>
  );
}
