import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { generatePixPayload } from "@/utils/pix";
import { format, differenceInDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BillingManager() {
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["current_company", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user!.id)
        .single();
      
      if (!profile?.company_id) return null;

      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();
      
      return company;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["platform_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("*").single();
      return data;
    },
  });

  useEffect(() => {
    if (company?.plan_expires_at) {
      const expiresAt = new Date(company.plan_expires_at);
      const daysToExpiry = differenceInDays(expiresAt, new Date());
      
      // Show modal if it's 7 days or less before expiry and status is active
      if (daysToExpiry <= 7 && daysToExpiry >= 0 && company.payment_status === 'active') {
        const dismissed = localStorage.getItem(`billing_dismissed_${company.id}_${format(expiresAt, 'yyyy-MM-dd')}`);
        if (!dismissed) {
          setShowModal(true);
        }
      }
    }
  }, [company]);

  const markAsPendingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({ payment_status: 'pending' })
        .eq("id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informamos o sistema. Aguarde a confirmação manual.");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["current_company"] });
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  if (loadingCompany || !company || !settings) return null;

  const isBlocked = !isSuperAdmin && (
    company.payment_status === 'blocked' || 
    (company.payment_status !== 'active' && isAfter(new Date(), new Date(company.plan_expires_at)))
  );

  const getPrice = () => {
    const plan = (company.plan || 'free').toLowerCase();
    if (plan === 'pro') return Number(settings.price_pro);
    if (plan === 'enterprise') return Number(settings.price_enterprise);
    return Number(settings.price_free);
  };

  const amount = getPrice();
  if (amount <= 0 && !isBlocked) return null;

  const description = `Mensalidade Visionyx - ${company.name} - ${format(new Date(), 'MM/yyyy')}`;
  const pixPayload = generatePixPayload(
    settings.pix_key,
    settings.pix_name,
    "SAO PAULO",
    amount,
    description
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    const expiresAt = new Date(company.plan_expires_at);
    localStorage.setItem(`billing_dismissed_${company.id}_${format(expiresAt, 'yyyy-MM-dd')}`, 'true');
    setShowModal(false);
  };

  const daysToExpiry = differenceInDays(new Date(company.plan_expires_at), new Date());

  // Blocked Screen
  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center bg-card p-8 rounded-xl border shadow-2xl">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Acesso Suspenso</h1>
            <p className="text-muted-foreground">
              Sua assinatura venceu em {format(new Date(company.plan_expires_at), "dd/MM/yyyy")}. 
              Efetue o pagamento para reativar seu acesso.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg inline-block mx-auto border-4 border-primary/10">
            <QRCode value={pixPayload} size={200} />
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm font-mono break-all flex items-center gap-2">
              <span className="truncate flex-1">{pixPayload}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Valor: {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <Button className="w-full" onClick={() => markAsPendingMutation.mutate()} disabled={markAsPendingMutation.isPending || company.payment_status === 'pending'}>
                {markAsPendingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {company.payment_status === 'pending' ? 'Aguardando Confirmação' : 'Já realizei o pagamento'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Sua assinatura vence em {daysToExpiry} {daysToExpiry === 1 ? 'dia' : 'dias'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 text-center">
          <p className="text-sm text-muted-foreground text-left">
            Renove agora para continuar usando o Visionyx sem interrupção. 
            O vencimento é em {format(new Date(company.plan_expires_at), "dd 'de' MMMM", { locale: ptBR })}.
          </p>

          <div className="bg-white p-3 rounded-lg inline-block mx-auto">
            <QRCode value={pixPayload} size={180} />
          </div>

          <div className="space-y-4 text-left">
             <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Valor:</span>
                <span className="font-bold text-lg">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
            
            <div className="p-3 bg-muted rounded-lg text-[10px] font-mono break-all flex items-center gap-2">
              <span className="truncate flex-1">{pixPayload}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleDismiss}>
            Lembrar depois
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => markAsPendingMutation.mutate()} disabled={markAsPendingMutation.isPending}>
             {markAsPendingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
             Já paguei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
