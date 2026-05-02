import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    document: "",
    email: "",
    password: "",
    userName: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.userName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-company", {
        body: { 
          companyName: form.name, 
          cnpj: form.document, 
          email: form.email, 
          password: form.password, 
          ownerName: form.userName 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Após criar com sucesso na Edge Function, fazemos o login automático
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (loginError) throw loginError;

      toast.success("Empresa cadastrada com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-white/10 bg-slate-900/50 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Comece agora</CardTitle>
          <CardDescription>Crie sua conta e organize sua assistência técnica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="userName">Seu Nome</Label>
                <Input 
                  id="userName" 
                  placeholder="Ex: João Silva" 
                  value={form.userName} 
                  onChange={e => setForm({...form, userName: e.target.value})}
                  className="bg-slate-800/50 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input 
                  id="companyName" 
                  placeholder="Nome da sua Assistência" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-slate-800/50 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document">CNPJ (Opcional)</Label>
                <Input 
                  id="document" 
                  placeholder="00.000.000/0000-00" 
                  value={form.document} 
                  onChange={e => setForm({...form, document: e.target.value})}
                  className="bg-slate-800/50 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Profissional</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="contato@empresa.com" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="bg-slate-800/50 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="bg-slate-800/50 border-white/10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><ArrowRight className="w-4 h-4 mr-2" /> Criar minha conta</>}
            </Button>

            <p className="text-center text-sm text-slate-400 mt-4">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}