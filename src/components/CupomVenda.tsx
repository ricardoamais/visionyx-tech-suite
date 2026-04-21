import { format } from "date-fns";

interface CupomVendaProps {
  empresa: any;
  venda: any;
  cliente?: any;
}

const pagamentoLabels: Record<string, string> = {
  dinheiro: "DINHEIRO",
  cartao_credito: "CARTAO CREDITO",
  cartao_debito: "CARTAO DEBITO",
  pix: "PIX",
};

export function imprimirCupom({ empresa, venda, cliente }: CupomVendaProps) {
  const itens = venda.venda_itens ?? [];
  const data = venda.created_at ? new Date(venda.created_at) : new Date();

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Cupom Venda</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; margin: 0; padding: 4px; width: 72mm; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .lg { font-size: 13px; }
  .xl { font-size: 15px; }
  hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .item-nome { font-size: 11px; }
  .item-line td { padding: 0; }
  .total-row td { padding: 2px 0; font-size: 13px; font-weight: bold; }
  .footer { font-size: 10px; }
</style>
</head>
<body>
  <div class="center bold xl">${empresa?.nome ?? "EMPRESA"}</div>
  ${empresa?.cnpj ? `<div class="center">CNPJ: ${empresa.cnpj}</div>` : ""}
  ${empresa?.endereco ? `<div class="center">${empresa.endereco}</div>` : ""}
  ${empresa?.telefone ? `<div class="center">Tel: ${empresa.telefone}</div>` : ""}
  <hr/>
  <div class="center bold">CUPOM NAO FISCAL</div>
  <div class="center">VENDA</div>
  <hr/>
  <div>Data: ${format(data, "dd/MM/yyyy HH:mm")}</div>
  ${cliente?.nome ? `<div>Cliente: ${cliente.nome}</div>` : ""}
  <hr/>
  <table>
    <thead>
      <tr class="bold">
        <td>ITEM</td>
        <td class="right">QTD</td>
        <td class="right">UNIT</td>
        <td class="right">TOTAL</td>
      </tr>
    </thead>
    <tbody>
      ${itens
        .map((i: any) => {
          const nome = i.pecas?.nome ?? "Item";
          const subtotal = Number(i.quantidade) * Number(i.valor_unitario);
          return `
            <tr class="item-line"><td colspan="4" class="item-nome">${nome}</td></tr>
            <tr class="item-line">
              <td></td>
              <td class="right">${i.quantidade}</td>
              <td class="right">${Number(i.valor_unitario).toFixed(2)}</td>
              <td class="right">${subtotal.toFixed(2)}</td>
            </tr>`;
        })
        .join("")}
    </tbody>
  </table>
  <hr/>
  <table>
    <tr class="total-row">
      <td>TOTAL</td>
      <td class="right">R$ ${Number(venda.valor_total).toFixed(2)}</td>
    </tr>
    <tr>
      <td>Pagamento:</td>
      <td class="right bold">${pagamentoLabels[venda.forma_pagamento] ?? venda.forma_pagamento}</td>
    </tr>
  </table>
  ${venda.observacoes ? `<hr/><div>Obs: ${venda.observacoes}</div>` : ""}
  <hr/>
  <div class="center footer">Obrigado pela preferencia!</div>
  <div class="center footer">${format(new Date(), "dd/MM/yyyy HH:mm:ss")}</div>
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