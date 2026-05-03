 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 import { Clock, CheckCircle2, AlertCircle, Play, Package, XCircle, UserCheck } from "lucide-react";
 
 const statusConfig: Record<string, { className: string, icon: any }> = {
   "Aberto": { className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
   "Em análise": { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertCircle },
   "Aguardando aprovação": { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
   "Em manutenção": { className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: Play },
   "Finalizado": { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
   "Entregue": { className: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: Package },
   "Pendente": { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertCircle },
   "Aprovado": { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: UserCheck },
   "Reprovado": { className: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
 };
 
 export function StatusBadge({ status }: { status: string }) {
   const config = statusConfig[status] || { className: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: AlertCircle };
   const Icon = config.icon;
 
   return (
     <Badge 
       variant="outline" 
       className={cn(
         "flex items-center gap-1.5 px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded-full",
         config.className
       )}
     >
       <Icon className="w-3 h-3" />
       {status}
     </Badge>
   );
 }
