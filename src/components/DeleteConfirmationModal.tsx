 import React, { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Loader2, AlertTriangle } from "lucide-react";
 
 interface DeleteConfirmationModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   title: string;
   description: string;
   confirmText?: string;
   isLoading?: boolean;
 }
 
 export function DeleteConfirmationModal({
   isOpen,
   onClose,
   onConfirm,
   title,
   description,
   confirmText = "CONFIRMAR",
   isLoading = false
 }: DeleteConfirmationModalProps) {
   const [inputValue, setInputValue] = useState("");
 
   const handleConfirm = () => {
     if (inputValue === confirmText) {
       onConfirm();
     }
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setInputValue(""); onClose(); } }}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2 text-destructive">
             <AlertTriangle className="w-5 h-5" />
             {title}
           </DialogTitle>
           <DialogDescription className="pt-2 text-foreground">
             {description}
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="confirmation">
               Digite <span className="font-bold">"{confirmText}"</span> para prosseguir
             </Label>
             <Input
               id="confirmation"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder={confirmText}
               autoFocus
             />
           </div>
         </div>
 
         <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="ghost" onClick={onClose} disabled={isLoading}>
             Cancelar
           </Button>
           <Button
             variant="destructive"
             onClick={handleConfirm}
             disabled={inputValue !== confirmText || isLoading}
           >
             {isLoading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Excluindo...
               </>
             ) : (
               "Excluir Definitivamente"
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }