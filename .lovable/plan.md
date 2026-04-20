

## Problema

Algumas abas (Orçamentos, Equipamentos, etc.) abrem em branco no domínio customizado e só aparecem após F5. A causa raiz são erros de renderização não capturados que deixam o `<Outlet />` sem fallback visual — o `ErrorBoundary` foi importado em `App.tsx` mas **nunca é usado para envolver as rotas**. Quando um hook lança erro durante a navegação (ex: race condition com `EmpresaContext` ainda carregando, ou erro de query), a árvore quebra silenciosamente e a tela fica em branco até o reload.

## Solução

Envolver o conteúdo de cada rota com o `ErrorBoundary` (já existente) dentro do `AppLayout`, garantir que o `EmpresaProvider` mostre um loader enquanto carrega o `empresa_id`, e ativar um Suspense fallback simples. Assim, qualquer falha pontual de uma página exibe a mensagem "Algo deu errado / Recarregar" em vez de tela branca, e o usuário consegue se recuperar sem F5.

## Mudanças

1. **`src/components/AppLayout.tsx`**
   - Envolver `<Outlet key={location.pathname} />` com `<ErrorBoundary>`.
   - Manter o `key` para garantir remontagem limpa entre rotas (já corrige o `removeChild` de portais Radix).

2. **`src/contexts/EmpresaContext.tsx`**
   - Adicionar `retry: 2` e `refetchOnWindowFocus: false` na query do `empresa_usuarios` para evitar falhas transitórias de rede no domínio customizado.

3. **`src/App.tsx`**
   - No `ProtectedRoute`, aguardar também o carregamento do `EmpresaProvider` antes de renderizar páginas que dependem de `empresaId` (evita queries disparadas com `empresaId = null` que retornam vazio e podem quebrar mapeamentos `.map`).

4. **Hooks de páginas (`useOrcamentos`, `useEquipamentos`, `useOrdensServico`)**
   - Auditar rapidamente para garantir que `enabled: !!empresaId` está presente em todas as queries que dependem da empresa, evitando execuções prematuras durante a transição de rota.

## Resultado esperado

- Navegar entre Dashboard → Orçamentos → Equipamentos → Ordens funciona sem tela branca.
- Se ocorrer um erro real, o usuário vê a mensagem do ErrorBoundary com botão "Recarregar" em vez de tela em branco.
- Funciona igual no preview do Lovable e no domínio customizado.

