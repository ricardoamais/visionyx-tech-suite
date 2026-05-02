import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface EmpresaInfo {
  name?: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  endereco?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
}

function empresaHeader(e?: EmpresaInfo | null) {
  if (!e) return "";
  return `
    <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #333;padding-bottom:16px">
      ${e.logo_url ? `<img src="${e.logo_url}" alt="Logo" style="max-height:60px;margin-bottom:8px" />` : ""}
      <h2 style="margin:0;font-size:18px;font-weight:700">${e.name || ""}</h2>
      <p style="margin:2px 0;font-size:12px;color:#555">
        ${[e.document ? `CNPJ: ${e.document}` : "", e.phone ? `Tel: ${e.phone}` : "", e.whatsapp ? `WhatsApp: ${e.whatsapp}` : ""].filter(Boolean).join(" | ")}
      </p>
      ${e.endereco ? `<p style="margin:2px 0;font-size:12px;color:#555">${e.endereco}</p>` : ""}
      ${e.email ? `<p style="margin:2px 0;font-size:12px;color:#555">${e.email}</p>` : ""}
    </div>`;
}

interface PrintOSProps {
  numero: string;
  data: string;
  cliente: string;
  problema?: string;
  diagnostico?: string;
  servicos?: string;
  valorMaoObra: number;
  valorPecas: number;
  status: string;
  observacoes?: string;
  empresa?: EmpresaInfo | null;
  fotoUrl?: string | null;
  fotos?: { url: string; legenda?: string | null }[];
}

export function printOS(d: PrintOSProps) {
  const total = d.valorMaoObra + d.valorPecas;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OS ${d.numero}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222}
  h1{font-size:20px;margin-bottom:4px}
  .sub{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
  th{background:#f5f5f5;font-weight:600}
  .section{margin:12px 0}
  .section-title{font-weight:600;font-size:13px;color:#555;margin-bottom:4px}
  .total{font-size:16px;font-weight:700;color:#1a1a1a}
  .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}
  .sig{margin-top:60px;display:flex;justify-content:space-between}
  .sig div{text-align:center;width:200px;border-top:1px solid #333;padding-top:4px;font-size:12px}
  @media print{body{margin:20px}}
</style></head><body>
${empresaHeader(d.empresa)}
<h1>Ordem de Serviço - ${d.numero}</h1>
<p class="sub">Data: ${new Date(d.data).toLocaleDateString("pt-BR")} | Status: ${d.status}</p>
<table>
  <tr><th>Cliente</th><td>${d.cliente}</td></tr>
  ${d.problema ? `<tr><th>Problema Relatado</th><td>${d.problema}</td></tr>` : ""}
  ${d.diagnostico ? `<tr><th>Diagnóstico</th><td>${d.diagnostico}</td></tr>` : ""}
  ${d.servicos ? `<tr><th>Serviços Realizados</th><td>${d.servicos}</td></tr>` : ""}
  ${d.observacoes ? `<tr><th>Observações</th><td>${d.observacoes}</td></tr>` : ""}
</table>
<table>
  <tr><th>Mão de Obra</th><th>Peças</th><th>Total</th></tr>
  <tr><td>R$ ${d.valorMaoObra.toFixed(2)}</td><td>R$ ${d.valorPecas.toFixed(2)}</td><td class="total">R$ ${total.toFixed(2)}</td></tr>
</table>
<div class="sig"><div>Técnico</div><div>Cliente</div></div>
${d.fotoUrl ? `<div style="margin-top:24px;page-break-inside:avoid"><div class="section-title">Foto Anexa</div><img src="${d.fotoUrl}" alt="Foto" style="max-width:100%;max-height:400px;border:1px solid #ddd;border-radius:4px" /></div>` : ""}
${(d.fotos && d.fotos.length > 0) ? `<div style="margin-top:24px"><div class="section-title">Fotos Anexas</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">${d.fotos.map(f => `<div style="page-break-inside:avoid;text-align:center"><img src="${f.url}" alt="${f.legenda || 'Foto'}" style="max-width:100%;max-height:300px;border:1px solid #ddd;border-radius:4px" />${f.legenda ? `<div style="font-size:11px;color:#555;margin-top:4px">${f.legenda}</div>` : ""}</div>`).join("")}</div></div>` : ""}
<div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

interface PrintOrcamentoProps {
  numero: string;
  data: string;
  cliente: string;
  itens: { descricao: string; quantidade: number; valor_unitario: number }[];
  valorTotal: number;
  status: string;
  observacoes?: string;
  empresa?: EmpresaInfo | null;
}

export function printOrcamento(d: PrintOrcamentoProps) {
  const rows = d.itens.map(i =>
    `<tr><td>${i.descricao}</td><td style="text-align:center">${i.quantidade}</td><td style="text-align:right">R$ ${i.valor_unitario.toFixed(2)}</td><td style="text-align:right">R$ ${(i.quantidade * i.valor_unitario).toFixed(2)}</td></tr>`
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento ${d.numero}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222}
  h1{font-size:20px;margin-bottom:4px}
  .sub{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
  th{background:#f5f5f5;font-weight:600}
  .total{font-size:16px;font-weight:700;text-align:right}
  .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}
  .sig{margin-top:60px;display:flex;justify-content:space-between}
  .sig div{text-align:center;width:200px;border-top:1px solid #333;padding-top:4px;font-size:12px}
  @media print{body{margin:20px}}
</style></head><body>
${empresaHeader(d.empresa)}
<h1>Orçamento - ${d.numero}</h1>
<p class="sub">Data: ${new Date(d.data).toLocaleDateString("pt-BR")} | Status: ${d.status} | Cliente: ${d.cliente}</p>
${d.observacoes ? `<p style="font-size:13px"><strong>Observações:</strong> ${d.observacoes}</p>` : ""}
<table>
  <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor Unit.</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3" style="text-align:right;font-weight:600">Total</td><td class="total">R$ ${d.valorTotal.toFixed(2)}</td></tr></tfoot>
</table>
<div class="sig"><div>Responsável</div><div>Cliente</div></div>
<div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

export function PrintButton({ onClick, label = "Imprimir" }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Printer className="w-4 h-4 mr-2" />{label}
    </Button>
  );
}
