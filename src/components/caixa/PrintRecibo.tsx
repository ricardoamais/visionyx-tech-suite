 import { format } from "date-fns";
 
 interface PrintReciboProps {
   numero: string;
   cliente: string;
   descricao: string;
   valor: number;
   formaPagamento: string;
   empresa: any;
 }
 
 const pagamentoLabels: Record<string, string> = {
   dinheiro: "Dinheiro",
   cartao_credito: "Cartão de Crédito",
   cartao_debito: "Cartão de Débito",
   pix: "PIX",
 };
 
 export function printRecibo({ numero, cliente, descricao, valor, formaPagamento, empresa }: PrintReciboProps) {
   const data = new Date();
   const html = `<!doctype html>
 <html>
 <head>
 <meta charset="utf-8" />
 <title>Recibo de Pagamento - ${numero}</title>
 <style>
   @page { size: 80mm auto; margin: 4mm; }
   * { box-sizing: border-box; }
   body { font-family: 'Inter', sans-serif; font-size: 11px; color: #000; margin: 0; padding: 4px; width: 72mm; }
   .center { text-align: center; }
   .right { text-align: right; }
   .bold { font-weight: bold; }
   .lg { font-size: 13px; }
   .xl { font-size: 15px; }
   .separator { border-top: 1px dashed #000; margin: 8px 0; }
   .total-box { background: #f4f4f4; padding: 8px; border-radius: 4px; margin: 8px 0; }
   .footer { font-size: 10px; margin-top: 12px; }
 </style>
 </head>
 <body>
   <div class="center bold xl">${empresa?.name ?? "EMPRESA"}</div>
   ${empresa?.document ? `<div class="center">CNPJ: ${empresa.document}</div>` : ""}
   ${empresa?.phone ? `<div class="center">Tel: ${empresa.phone}</div>` : ""}
   <div class="separator"></div>
   <div class="center bold lg">RECIBO DE PAGAMENTO</div>
   <div class="center">${numero}</div>
   <div class="separator"></div>
   <div><span class="bold">Data:</span> ${format(data, "dd/MM/yyyy HH:mm")}</div>
   <div><span class="bold">Cliente:</span> ${cliente}</div>
   <div style="margin-top: 8px;"><span class="bold">Descrição:</span></div>
   <div>${descricao}</div>
   <div class="total-box">
     <div style="display: flex; justify-content: space-between;">
       <span class="bold">FORMA:</span>
       <span>${pagamentoLabels[formaPagamento] || formaPagamento}</span>
     </div>
     <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px;">
       <span class="bold">TOTAL:</span>
       <span class="bold">R$ ${valor.toFixed(2)}</span>
     </div>
   </div>
   <div class="separator"></div>
   <div class="center footer bold">Obrigado pela preferência!</div>
   <script>
     window.onload = function() {
       window.print();
       setTimeout(function(){ window.close(); }, 300);
     };
   </script>
 </body>
 </html>`;
 
   const w = window.open("", "_blank", "width=400,height=600");
   if (!w) return;
   w.document.write(html);
   w.document.close();
 }