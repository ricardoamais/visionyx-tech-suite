import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
      <Card className="w-full max-w-md border-border/30 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Visionyx</CardTitle>
          <CardDescription>Acesse seu painel de gerenciamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Senha</Label><Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Entrando..." : <><ArrowRight className="w-4 h-4 mr-2" /> Entrar</>}
            </Button>
            <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={handleResetPassword}>Esqueceu a senha?</Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground text-[10px] tracking-widest">Ou</span></div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
