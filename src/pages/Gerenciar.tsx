import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Loader2, Pencil, KeyRound, ShieldCheck, UserPlus, Mail, CreditCard, Settings, Check, Ban, DollarSign, Users, AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ManagedUser {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is_admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}

function useUsers() {
  return useQuery({
    queryKey: ["managed_users"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (res.error) throw new Error(res.error.message || "Erro ao listar usuários");
      if (res.data?.error) throw new Error(res.data.error);
      return res.data as ManagedUser[];
    },
  });
}

export default function Gerenciar() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { isSuperAdmin } = useAuth();
  const { data: users, isLoading } = useUsers();
  const qc = useQueryClient();

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["managed_companies"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: platformSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["platform_settings_admin"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("*").single();
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("platform_settings")
        .update(values)
        .eq("id", platformSettings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
      qc.invalidateQueries({ queryKey: ["platform_settings_admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCompanyPaymentMutation = useMutation({
    mutationFn: async ({ id, status, expiresAt }: { id: string, status: string, expiresAt?: string }) => {
      const updates: any = { payment_status: status };
      if (expiresAt) updates.plan_expires_at = expiresAt;
      
      const { error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa atualizada!");
      qc.invalidateQueries({ queryKey: ["managed_companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editRole, setEditRole] = useState("");

  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteRole, setInviteRole] = useState("tecnico");

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "invite", email: inviteEmail, nome: inviteNome, role: inviteRole },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteNome("");
      qc.invalidateQueries({ queryKey: ["managed_users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "update", userId: editUser.id, nome: editNome, telefone: editTelefone, role: editRole },
      });
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success("Usuário atualizado!");
      setEditUser(null);
      qc.invalidateQueries({ queryKey: ["managed_users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!resetUser || !newPassword) return;
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "reset_password", userId: resetUser.id, newPassword },
      });
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success("Senha redefinida!");
      setResetUser(null);
      setNewPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (checkingAdmin) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setEditNome(u.nome);
    setEditTelefone(u.telefone || "");
    setEditRole(u.role);
  };

  const [pixKey, setPixKey] = useState("");
  const [pixName, setPixName] = useState("");
  const [priceFree, setPriceFree] = useState("");
  const [pricePro, setPricePro] = useState("");
  const [priceEnterprise, setPriceEnterprise] = useState("");

  useEffect(() => {
    if (platformSettings) {
      setPixKey(platformSettings.pix_key);
      setPixName(platformSettings.pix_name);
      setPriceFree(platformSettings.price_free.toString());
      setPricePro(platformSettings.price_pro.toString());
      setPriceEnterprise(platformSettings.price_enterprise.toString());
    }
  }, [platformSettings]);

   return (
     <div className="space-y-6">
       <PageHeader title="Gerenciar Equipe" description="Gestão de usuários e permissões da sua empresa">
         <div className="flex gap-2">
           {isSuperAdmin && (
             <Button variant="outline" onClick={() => window.location.href = '/admin'}>
               <ShieldAlert className="w-4 h-4 mr-2" /> Painel da Plataforma (Pix)
             </Button>
           )}
           <Button onClick={() => setIsInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Convidar Usuário</Button>
         </div>
       </PageHeader>
 
       <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="billing" className="gap-2"><CreditCard className="w-4 h-4" /> Cobranças</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Configurações</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Usuários do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.nome}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : u.role === "financeiro" ? "outline" : "secondary"}>
                              {u.role === "admin" ? "Admin" : u.role === "financeiro" ? "Financeiro" : "Técnico"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                              <Pencil className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setResetUser(u); setNewPassword(""); }}>
                              <KeyRound className="w-4 h-4 mr-1" /> Senha
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!users || users.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <>
            <TabsContent value="billing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
                    <Check className="h-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies?.filter(c => c.payment_status === 'active').length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                    <CreditCard className="h-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies?.filter(c => c.payment_status === 'pending').length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                    <AlertTriangle className="h-4 h-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies?.filter(c => c.payment_status === 'overdue' || (c.payment_status !== 'active' && new Date(c.plan_expires_at) < new Date())).length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
                    <Ban className="h-4 h-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies?.filter(c => c.payment_status === 'blocked').length || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Gestão de Mensalidades</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies?.map((c) => {
                          const isExpired = new Date(c.plan_expires_at) < new Date();
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.name}</TableCell>
                              <TableCell className="capitalize">{c.plan || 'Free'}</TableCell>
                              <TableCell>{new Date(c.plan_expires_at).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                <Badge variant={c.payment_status === 'active' ? 'default' : c.payment_status === 'pending' ? 'secondary' : 'destructive'}>
                                  {c.payment_status === 'active' ? 'Ativo' : c.payment_status === 'pending' ? 'Pendente' : isExpired ? 'Vencido' : 'Bloqueado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => {
                                  const nextExpiry = new Date();
                                  nextExpiry.setDate(nextExpiry.getDate() + 30);
                                  updateCompanyPaymentMutation.mutate({ id: c.id, status: 'active', expiresAt: nextExpiry.toISOString() });
                                }}>
                                  Confirmar Pgto
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-600" onClick={() => {
                                  updateCompanyPaymentMutation.mutate({ id: c.id, status: 'blocked' });
                                }}>
                                  Bloquear
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="glass-card max-w-2xl">
                <CardHeader><CardTitle className="text-base">Configurações de Cobrança (Pix)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Chave Pix (Email, CPF, CNPJ ou Celular)</Label>
                    <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="ex: amaiscontratos@gmail.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome do Recebedor</Label>
                    <Input value={pixName} onChange={(e) => setPixName(e.target.value)} placeholder="ex: Ricardo Amais" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Mensalidade Free</Label>
                      <Input type="number" value={priceFree} onChange={(e) => setPriceFree(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mensalidade Pro</Label>
                      <Input type="number" value={pricePro} onChange={(e) => setPricePro(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mensalidade Enterprise</Label>
                      <Input type="number" value={priceEnterprise} onChange={(e) => setPriceEnterprise(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => updateSettingsMutation.mutate({
                    pix_key: pixKey,
                    pix_name: pixName,
                    price_free: Number(priceFree),
                    price_pro: Number(pricePro),
                    price_enterprise: Number(priceEnterprise)
                  })} disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Keep existing dialogs below */}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : u.role === "financeiro" ? "outline" : "secondary"}>
                          {u.role === "admin" ? "Admin" : u.role === "financeiro" ? "Financeiro" : "Técnico"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setResetUser(u); setNewPassword(""); }}>
                          <KeyRound className="w-4 h-4 mr-1" /> Senha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!users || users.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nome</Label><Input value={editNome} onChange={(e) => setEditNome(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Telefone</Label><Input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} /></div>
            <div className="grid gap-2">
              <Label>Perfil</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Novo Usuário</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nome</Label><Input value={inviteNome} onChange={(e) => setInviteNome(e.target.value)} placeholder="Nome completo" /></div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div className="grid gap-2">
              <Label>Perfil</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteEmail || !inviteNome}>
              {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} <Mail className="w-4 h-4 mr-2" /> Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir Senha — {resetUser?.nome}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancelar</Button>
            <Button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending || newPassword.length < 6}>
              {resetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}