# Núcleo Saúde — Plano de Melhorias para Apresentação Final

> Gerado: 13/05/2026 | Base: auditoria completa do codebase

---

## Diagnóstico Rápido

| Dimensão | Status | Nota |
|---|---|---|
| Dashboard | ✅ Funcional | Dados reais, gráficos, metas — mas usa `prompt()` |
| Favicon / ícone | ⚠️ Parcial | `ico.jpg` funciona na aba, mas não em mobile/PWA |
| PWA / Offline | ❌ Ausente | Sem `manifest.json` nem service worker |
| Mobile | ⚠️ Parcial | Sidebar overlay existe, sem instalação nem offline |
| Performance | ⚠️ Lento | Babel compila JSX no browser a cada load |
| UX / Apresentação | ✅ Boa | Design profissional, notificações, busca global |
| Segurança | ✅ OK | Anon key browser-only é aceitável; RLS no Supabase |
| Deploy | ✅ Vercel | OG tags, favicon, domínio já configurados |

---

## 🔴 P0 — Crítico para Apresentação

### 1. PWA Completo (Instala como app no celular/tablet)

**Por quê:** o requisito "app mobile que funciona offline" é alcançado via PWA — sem precisar publicar na App Store/Play Store. O sistema vira instalável direto do navegador.

**O que fazer:**

1. Criar `manifest.json` com nome, cores, ícones e `display: standalone`
2. Criar `sw.js` (service worker) com estratégia de cache:
   - **Cache-first** para assets estáticos (HTML, CDN scripts, CSS)
   - **Network-first com fallback** para chamadas Supabase
3. Registrar service worker no `index.html`
4. Gerar conjunto completo de ícones PNG a partir do `ico.jpg` atual:
   - `icon-192.png`, `icon-512.png` (Android/Chrome)
   - `apple-touch-icon.png` 180×180 (iOS Safari)
   - `favicon.ico` próprio (16×16 + 32×32 multi-res)

**Resultado:** usuário abre o sistema pelo celular → botão "Adicionar à tela inicial" → ícone aparece como app nativo → abre sem barra do browser → funciona com dados em cache offline.

**Esforço estimado:** 4–6h

---

### 2. Offline Strategy — Dados Essenciais em Cache

**Por quê:** sem dados offline o PWA instala mas não mostra nada sem internet.

**O que fazer:**

1. No service worker, após login bem-sucedido, cachear snapshot do estado atual:
   - `profiles`, `pendencias`, `demandas` → `localStorage` ou Cache API
2. No `data.jsx`, antes de `loadAll()`, tentar ler cache local e popular `_state` imediatamente
3. Exibir banner "Modo offline — dados podem estar desatualizados" quando sem conexão
4. Operações de escrita offline: enfileirar em `localStorage` e sincronizar quando voltar online (opcional para P0, obrigatório para P1)

**Esforço estimado:** 3–4h

---

### 3. Dashboard: Substituir `prompt()` por Modais Reais

**Por quê:** o sistema usa `window.prompt()` para criar/editar metas da equipe — visual horrível, quebra a apresentação.

**O que fazer:**

1. Criar `MetaModal` no `dashboard.jsx`:
   - Inputs numéricos para `qtd_pendencias` e `qtd_demandas`
   - Data de início e fim da meta (hoje até fim de semana como default)
   - Botão salvar chama `api.createMeta` / `api.updateMeta`
2. Substituir os dois blocos com `prompt()` por `<Btn onClick={() => setMetaModalOpen(true)}>`

**Esforço estimado:** 2h

---

### 4. Ícone Profissional na Barra de Aplicativos

**Por quê:** `ico.jpg` é um JPEG, não um `.ico` multi-resolução. No Windows/Mac o ícone aparece pixelado ou sem suporte. Em iOS fica genérico.

**O que fazer:**

1. Gerar `favicon.ico` (16×16 + 32×32) a partir do logo
2. Gerar `apple-touch-icon.png` 180×180 com fundo verde brand (`#16a34a`)
3. Adicionar no `index.html`:
   ```html
   <link rel="icon" href="/favicon.ico" sizes="any" />
   <link rel="icon" href="/icon.svg" type="image/svg+xml" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```
4. Criar ícone SVG simples (letra "N" estilizada ou cruz médica + fundo verde) — escalável infinitamente

**Esforço estimado:** 1–2h

---

## 🟡 P1 — Importantes para Qualidade do Produto

### 5. Performance: Pré-compilação dos JSX (Build Step)

**Por quê:** Babel standalone compila todos os `.jsx` no browser a cada carregamento. Em conexão lenta (que é comum em João Pessoa), o primeiro load demora 4–8s. Isso mata a apresentação.

**O que fazer — opção A (simples, sem mudar stack):**
1. Adicionar script `npm run build` que usa `@babel/cli` (já instalado) para compilar os `.jsx` para `.js` vanilla
2. No `index.html` produção, trocar `type="text/babel"` por `type="text/javascript"` apontando para dist/
3. Configurar Vercel para servir a versão compilada

**O que fazer — opção B (correto, Vite):**
1. Migrar para Vite conforme stack definida no CLAUDE.md
2. Unificar imports, remover globals `window.*`
3. Ganho: HMR no dev, bundle otimizado, lazy load por rota

> Recomendação: opção A para P0 da apresentação, opção B numa sprint futura.

**Esforço estimado:** Opção A = 2h | Opção B = 6–10h

---

### 6. Tela de Perfil do Usuário

**Por quê:** hoje não existe forma de o próprio usuário editar seu nome ou trocar senha — precisa de um gestor. Básico para uso real.

**O que fazer:**

1. Adicionar item "Meu Perfil" no dropdown do avatar no `sidebar.jsx`
2. Criar `perfil.jsx` com:
   - Formulário: nome, email (read-only), avatar upload
   - Botão "Alterar senha" → `supabase.auth.updateUser({ password })`
   - Card de atividade recente do próprio usuário
3. Integrar com `AvatarUpload` (já existe em `extras.jsx`)

**Esforço estimado:** 3h

---

### 7. Kanban Mobile — Gestos Touch e Layout Responsivo

**Por quê:** arrastar cards no Kanban em tela touch é difícil com `@hello-pangea/dnd`. Em apresentação mobile vai travar.

**O que fazer:**

1. Em viewport < 768px, esconder DnD e mostrar botões de status inline em cada card:
   ```
   [← Não Concluído] [Em Andamento →] [Concluído ✓]
   ```
2. Manter DnD apenas em desktop (pointer device)
3. Adicionar swipe horizontal entre colunas do Kanban no mobile (CSS snap scroll)

**Esforço estimado:** 3h

---

### 8. Tela de Relatório Semanal (Gestor)

**Por quê:** apresentação vai ter gestor na frente — ele precisa de algo que mostre valor agregado do sistema. Um relatório semanal simples fecha isso.

**O que fazer:**

1. Nova sub-aba no Dashboard (só gestor): "Relatório"
2. Conteúdo:
   - Conclusões da semana (pendências + demandas) por funcionário — lista ranqueada
   - Percentual da meta atingida
   - Itens em atraso com nome do responsável
   - Gráfico simples: barras por status ao longo dos últimos 7 dias (usando dados de `updated_at`)
3. Botão "Imprimir" → `window.print()` com CSS `@media print`

**Esforço estimado:** 4h

---

### 9. Onboarding / Tour Guiado

**Por quê:** `OnboardingTour` já existe no `main.jsx` mas precisa de conteúdo real para a apresentação.

**O que fazer:**

1. Definir 5–6 passos do tour: Sidebar → Dashboard → Pendências → Kanban → Demandas → Notificações
2. Cada passo: highlight do elemento, tooltip com título + 1 frase explicativa
3. Tour dispara automaticamente para novos usuários (flag em `localStorage`)
4. Botão "Ver tour novamente" nas configurações

**Esforço estimado:** 3h

---

## 🟢 P2 — Nice to Have (pós-apresentação)

### 10. Modo Escuro

Tailwind já tem `dark:` classes. Adicionar toggle no `TweaksPanel` e persistir em `localStorage`. Importante para app mobile (uso noturno).

**Esforço:** 4–6h

---

### 11. Push Notifications via PWA

> ⚠️ Fora do escopo atual conforme CLAUDE.md. Adicionar apenas se demandado explicitamente.

Com service worker instalado, adicionar Web Push (Supabase Edge Function como dispatcher). Útil para alertas de demanda nova sem abrir o app.

**Esforço:** 6–8h

---

### 12. Animações de Transição entre Páginas

Micro-animações de fade/slide entre telas usando `useState` com delay de 150ms. Polishes a experiência sem complexidade.

**Esforço:** 2h

---

### 13. Compressão e Cache de Assets no Vercel

Adicionar `vercel.json` com headers de cache agressivos para assets estáticos, compressão gzip/brotli automática.

**Esforço:** 1h

---

### 14. README e Documentação de Setup

`README.md` ausente na raiz. Essencial se o projeto for aberto para outros devs ou entregue formalmente.

**Esforço:** 1h

---

## Ordem Recomendada de Execução

```
Sprint Apresentação (agora)
────────────────────────────────────
[1] Ícones corretos (favicon + apple-touch)      → 1–2h
[2] manifest.json + service worker básico         → 3h
[3] Offline cache (localStorage snapshot)         → 2h
[4] MetaModal (substituir prompt())               → 2h
[5] Kanban mobile (botões de status)              → 2h

Sprint Qualidade (pós-apresentação)
────────────────────────────────────
[6] Tela de Perfil                                → 3h
[7] Relatório semanal (gestor)                    → 4h
[8] Build step (pré-compilar JSX)                 → 2h
[9] Onboarding tour                               → 3h

Sprint Futuro (app mobile real)
────────────────────────────────────
[10] Modo escuro                                  → 5h
[11] Push notifications                           → 7h
[12] Migração Vite (se necessário)                → 8h
```

---

## Achados da Auditoria

| # | Arquivo | Achado | Prioridade |
|---|---|---|---|
| 1 | `app/dashboard.jsx:76` | `window.prompt()` para criar meta | 🔴 |
| 2 | `index.html` | Sem `manifest.json` linkado | 🔴 |
| 3 | `index.html` | `ico.jpg` como favicon (JPEG) | 🔴 |
| 4 | — | Sem service worker | 🔴 |
| 5 | `app/feedback.jsx` | Usa `window.sb` em vez de `supabase` local | 🟡 |
| 6 | `app/data.jsx` | Anon key hardcoded (browser-only = ok) | 🟢 |
| 7 | — | `fix.js` na raiz sem propósito claro | 🟢 |
| 8 | — | `migration_*.sql` soltos na raiz — organizar em `/migrations/` | 🟢 |
| 9 | — | Sem `README.md` | 🟢 |

---

*Plano gerado via auditoria em 13/05/2026. Atualizar conforme sprints concluídas.*
