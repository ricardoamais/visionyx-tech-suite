

## Diagnóstico

O domínio `app.visionyx.com.br` está no Vercel servindo uma versão antiga do app — todas as correções recentes (refetch de clientes, EmpresaGate, enabled nas queries) estão no código do Lovable mas **não estão chegando à produção do Vercel**. No preview Lovable funciona; no domínio Vercel trava.

Causas prováveis (em ordem):
1. **Deploy do Vercel não conectado ao branch correto** — commits do Lovable vão pro GitHub mas o Vercel está observando outro branch ou está pausado.
2. **`vercel.json` com rewrite frágil** — `"destination": "/"` pode causar comportamento estranho em rotas; o padrão correto para SPA é `"/index.html"`.
3. **Cache agressivo do Vercel/CDN** servindo bundle antigo.

## O que vou fazer

### 1. Corrigir `vercel.json` para SPA padrão
Trocar destino do rewrite para `/index.html` (padrão recomendado Vite + Vercel) e adicionar headers anti-cache no `index.html`:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

Isso garante que toda rota (`/ordens`, `/orcamentos`, etc) entrega o `index.html` mais recente, e que o navegador nunca cacheia o HTML — só os assets versionados de `/assets/`.

### 2. Forçar bump no bundle
Adicionar um pequeno comentário de versão em `src/main.tsx` para garantir que o Vercel detecta mudança e gera novo build com hash diferente.

### 3. Instruções para você (o que precisa fazer manualmente, pois Lovable não controla o Vercel)

Depois que eu fizer commit das mudanças acima, verifique no painel do Vercel:

- **Settings → Git**: confirme que o repositório do GitHub está conectado e o branch é `main` (ou o que o Lovable usa).
- **Deployments**: confirme que apareceu um novo deploy depois do meu commit. Se ficou em "Queued" ou "Failed", clique em **Redeploy** sem cache.
- **Settings → Domains**: confirme que `app.visionyx.com.br` está apontando para o projeto correto e não para outro projeto antigo.
- Após deploy, abra `app.visionyx.com.br` em **aba anônima** (Ctrl+Shift+N) para garantir que não é cache do navegador.

### 4. Verificação
Após você confirmar que o Vercel terminou o deploy novo, eu posso (se autorizar) abrir o navegador no domínio publicado e validar que o select de clientes funciona.

## Resultado esperado

- Vercel passa a servir sempre a versão mais recente do código.
- Rotas (`/ordens`, `/orcamentos` etc) abrem direto sem 404.
- Navegador não cacheia HTML antigo, só assets imutáveis.
- Select de cliente em "Nova OS" no domínio publicado funciona igual ao preview.

