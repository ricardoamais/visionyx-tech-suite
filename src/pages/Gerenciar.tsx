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
import { Loader2, Pencil, KeyRound, ShieldCheck, UserPlus, Mail } from "lucide-react";
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
  const { data: users, isLoading } = useUsers();
  const qc = useQueryClient();

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

  return (
    <div className="space-y-6">
      <PageHeader title="Gerenciar Usuários" description="Gerencie os usuários cadastrados no sistema">
        <Button onClick={() => setIsInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Convidar Usuário</Button>
      </PageHeader>

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