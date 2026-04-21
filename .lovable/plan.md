

## Módulo de Serviços de Chaveiro

Adicionar catálogo de serviços (tipos pré-cadastrados) que podem ser vinculados a uma OS, com vínculo automático ao Financeiro via trigger existente da OS.

## Mudanças

### 1. Banco de dados (migration)

**Tabela `servicos_catalogo`** (catálogo de tipos de serviço por empresa):
- `nome` (ex: "Cópia de chave Yale", "Abertura de porta residencial")
- `categoria` (ex: "Cópia", "Abertura", "Fechadura", "Outros")
- `valor_padrao` (preço sugerido)
- `descricao` (opcional)
- `ativo` (boolean para desativar sem deletar)
- `empresa_id` + RLS multi-tenant padrão

**Tabela `os_servicos`** (serviços executados em cada OS):
- `ordem_servico_id` (FK)
- `servico_catalogo_id` (FK opcional — permite serviço avulso)
- `descricao` (snapshot do nome)
- `quantidade` (default 1)
- `valor_unitario`
- `empresa_id` + RLS

**Trigger `sync_os_valor_mao_obra`**:
- AFTER INSERT/UPDATE/DELETE em `os_servicos`
- Recalcula `ordens_servico.valor_mao_obra = SUM(quantidade * valor_unitario)` da OS
- Como o trigger `auto_create_conta_os` já existe e usa `valor_mao_obra + valor_pecas`, o vínculo com Financeiro acontece automaticamente quando a OS for finalizada/entregue. **Nada a alterar lá.**

### 2. Frontend

**Nova página `/servicos`** (`src/pages/Servicos.tsx`):
- CRUD do catálogo: lista, novo, editar, ativar/desativar
- Hook `useServicosCatalogo` (padrão dos outros)
- Item no menu lateral em "Principal" (entre Equipamentos e OS), ícone `Key`

**Edição da OS** (`src/pages/OrdensServico.tsx` — adição mínima, sem mexer no que existe):
- Nova seção "Serviços de Chaveiro" no diálogo de Nova/Editar OS
- Botão "Adicionar serviço" → seleciona do catálogo (auto-preenche valor) ou digita avulso
- Lista os serviços da OS com qtd, valor unit, subtotal e remover
- Hook `useOSServicos(osId)` para CRUD dos itens
- Campo `valor_mao_obra` continua editável manualmente, mas é sobrescrito pelo trigger sempre que houver serviços vinculados

### 3. Vínculo Financeiro
- **Zero código novo**: o trigger `auto_create_conta_os` já lança em `contas` quando OS vai para `finalizado`/`entregue`, somando `valor_mao_obra + valor_pecas`. Como o novo trigger atualiza `valor_mao_obra`, o valor correto já entra no Financeiro e Relatórios.

## Arquivos

**Criar:**
- migration (tabelas + RLS + trigger sync)
- `src/hooks/useServicosCatalogo.ts`
- `src/hooks/useOSServicos.ts`
- `src/pages/Servicos.tsx`

**Editar (mínimo):**
- `src/App.tsx` — rota `/servicos`
- `src/components/AppSidebar.tsx` — item "Serviços"
- `src/pages/OrdensServico.tsx` — seção de serviços no diálogo

## Resultado
- Catálogo de serviços de chaveiro reutilizável
- OS pode ter múltiplos serviços; total de mão de obra calculado automaticamente
- Financeiro e Relatórios refletem tudo sem mudança extra
- Nada do que já funciona é alterado

