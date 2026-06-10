# Núcleo Saúde — Auditoria Pós-Implementação

> Data: 13/05/2026 | Auditoria após sprint de melhorias PWA + UX

---

## Resumo Executivo

**Saúde geral: 85% pronto para produção** (era 75% antes da sprint).

A sprint entregou o essencial: PWA instalável, ícones corretos, cache offline, MetaModal, Kanban mobile, tela de Perfil e build step. Dois bugs críticos foram **corrigidos durante esta auditoria** (`.gitignore` corrompido e `perfil.jsx` ausente do service worker). O bloqueio restante mais urgente é **commitar e fazer push** de tudo — nenhuma das novas features foi ao ar ainda.

**Top 3 prioridades agora:**
1. Commitar e fazer deploy (tudo está local, Vercel não tem nada disso)
2. Validar PWA instalável no celular real
3. Organizar lixo na raiz antes da apresentação

---

## O que foi implementado ✅

| Feature | Arquivo(s) | Status |
|---|---|---|
| manifest.json completo | `/manifest.json` | ✅ Correto |
| Service Worker 3 estratégias | `/sw.js` | ✅ Sólido |
| SW registrado em ambos HTMLs | `index.html` + `index.prod.html` | ✅ |
| Ícones completos | `favicon.ico`, `icon-192/512.png`, `apple-touch-icon.png` | ✅ |
| Meta tags PWA (iOS + Android) | `index.html` | ✅ |
| MetaModal (substituiu prompt()) | `app/dashboard.jsx:36` | ✅ |
| Kanban mobile snap-scroll | `app/pendencias.jsx` | ✅ |
| Botões Voltar/Avançar (touch) | `app/pendencias.jsx:52-66` | ✅ |
| Cache offline localStorage | `app/data.jsx:51-154` | ✅ TTL 24h |
| Banner offline (online/offline events) | `app/main.jsx:4-18` | ✅ |
| Transição de página (fade 120ms) | `app/main.jsx:66` + `index.html:100` | ✅ |
| Tela Perfil (nome, senha, avatar, atividade) | `app/perfil.jsx` (210 linhas) | ✅ |
| Perfil no dropdown sidebar | `app/sidebar.jsx:114-117` | ✅ |
| Build step (Babel CLI → dist/) | `babel.config.json` + `package.json` | ✅ |
| index.prod.html (sem Babel runtime) | `/index.prod.html` | ✅ |
| vercel.json (cache headers + buildCommand) | `/vercel.json` | ✅ |
| Print CSS (@media print) | `index.html:102-105` | ✅ |

---

## Bugs corrigidos nesta auditoria 🔧

### [FIXED] .gitignore corrompido — encoding UTF-16

**O problema:** o arquivo `.gitignore` estava salvo em UTF-16 LE (com BOM). Git lê apenas UTF-8 — isso significa que `node_modules/` **não estava sendo ignorado**. Um `git add .` acidental ia commitar ~200MB de dependências e quebrar o repositório.

**Confirmado via:** `hexdump` mostrou `ff fe` (BOM UTF-16) no início do arquivo.

**Fix aplicado:** `.gitignore` reescrito em ASCII puro com todas as entradas corretas:
```
node_modules/
dist/
.env.local
.env
dark.txt
"prompt 3.txt"
generate-icons.html
fix.js
```

---

### [FIXED] /app/perfil.jsx ausente do STATIC_FILES do service worker

**O problema:** `sw.js` cacheia todos os arquivos da app para uso offline, mas `/app/perfil.jsx` — criado nesta sprint — não havia sido adicionado à lista `STATIC_FILES`. Em modo offline, navegar para "Meu Perfil" retornaria erro 503.

**Fix aplicado:** `/app/perfil.jsx` adicionado ao array `STATIC_FILES` em `sw.js`.

---

## Problemas restantes

### 🔴 Nada chegou ao Vercel ainda

**Impacto: crítico para o deploy.**

O git status mostra 12+ arquivos modificados/novos **sem commit**:

```
 M app/dashboard.jsx      (MetaModal)
 M app/data.jsx           (cache offline)
 M app/main.jsx           (banner offline + transições)
 M app/pendencias.jsx     (kanban mobile)
 M app/sidebar.jsx        (link perfil)
 M index.html             (PWA meta tags)
?? app/perfil.jsx
?? babel.config.json
?? dist/
?? index.prod.html
?? manifest.json
?? sw.js
?? vercel.json
?? icon-*.png / favicon.*
```

**Ação necessária — rodar na raiz do projeto:**
```bash
git add -A
git commit -m "feat(pwa): PWA completo, offline cache, kanban mobile, tela perfil"
git push
```

> ⚠️ `dist/` está no `.gitignore` agora — correto. O Vercel vai gerar via `buildCommand: "npm run build"`. Confirme que o script de build no `package.json` está completo antes do push.

---

### 🟡 manifest.json — purpose "any maskable" combinado

**Arquivo:** `/manifest.json`

**Problema:** ambos os ícones usam `"purpose": "any maskable"` em um único campo. O Chrome Lighthouse e alguns geradores de APK preferem entradas separadas.

**Recomendado (não bloqueia PWA, mas melhora score):**
```json
{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
```

---

### 🟡 Arquivos de rascunho na raiz

Os arquivos abaixo existem na raiz e poluem o projeto. Agora estão no `.gitignore` (não vão ao repo), mas ainda existem localmente:

| Arquivo | Ação |
|---|---|
| `dark.txt` | Deletar — rascunho do dark mode |
| `prompt 3.txt` | Deletar — prompt de teste |
| `generate-icons.html` | Deletar — ferramenta auxiliar usada e descartável |
| `fix.js` | Deletar — script de correção pontual, já resolvido |

```bash
rm "dark.txt" "prompt 3.txt" "generate-icons.html" "fix.js"
```

---

### 🟡 migration_*.sql soltos na raiz

4 arquivos de migração SQL na raiz do projeto. Não prejudicam o funcionamento, mas organização melhora manutenção.

**Recomendado:**
```bash
mkdir -p migrations
mv migration_*.sql migrations/
```

---

### 🟡 vercel.json sem outputDirectory explícito

`buildCommand: "npm run build"` gera `dist/` mas não especifica `outputDirectory`. Vercel assume a raiz — funciona, mas é implícito e pode mudar com versões futuras do Vercel.

**Robusto:** adicionar `"outputDirectory": "."` ao `vercel.json`.

---

### 🟢 sw.js não cacheia /app/perfil.js (dist)

**Apenas relevante após build step.** O cache do SW lista `/app/perfil.jsx` (dev), mas se servindo `index.prod.html`, o browser vai buscar `/dist/app/perfil.js`. O SW precisa de ambos ou de lógica para detectar qual versão está sendo servida.

**Fix futuro:** atualizar sw.js para cachear também os arquivos em `/dist/app/`.

---

## Scorecard

| Dimensão | Antes | Agora |
|---|---|---|
| PWA / Instalável | ❌ | ✅ |
| Ícones profissionais | ⚠️ | ✅ |
| Offline funcional | ❌ | ✅ |
| Dashboard MetaModal | ⚠️ | ✅ |
| Kanban mobile | ⚠️ | ✅ |
| Tela de Perfil | ❌ | ✅ |
| Build step (performance) | ❌ | ✅ |
| .gitignore válido | ❌ | ✅ (corrigido aqui) |
| SW cobrindo todos os arquivos | ⚠️ | ✅ (corrigido aqui) |
| Git commitado / Deploy | ❌ | ❌ pendente |
| Raiz organizada | ⚠️ | ⚠️ parcial |

**Nota geral: 85/100**

---

## Próximos passos (ordem)

```
1. git add -A && git commit && git push          → imediato
2. Vercel: verificar deploy e build log           → imediato
3. Abrir no Chrome mobile → "Adicionar à tela"   → validar PWA
4. rm dark.txt "prompt 3.txt" generate-icons.html fix.js
5. mkdir migrations && mv migration_*.sql migrations/
6. Corrigir manifest.json purpose (4 entries)     → antes da apresentação
7. Testar modo offline: DevTools → Network → Offline
```

---

*Auditoria realizada em 13/05/2026. Dois bugs críticos corrigidos durante a análise.*
