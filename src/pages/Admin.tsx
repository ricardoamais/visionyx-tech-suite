import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Building2, Users, CreditCard, Search, MoreHorizontal, Eye, Trash2, ShieldCheck, ShieldAlert, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";

export default function Admin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["all_companies"],
    queryFn: async () => {
      const { data: rawData, error: rawError } = await supabase
        .from("companies")
        .select(`
          *,
          profiles:profiles(count)
        `)
        .order("created_at", { ascending: false });
      
      if (rawError) throw rawError;
      
      const enrichedData = await Promise.all(rawData.map(async (c: any) => {
        const { count: osCount } = await supabase
          .from("ordens_servico")
          .select("*", { count: 'exact', head: true })
          .eq("company_id", c.id);
        return { ...c, os_count: osCount || 0 };
      }));
      
      return enrichedData;
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

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      // All linked data should be deleted via cascade or manually. 
      // For now we assume regular delete.
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_companies"] });
      toast.success("Conta excluída permanentemente.");
    },
    onError: (e: any) => toast.error("Erro ao excluir: " + e.message),
  });

  const filtered = companies?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: companies?.length || 0,
    active: companies?.filter(c => c.is_active).length || 0,
    free: companies?.filter(c => c.plan === 'free').length || 0,
    premium: companies?.filter(c => c.plan !== 'free').length || 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Administração Geral" description="Gerencie todas as empresas e planos da plataforma" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><Building2 className="w-4 h-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Ativas</CardTitle><ShieldCheck className="w-4 h-4 text-emerald-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Plano Free</CardTitle><CreditCard className="w-4 h-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.free}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pro/Enterprise</CardTitle><CreditCard className="w-4 h-4 text-primary" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.premium}</div></CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Empresas Cadastradas</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar empresa ou email..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
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
                <TableBody>{filtered?.map((c) => (
                    <TableRow key={c.id} className={!c.is_active ? "opacity-60" : ""}>
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
                      <TableCell className="text-right space-x-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedCompany(c)}><Eye className="w-4 h-4" /></Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>{c.name}</SheetTitle>
                              <SheetDescription>Detalhes completos da conta</SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-6">
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">CNPJ</Label><p>{c.document || "Não informado"}</p></div>
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Email Admin</Label><p>{c.email}</p></div>
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Telefone</Label><p>{c.phone || "Não informado"}</p></div>
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Total de OS</Label><p>{c.os_count} ordens</p></div>
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Total de Usuários</Label><p>{(c.profiles as any)?.[0]?.count || 0} usuários</p></div>
                              <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Data Cadastro</Label><p>{new Date(c.created_at).toLocaleString("pt-BR")}</p></div>
                              <div className="pt-4 border-t space-y-4">
                                <div className="flex items-center justify-between"><Label>Status da Conta</Label><Switch checked={c.is_active} onCheckedChange={(checked) => toggleStatus.mutate({ id: c.id, is_active: checked })} /></div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Excluir Conta</Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Isso excluirá permanentemente a empresa <strong>{c.name}</strong> e todos os seus dados. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteCompany.mutate(c.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir Permanentemente</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                        <Switch checked={c.is_active} onCheckedChange={(checked) => toggleStatus.mutate({ id: c.id, is_active: checked })} />
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