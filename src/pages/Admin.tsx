import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Building2, Users, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Admin() {
  const qc = useQueryClient();
  
  const { data: companies, isLoading } = useQuery({
    queryKey: ["all_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          profiles:profiles(count)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_companies"] });
      toast.success("Status atualizado!");
    },
  });

  const changePlan = useMutation({
    mutationFn: async ({ id, plan }: { id: string, plan: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({ plan })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_companies"] });
      toast.success("Plano atualizado!");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Administração Geral" description="Gerencie todas as empresas e planos da plataforma" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empresas Totais</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies?.length || 0}</div>
          </CardContent>
        </Card>
        {/* More cards can be added here */}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Empresas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">{c.document || "—"}</TableCell>
                      <TableCell>
                        <select 
                          className="text-xs bg-transparent border rounded p-1"
                          value={c.plan}
                          onChange={(e) => changePlan.mutate({ id: c.id, plan: e.target.value })}
                        >
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </select>
                      </TableCell>
                      <TableCell className="text-center">{(c.profiles as any)?.[0]?.count || 0}</TableCell>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "destructive"}>
                          {c.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch 
                          checked={c.is_active} 
                          onCheckedChange={(checked) => toggleStatus.mutate({ id: c.id, is_active: checked })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}