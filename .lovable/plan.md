

## Vincular Caixa/PDV ao Financeiro e Relatórios

Toda venda do PDV deve gerar uma entrada automática em `contas` (tipo=receber, status=recebido) para somar nos relatórios e no financeiro. Isso é feito por trigger no banco — não precisa mudar o frontend.

## Mudanças

### 1. Trigger no banco (única alteração necessária)
Criar função `auto_create_conta_venda()` + trigger AFTER INSERT em `vendas`:
- Insere registro em `contas` com:
  - `tipo = 'receber'`
  - `status = 'recebido'` (venda PDV é à vista)
  - `vencimento = CURRENT_DATE`
  - `categoria = 'PDV'`
  - `forma_pagamento = <forma da venda>`
  - `descricao = 'Venda PDV - <data/hora>'`
  - `valor = valor_total`
  - `empresa_id = empresa_id da venda`

### 2. Resultado
- Página **Financeiro** → vendas aparecem automaticamente em "Contas a Receber" como recebidas, somando em "Total Recebido" e no gráfico de fluxo de caixa.
- Página **Relatórios** → como já lê de `contas`, vendas entram nas métricas de faturamento.
- **Fechamento de caixa** não precisa lançar nada extra — todas as vendas já estão lançadas individualmente; o fechamento é apenas conferência de dinheiro físico.

### 3. Sem mudanças no frontend
Tudo já funciona via trigger. Nada do que existe é alterado.

