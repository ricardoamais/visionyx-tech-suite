

# Corrigir navegação entre páginas

## Problema
O `ErrorBoundary` é um componente de classe que não reseta seu estado quando a rota muda. Como todas as rotas filhas renderizam na mesma posição do `<Outlet />`, o React reutiliza a mesma instância do `ErrorBoundary`, fazendo com que o conteúdo de uma página persista ao navegar para outra.

## Solução

### 1. Adicionar `key` única em cada rota (`App.tsx`)
Adicionar uma prop `key` baseada no path em cada `<ErrorBoundary>` para forçar o React a criar uma nova instância ao mudar de rota:

```tsx
<Route path="/ordens" element={<ErrorBoundary key="ordens"><OrdensServico /></ErrorBoundary>} />
<Route path="/orcamentos" element={<ErrorBoundary key="orcamentos"><Orcamentos /></ErrorBoundary>} />
// ... mesma coisa para todas as rotas
```

### 2. Melhorar o `ErrorBoundary` (`ErrorBoundary.tsx`)
Adicionar reset automático quando os children mudam (via `componentDidUpdate`), como camada extra de segurança:

```tsx
componentDidUpdate(prevProps: Props) {
  if (prevProps.children !== this.props.children) {
    this.setState({ hasError: false });
  }
}
```

### 3. Remover `vercel.json` desnecessário
O arquivo `vercel.json` adicionado anteriormente não é necessário no Lovable — o hosting já lida com SPA routing automaticamente.

## Arquivos modificados
- `src/App.tsx` — adicionar keys nas ErrorBoundary
- `src/components/ErrorBoundary.tsx` — reset automático no componentDidUpdate
- Remover `vercel.json`

