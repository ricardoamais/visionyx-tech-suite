import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

 export function PageHeader({ title, description, children }: PageHeaderProps) {
   return (
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
       <div className="space-y-1">
         <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
         {description && (
           <p className="text-muted-foreground text-sm font-medium opacity-80">
             {description}
           </p>
         )}
       </div>
       {children && (
         <div className="flex items-center gap-3 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
           {children}
         </div>
       )}
     </div>
   );
 }
