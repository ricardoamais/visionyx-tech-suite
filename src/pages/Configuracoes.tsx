import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Configure o sistema conforme sua necessidade" />

      <div className="grid gap-6 max-w-2xl">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2"><Label>Nome da Empresa</Label><Input defaultValue="Visionyx Assistência Técnica" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-90" /></div>
              <div className="grid gap-2"><Label>Telefone</Label><Input defaultValue="(11) 3456-7890" /></div>
            </div>
            <div className="grid gap-2"><Label>Endereço</Label><Input defaultValue="Rua da Tecnologia, 123 - São Paulo/SP" /></div>
            <div className="grid gap-2"><Label>Email</Label><Input defaultValue="contato@visionyx.com.br" /></div>
            <Button onClick={() => toast.success("Dados salvos!")} className="w-fit">Salvar</Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Tema Escuro</p><p className="text-xs text-muted-foreground">Alterne entre tema claro e escuro</p></div>
              <Switch />
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
