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
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
  import { generatePixPayload } from "@/utils/pixPayload";
 import { format } from "date-fns";
  import QRCode from "react-qr-code";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { useMemo } from "react";

export default function Configuracoes() {
   const { data: empresa, isLoading } = useEmpresaConfig();
  const updateEmpresa = useUpdateEmpresaConfig();
  const { theme, setTheme, resolvedTheme } = useTheme();
   const [form, setForm] = useState({ 
     name: "", 
     document: "", 
     phone: "", 
     endereco: "", 
     email: "", 
     whatsapp: "", 
     logo_url: "" 
   });
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
       // Also update the local state of the company in EmpresaContext if possible, 
       // but invalidateQueries is safer for total sync
       qc.invalidateQueries({ queryKey: ["company_config"] });
       qc.invalidateQueries({ queryKey: ["empresa-config"] });
       toast.success("Logo enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

   const qc = useQueryClient();
   const [copied, setCopied] = useState(false);
   const { data: settings } = useQuery({
     queryKey: ["platform_settings"],
     queryFn: async () => {
       const { data } = await supabase.from("platform_settings").select("*").single();
       return data;
     },
   });
 
   const markAsPendingMutation = useMutation({
     mutationFn: async () => {
       const { error } = await supabase
         .from("companies")
         .update({ payment_status: 'pending' })
         .eq("id", empresa!.id);
       if (error) throw error;
     },
     onSuccess: () => {
       toast.success("Informamos o sistema. Aguarde a confirmação manual.");
       qc.invalidateQueries({ queryKey: ["empresa-config"] });
     },
     onError: () => toast.error("Erro ao atualizar status."),
   });
 
  const getPrice = () => {
    if (!empresa || !settings) return 0;
    const plan = (empresa.plan || 'free').toLowerCase();
    if (plan === 'pro') return Number(settings.price_pro);
    if (plan === 'enterprise') return Number(settings.price_enterprise);
    return Number(settings.price_free);
  };

  const getRemainingDays = () => {
    if (!empresa?.plan_expires_at) return null;
    const diffTime = new Date(empresa.plan_expires_at).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const remainingDays = getRemainingDays();
 
   const amount = getPrice();
   const description = empresa ? `Mensalidade Visionyx - ${empresa.name} - ${format(new Date(), 'MM/yyyy')}` : '';
    const pixPayload = useMemo(() => {
      if (!settings?.pix_key || !amount) return "";
      return generatePixPayload(
        settings.pix_key,
        settings.pix_name || "Visionyx",
        "SAO PAULO",
        amount,
        description
      );
    }, [settings, amount, description]);
 
   return (
     <div className="space-y-6">
       <PageHeader title="Configurações" description="Configure o sistema conforme sua necessidade" />
 
       <Tabs defaultValue="geral" className="space-y-6">
         <TabsList className="bg-muted/50 p-1 border">
           <TabsTrigger value="geral" className="gap-2">Geral</TabsTrigger>
           <TabsTrigger value="assinatura" className="gap-2">Assinatura</TabsTrigger>
         </TabsList>
 
         <TabsContent value="geral" className="space-y-6">
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
                  <div className="grid gap-2">
                    <Label>CNPJ</Label>
                    <Input value={form.document} readOnly className="bg-muted cursor-not-allowed" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
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
         </TabsContent>
 
         <TabsContent value="assinatura" className="space-y-6">
           <div className="grid gap-6 max-w-2xl">
             <Card className="glass-card">
               <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Status da Assinatura</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plano Atual</p>
                     <Badge className="capitalize text-sm px-3 py-1">{empresa?.plan || 'Free'}</Badge>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status de Pagamento</p>
                     <Badge variant={empresa?.payment_status === 'active' ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                       {empresa?.payment_status === 'active' ? 'Em dia' : empresa?.payment_status === 'pending' ? 'Aguardando Confirmação' : 'Atrasado/Pendente'}
                     </Badge>
                   </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vencimento</p>
                    <p className="font-bold">
                      {empresa?.plan_expires_at ? (
                        <>
                          {format(new Date(empresa.plan_expires_at), "dd/MM/yyyy")}
                          {remainingDays !== null && (
                            <span className={`ml-2 text-xs ${
                              remainingDays > 7 ? 'text-green-500' : remainingDays > 0 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              ({remainingDays <= 0 ? 'Vencido' : `${remainingDays} dias restantes`})
                            </span>
                          )}
                        </>
                      ) : '—'}
                    </p>
                  </div>
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Valor Mensal</p>
                     <p className="font-bold">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                   </div>
                 </div>
 
                </CardContent>
              </Card>

              {amount > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> 
                      Renovar / Antecipar Pagamento
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o QR Code abaixo para renovar sua assinatura via Pix
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {empresa?.payment_status === 'pending' && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-yellow-500">Pagamento em Análise</p>
                          <p className="text-xs text-muted-foreground">
                            Seu pagamento foi enviado para confirmação manual. Em breve seu acesso será renovado.
                          </p>
                        </div>
                      </div>
                    )}

                    {pixPayload ? (
                      <div className="flex flex-col items-center gap-4 py-4 bg-white rounded-xl border-2 border-dashed border-muted mx-auto max-w-[280px]">
                        <div className="p-2 bg-white rounded-lg">
                          <QRCode value={pixPayload} size={200} />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Escaneie o QR Code acima</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-muted mx-auto max-w-[280px]">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Chave Pix Copia e Cola</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-muted rounded-lg text-[10px] font-mono break-all line-clamp-2 leading-relaxed">
                          {pixPayload}
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="shrink-0 h-auto" 
                          onClick={() => {
                            navigator.clipboard.writeText(pixPayload);
                            setCopied(true);
                            toast.success("Chave Pix copiada!");
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      variant={empresa?.payment_status === 'pending' ? 'secondary' : 'default'}
                      onClick={() => markAsPendingMutation.mutate()} 
                      disabled={markAsPendingMutation.isPending || empresa?.payment_status === 'pending'}
                    >
                      {markAsPendingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {empresa?.payment_status === 'pending' 
                        ? 'Aguardando Confirmação' 
                        : 'Já realizei o pagamento'
                      }
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
       </Tabs>
     </div>
   );
 }
