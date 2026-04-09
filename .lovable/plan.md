

# Plano: Multi-Empresa

## Resumo
Adicionar suporte a múltiplas empresas no sistema. Cada empresa terá seus dados completamente isolados (clientes, OS, orçamentos, estoque, financeiro). Um admin pode criar empresas e associar usuários a elas. Ao fazer login, o usuário trabalha dentro do contexto da sua empresa.

## Como funciona hoje
- Todos os dados são compartilhados entre todos os usuários autenticados (sem isolamento por empresa)
- Existe uma tabela `empresa_config` com dados de UMA empresa
- A tabela `clientes` tem `user_id` mas as demais não filtram por empresa

## O que será feito

### 1. Nova tabela `empresas`
Tabela central com id, nome, cnpj, telefone, email, endereco, whatsapp, logo_url. Substitui a `empresa_config`.

### 2. Nova tabela `empresa_usuarios`
Relaciona usuários a empresas (user_id, empresa_id, role). Um usuário pertence a uma empresa.

### 3. Adicionar coluna `empresa_id` nas tabelas de dados
Tabelas afetadas: `clientes`, `equipamentos`, `ordens_servico`, `orcamentos`, `contas`, `pecas`, `os_pecas`, `orcamento_itens`.

### 4. Atualizar RLS para isolamento por empresa
Todas as policies serão reescritas para filtrar por `empresa_id`, garantindo que cada usuário só veja dados da sua empresa. Será criada uma função `get_user_empresa_id(user_id)` security definer.

### 5. Contexto de empresa no frontend
- Criar `EmpresaContext` que carrega a empresa do usuário logado
- Todos os hooks de dados (useClientes, useOrdensServico, etc.) passam `empresa_id` nos inserts
- As queries já serão filtradas pelo RLS automaticamente

### 6. Atualizar página de Configurações
Carregar/salvar dados da empresa do contexto atual em vez da tabela `empresa_config`.

### 7. Atualizar aba Gerenciar
Admin pode ver e gerenciar apenas usuários da sua empresa.

### 8. Migrar dados existentes
Criar uma empresa padrão e associar todos os dados e usuários atuais a ela.

## Detalhes técnicos

**Migração SQL (resumo):**
```text
1. CREATE TABLE empresas (id, nome, cnpj, ...)
2. CREATE TABLE empresa_usuarios (user_id, empresa_id, role)
3. INSERT empresa padrão + associar usuários existentes
4. ALTER TABLE clientes ADD empresa_id (+ mesma coisa para todas tabelas)
5. UPDATE todas tabelas SET empresa_id = empresa_padrão
6. ALTER TABLE ... ALTER empresa_id SET NOT NULL
7. CREATE FUNCTION get_user_empresa_id() SECURITY DEFINER
8. Reescrever todas RLS policies com filtro empresa_id
9. DROP TABLE empresa_config (substituída por empresas)
```

**Arquivos do frontend a modificar:**
- Novo: `src/contexts/EmpresaContext.tsx`
- Modificar: todos os hooks (`useClientes`, `useOrdensServico`, `useOrcamentos`, `useContas`, `usePecas`, `useEquipamentos`)
- Modificar: `src/hooks/useEmpresaConfig.ts` → apontar para tabela `empresas`
- Modificar: `src/pages/Configuracoes.tsx`, `src/pages/Gerenciar.tsx`, `src/pages/Dashboard.tsx`
- Modificar: `src/components/PrintOS.tsx`
- Modificar: `src/components/AppSidebar.tsx` (mostrar nome da empresa)
- Modificar: `src/App.tsx` (adicionar EmpresaProvider)

