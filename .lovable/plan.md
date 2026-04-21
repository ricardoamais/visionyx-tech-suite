

## Problema

No domínio Vercel, ao abrir "Nova OS" e clicar no select de Cliente, a tela trava. Isso indica que o `<Select>` do Radix dentro do `<Dialog>` está com conflito de foco/portal, OU a lista de clientes está vazia/quebrada quando renderizada.

## Causa provável

1. **Conflito Radix Dialog + Select**: o `Select` abre um portal por cima do `Dialog`, e em produção (sem React DevMode) qualquer item com `value=""` ou `id` undefined quebra o componente — Radix Select **não aceita `SelectItem` com value vazio**.
2. Se algum cliente vier sem `id` ou com `id` null, o `.map` gera `<SelectItem value={undefined}>` e trava.

## Correção

### 1. `src/pages/OrdensServico.tsx` e `src/pages/Orcamentos.tsx`
- Filtrar clientes inválidos antes do `.map`: `(clientes ?? []).filter(c => c?.id)`
- Garantir fallback quando lista vazia: mostrar `<SelectItem disabled>Nenhum cliente cadastrado</SelectItem>`
- Trocar `Select` controlado para usar `value={form.cliente_id || undefined}` (Radix exige undefined, não string vazia)

### 2. `src/pages/Equipamentos.tsx`
- Mesma proteção no select de cliente.

### 3. Diagnóstico extra
- Adicionar `console.log` temporário em `useClientes` para confirmar no domínio publicado se a lista chega corretamente.

## Resultado

- Select de cliente abre sem travar no domínio Vercel.
- Listas vazias mostram mensagem amigável em vez de quebrar.
- Funciona igual ao preview Lovable.

