import { LucideIcon } from "lucide-react";

 interface StatCardProps {
   title: string;
   value: string | number;
   icon: LucideIcon;
   trend?: string;
   trendUp?: boolean;
   gradientClass?: string;
 }
 
 export function StatCard({ 
   title, 
   value, 
   icon: Icon, 
   trend, 
   trendUp = true, 
   gradientClass = "grad-blue" 
 }: StatCardProps) {
   return (
     <div className="stat-card group animate-fade-in">
       <div className="flex items-center justify-between mb-4">
         <div className={`p-3 rounded-2xl ${gradientClass} shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300`}>
           <Icon className="w-5 h-5 text-white" />
         </div>
         {trend && (
           <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
             {trendUp ? "↑" : "↓"} {trend}
           </div>
         )}
       </div>
       <div>
         <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
         <p className="text-2xl font-black mt-1 monospace tracking-tight">
           {value}
         </p>
       </div>
     </div>
   );
 }
