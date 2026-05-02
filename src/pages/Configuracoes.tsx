import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
 import { Loader2, Upload, Building2, CreditCard, ShieldCheck, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { useEmpresaConfig, useUpdateEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

export default function Configuracoes() {
  const { data: empresa, isLoading, isError } = useEmpresaConfig();
  const updateEmpresa = useUpdateEmpresaConfig();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [form, setForm] = useState({ name: "", document: "", phone: "", endereco: "", email: "", whatsapp: "", logo_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (empresa) {
      setForm({
        name: empresa.name || "",
        document: empresa.document || "",
        phone: empresa.phone || "",
        endereco: empresa.endereco || "",
        email: empresa.email || "",
        whatsapp: empresa.whatsapp || "",
        logo_url: empresa.logo_url || "",
      });
    }
  }, [empresa]);

  const handleSave = () => {
    if (!empresa) {
      toast.error("Nenhuma empresa cadastrada");
      return;
    }
    updateEmpresa.mutate({ id: empresa.id, ...form });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !empresa) return;
      
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `logos/${empresa.id}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      setForm(f => ({ ...f, logo_url: publicUrl }));
      toast.success("Logo enviada! Clique em salvar para confirmar.");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Configure o sistema conforme sua necessidade" />

      <div className="grid gap-6 max-w-2xl">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-xl bg-primary/10 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-primary/40" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">Clique para alterar o logo da empresa</p>
                </div>

                <div className="grid gap-2"><Label>Nome da Empresa</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>CNPJ</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
                </div>
                <Button onClick={handleSave} disabled={updateEmpresa.isPending} className="w-fit">
                  {updateEmpresa.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Tema Escuro</p><p className="text-xs text-muted-foreground">Alterne entre tema claro e escuro</p></div>
              <Switch 
                checked={resolvedTheme === "dark"} 
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Notificações por Email</p><p className="text-xs text-muted-foreground">Receba alertas sobre OS e vencimentos</p></div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Alerta de Estoque Baixo</p><p className="text-xs text-muted-foreground">Notificar quando peças atingirem o mínimo</p></div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Integração WhatsApp</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2"><Label>Número do WhatsApp</Label><Input placeholder="(11) 99999-9999" /></div>
            <p className="text-xs text-muted-foreground">Configure o número para envio automático de OS e orçamentos via WhatsApp.</p>
            <Button variant="secondary" className="w-fit" onClick={() => toast.info("Integração em desenvolvimento")}>Configurar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
