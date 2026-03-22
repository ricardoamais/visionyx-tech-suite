import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  "Aberto": "bg-info/15 text-info border-info/20",
  "Em análise": "bg-warning/15 text-warning border-warning/20",
  "Aguardando aprovação": "bg-warning/15 text-warning border-warning/20",
  "Em manutenção": "bg-primary/15 text-primary border-primary/20",
  "Finalizado": "bg-success/15 text-success border-success/20",
  "Entregue": "bg-muted text-muted-foreground border-border",
  "Pendente": "bg-warning/15 text-warning border-warning/20",
  "Aprovado": "bg-success/15 text-success border-success/20",
  "Reprovado": "bg-destructive/15 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusStyles[status] || "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
}
