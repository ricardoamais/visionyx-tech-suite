import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Login realizado com sucesso!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) { toast.error("Preencha todos os campos"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome }, emailRedirectTo: window.location.origin }
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada! Verifique seu email.");
  };

  const handleResetPassword = async () => {
    if (!email) { toast.error("Digite seu email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Email de recuperação enviado!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, hsl(222, 47%, 8%), hsl(217, 33%, 14%), hsl(222, 47%, 8%))" }}>
      <Card className="w-full max-w-sm border-border/30 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <Wrench className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl">Visionyx Sistema</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Assistência Técnica</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Senha</Label><Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={handleResetPassword}>Esqueceu a senha?</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="grid gap-4">
                <div className="grid gap-2"><Label>Nome</Label><Input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Senha</Label><Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar Conta"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
