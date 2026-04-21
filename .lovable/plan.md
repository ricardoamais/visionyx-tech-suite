

## Verificação completa de navegação em todas as abas

Vou auditar todas as páginas do sistema para garantir que a correção de tela branca (key no Outlet + ErrorBoundary + queries com `enabled: !!empresaId`) está aplicada de forma consistente em **todas** as rotas, não apenas em Orçamentos e Equipamentos.

## O que será verificado e corrigido

### 1. Auditoria dos hooks de dados (todas as páginas)
Verificar que todos os hooks que dependem de `empresaId` têm a guarda `enabled: !!empresaId` para evitar queries prematuras durante a transição de rota (causa principal da tela branca):

- `useClientes` → página Clientes
- `useEquipamentos` → página Equipamentos
- `useOrdensServico` → página Ordens de Serviço
- `useOrcamentos` → página Orçamentos
- `useContas` → página Financeiro
- `usePecas` → página Estoque
- `useEmpresaConfig` → página Configurações
- Hooks usados no Dashboard e Relatórios

Para cada hook sem `enabled`, adicionar a guarda e usar `useEmpresa()` para obter o `empresaId`.

### 2. Garantir ErrorBoundary ativo no AppLayout
Confirmar que `<Outlet key={location.pathname} />` está envolvido por `<ErrorBoundary>` em `src/components/AppLayout.tsx`. Se houver falha em qualquer página, mostra "Algo deu errado / Recarregar" em vez de tela branca.

### 3. Proteção contra dados nulos nas páginas
Auditar cada página (`Dashboard`, `Clientes`, `Equipamentos`, `OrdensServico`, `Orcamentos`, `Financeiro`, `Estoque`, `Relatorios`, `Configuracoes`, `Gerenciar`) para garantir:
- `data ?? []` ou `data || []` antes de `.map()` / `.filter()`
- Verificações `?.` em campos opcionais (ex: `cliente?.nome`)
- Estado de `isLoading` tratado antes de renderizar listas

### 4. EmpresaContext resiliente
Em `src/contexts/EmpresaContext.tsx`, adicionar:
- `retry: 2`
- `refetchOnWindowFocus: false`
- `gcTime` longo para evitar refetch desnecessário entre navegações

### 5. ProtectedRoute aguardando empresaId
Em `src/App.tsx`, fazer o `ProtectedRoute` exibir loader também enquanto `EmpresaProvider` carrega, evitando que páginas filhas montem com `empresaId = null`.

### 6. Teste manual no preview
Após as correções, navegar pelo preview entre todas as abas em sequência (Dashboard → Clientes → Equipamentos → Ordens → Orçamentos → Financeiro → Estoque → Relatórios → Configurações → Gerenciar → voltar) e verificar console + visual de cada uma.

## Resultado esperado

- Todas as 10 abas abrem sem tela branca, em qualquer ordem de navegação
- Funciona igual no preview Lovable e no domínio publicado
- Se ocorrer erro real em alguma página, ErrorBoundary captura e mostra botão "Recarregar"
- Sem necessidade de F5 manual para nenhuma aba

