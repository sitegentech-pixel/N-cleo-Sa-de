# Núcleo Saúde — Prompts de Implementação para Claude Code

> Copie o bloco de prompt e cole direto no Claude Code (terminal ou Cowork).
> Cada prompt é atômico — uma feature por sessão.

---

## 🧠 Guia de Modificadores (leia antes de usar)

| Modificador | Quando usar | Impacto |
|---|---|---|
| `ultrathink` | Arquitetura complexa, PWA, migrações | Máximo raciocínio — mais lento, melhor resultado |
| `think harder` | Features médias com múltiplos arquivos | Raciocínio intermediário |
| `think` | Bug fix, ajuste visual simples | Rápido, suficiente |
| `/compact` | **Antes** de sessão longa (>10 trocas) | Comprime contexto, economiza tokens |
| `/caveman` | Sempre — ativa modo compacto nas respostas | Corta fluff, mantém substância |
| `/caveman ultra` | Sessões de muito código, pouco espaço | Máxima compressão das respostas |
| `/clear` | Ao trocar de feature | Zera contexto, evita confusão entre tarefas |

**Regras práticas:**
- `ultrathink` no **início** do prompt para features de arquitetura
- `/compact` como **primeiro comando** ao retomar sessão antiga
- Um `/clear` entre features diferentes — contexto de PWA não ajuda na MetaModal
- Prompts longos com muitos arquivos → adicione `think harder` antes de pedir o código
- Para revisão de código gerado → `/caveman review` no final da sessão

---

## 🔴 P0 — Sprint de Apresentação

---

### [P0-1] Ícones Corretos — Favicon + Apple Touch + PWA Icons

```
/caveman full

ultrathink

Stack: browser-only React 18, sem build step. Arquivos em /app/*.jsx carregados via <script type="text/babel"> no index.html. Servido pelo Vercel.

Tarefa: gerar conjunto completo de ícones profissionais para o Núcleo Saúde.

Fonte: ico.jpg já existe na raiz (logo atual).

O que criar:
1. Script Node.js (generate-icons.js na raiz) que usa sharp ou jimp para:
   - Ler ico.jpg
   - Gerar icon-192.png (192×192) com fundo #16a34a e logo centralizado
   - Gerar icon-512.png (512×512) mesma lógica
   - Gerar apple-touch-icon.png (180×180)
   - Gerar favicon-32.png e favicon-16.png
2. Instruções no script para converter favicon-16/32 em favicon.ico usando qualquer lib disponível
3. Atualizar index.html:
   - Substituir <link rel="icon" href="/ico.jpg" type="image/jpeg" /> por:
     <link rel="icon" href="/favicon.ico" sizes="any" />
     <link rel="icon" href="/icon-192.png" type="image/png" />
     <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
4. Rodar o script e confirmar que os arquivos foram gerados na raiz

Restrições: não instalar dependências pesadas (sharp ok se já disponível, jimp como fallback, canvas como último recurso). Se nenhuma lib gráfica disponível, gerar os arquivos PNG via Canvas API em um HTML auxiliar que abre no browser e faz download.

Resultado esperado: 5 novos arquivos de ícone na raiz + index.html atualizado.
```

**Dica:** se quiser versão manual sem script, adicione `think` em vez de `ultrathink` — mais rápido para instruções step-by-step.

---

### [P0-2] PWA — manifest.json + Service Worker

```
/caveman full

ultrathink

Stack: browser-only, sem build. index.html carrega via CDN: React 18 (unpkg), Babel standalone (unpkg), Tailwind CDN, Supabase JS v2 (jsdelivr). App servida pelo Vercel em https://nucleosaude.vercel.app/.

Tarefa: tornar o Núcleo Saúde instalável como PWA e funcional sem internet.

PARTE 1 — manifest.json (criar na raiz):
{
  name: "Núcleo Saúde Gestão",
  short_name: "Núcleo Saúde",
  description: "Sistema interno de gestão — pendências, demandas e equipe.",
  start_url: "/",
  display: "standalone",
  background_color: "#111827",
  theme_color: "#16a34a",
  orientation: "portrait-primary",
  icons: [192, 512] com maskable purpose
}
Linkar no index.html: <link rel="manifest" href="/manifest.json" />
Adicionar <meta name="theme-color" content="#16a34a" />
Adicionar <meta name="mobile-web-app-capable" content="yes" />
Adicionar <meta name="apple-mobile-web-app-capable" content="yes" />
Adicionar <meta name="apple-mobile-web-app-status-bar-style" content="default" />
Adicionar <meta name="apple-mobile-web-app-title" content="Núcleo Saúde" />

PARTE 2 — sw.js (criar na raiz) com estratégias:
Cache-first (STATIC_CACHE):
  - /index.html
  - /manifest.json
  - /favicon.ico, /icon-192.png, /icon-512.png, /apple-touch-icon.png
  - /app/icons.jsx, /app/ui.jsx, /app/tweaks-panel.jsx, /app/data.jsx
  - /app/extras.jsx, /app/sidebar.jsx, /app/login.jsx, /app/dashboard.jsx
  - /app/pendencias.jsx, /app/demandas.jsx, /app/equipe.jsx
  - /app/feedback.jsx, /app/usuarios.jsx, /app/main.jsx
  - /ico.jpg, /og.jpg
CDN via stale-while-revalidate (CDN_CACHE):
  - https://cdn.tailwindcss.com
  - https://unpkg.com/react@18/umd/react.production.min.js
  - https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
  - https://unpkg.com/@babel/standalone/babel.min.js
  - https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js
Network-first com fallback para cache (API_CACHE):
  - fetch para https://fmxgsqkxhcbydvaqzefs.supabase.co/*

PARTE 3 — Registro do SW no index.html (antes de </body>):
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(r => console.log('[SW] registrado', r.scope))
        .catch(e => console.error('[SW] erro', e));
    });
  }
</script>

PARTE 4 — Banner offline em app/main.jsx:
Detectar navigator.onLine. Quando false, exibir banner fixo no topo:
"📡 Você está offline — exibindo dados em cache."
Estilo: bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-1.5
Sumir quando online voltar (event listener 'online'/'offline').

Restrições: não quebrar o fluxo atual. SW deve ter versão no cache name (ex: ns-v1) para facilitar update futuro. Incluir evento 'activate' com limpeza de caches antigos.

Resultado esperado: Lighthouse PWA score > 90. Botão "Adicionar à tela inicial" aparece no Chrome mobile.
```

**Dica:** após implementar, rode `npx serve .` localmente e abra DevTools → Application → Service Workers para validar. Adicione isso no final do prompt se quiser que o Claude Code também valide.

---

### [P0-3] Offline Cache — Dados Locais para Modo Sem Internet

```
/caveman full

think harder

Contexto: app/data.jsx tem _state global com profiles, pendencias, demandas, etc. populado pela função loadAll() que faz 8 queries Supabase simultâneas. Sem internet, loadAll() falha e _state fica vazio.

Tarefa: adicionar camada de cache local para modo offline.

O que fazer em app/data.jsx:

1. Constante CACHE_KEY = 'ns-data-cache-v1'

2. Função saveCache(): serializa _state (sem _subs) em JSON e salva em localStorage
   - Chamar no final de loadAll() após _emit()

3. Função loadCache(): lê localStorage, parseia, popula _state SEM emitir
   - Retorna true se havia cache, false se não

4. Em loadAll(), antes do try:
   const hadCache = loadCache();
   if (hadCache) _emit(); // mostra dados antigos imediatamente

5. No catch de loadAll():
   if (!_state.loaded) {
     _state.loadError = 'Offline — exibindo dados em cache.';
     _emit();
   }

6. Função clearCache() para debug: localStorage.removeItem(CACHE_KEY)
   Expor em window.api.clearCache = clearCache

7. Adicionar ao TweaksPanel em app/main.jsx novo botão "Limpar Cache Local" que chama api.clearCache() e recarrega página

Restrições:
- localStorage tem limite ~5MB. Não cachear demandas_historico completo — só últimos 50 registros
- Não salvar senha ou token de auth no cache (supabase já gerencia sessão separado)
- Cache expira em 24h: salvar timestamp junto e comparar no loadCache()

Resultado esperado: usuário abre app offline → vê dados do último acesso → banner amarelo de offline → pode navegar entre telas normalmente → operações de escrita mostram toast "Sem conexão".
```

---

### [P0-4] MetaModal — Substituir window.prompt() no Dashboard

```
/caveman full

think

Arquivo alvo: app/dashboard.jsx

Problema: dois blocos usam window.prompt() para criar e editar metas da equipe (linhas com prompt('Nova meta de pendências?', ...) e prompt('Meta de pendências concluídas...')). Em apresentação parece amador.

Tarefa: substituir por modal profissional usando os componentes existentes.

Componentes disponíveis (já em window via app/ui.jsx): Modal (se existir), Btn, Badge — verificar o que existe antes de criar.

O que implementar:

1. Estado no componente Dashboard:
   const [metaModalOpen, setMetaModalOpen] = React.useState(false);
   const [metaForm, setMetaForm] = React.useState({ pends: '', dems: '' });

2. Componente MetaModal inline no dashboard.jsx:
   - Overlay escuro (bg-black/40 fixed inset-0 z-50)
   - Card branco centralizado (max-w-sm mx-auto rounded-2xl shadow-pop p-6)
   - Título: "Meta da Equipe"
   - Subtítulo: semana atual (segunda a domingo)
   - Input numérico "Pendências a concluir" com min=1 max=99
   - Input numérico "Demandas a concluir" com min=1 max=99
   - Botões: Cancelar (ghost) + Salvar (primário verde)
   - Fechar ao clicar no overlay ou Cancelar

3. Substituir os dois blocos com prompt() por:
   onClick={() => {
     setMetaForm({ pends: currentGoal?.qtd_pendencias || '', dems: currentGoal?.qtd_demandas || '' });
     setMetaModalOpen(true);
   }}

4. Submit do modal chama window.api.updateMeta ou window.api.createMeta conforme currentGoal existe

Design: inputs com className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"

Restrições: não criar novos arquivos. Tudo dentro de dashboard.jsx. Manter lógica existente de weekStats e currentGoal intacta.
```

---

### [P0-5] Kanban Mobile — Experiência Touch sem DnD

```
/caveman full

think harder

Arquivo alvo: app/pendencias.jsx

Problema: @hello-pangea/dnd não funciona bem com touch em mobile. Em telas < 768px o drag é frustrante e pode quebrar na apresentação.

Tarefa: para viewport mobile, substituir drag-and-drop por botões de ação rápida em cada card.

O que fazer:

1. Hook de detecção: const isMobile = window.innerWidth < 768 (ou useMediaQuery simples com useState + resize listener)

2. Em cada card do Kanban, quando isMobile === true:
   - Esconder handle de drag
   - Mostrar row de botões abaixo do conteúdo do card:
     [← Voltar] [Avançar →]
   - "← Voltar": move status para estado anterior (em-andamento → nao-concluido, concluido → em-andamento)
   - "Avançar →": move status para próximo (nao-concluido → em-andamento, em-andamento → concluido)
   - Botão da direita fica disabled na última coluna, esquerdo na primeira
   - Ambos chamam api.updatePendencia com novo status e atualizam Supabase

3. Layout mobile das colunas: em vez de 3 colunas side-by-side, usar CSS scroll snap horizontal:
   - Container: flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4
   - Cada coluna: min-w-[85vw] snap-start
   - Indicador de página (dots) abaixo: •○○ / ○•○ / ○○•

4. Em desktop (isMobile === false): comportamento DnD atual inalterado

Design dos botões mobile:
- Voltar: bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-medium
- Avançar: bg-brand-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium
- Ambos: hover:opacity-80 transition-opacity active:scale-95

Restrições: não remover DnD do código — só condicionalmente esconder. Draggable wrapper ainda renderiza, só não aparece no mobile (pointer-events-none ou hidden).
```

---

## 🟡 P1 — Sprint de Qualidade

---

### [P1-1] Tela de Perfil do Usuário

```
/caveman full

think harder

Stack: browser-only. Arquivos app/*.jsx. Roteamento via useState em app/main.jsx (variável page). Supabase auth em data.jsx.

Tarefa: criar tela de perfil pessoal do usuário logado.

PARTE 1 — app/perfil.jsx (novo arquivo):
Componente Perfil({ profile, onBack })

Seções:
1. Header com avatar grande (80px), nome, role badge, email
2. Card "Dados Pessoais":
   - Input nome (editável)
   - Email (read-only, texto cinza)
   - Botão Salvar → api.upsertProfile({ id, nome }) → toast sucesso
3. Card "Avatar":
   - Mostrar avatar atual ou iniciais
   - Usar AvatarUpload de extras.jsx (já existe em window)
   - Upload vai para Supabase Storage bucket 'avatars'
4. Card "Segurança":
   - Input senha nova (min 6 chars)
   - Input confirmar senha
   - Botão Alterar Senha → supabase.auth.updateUser({ password }) → toast
5. Card "Minha Atividade" (read-only):
   - Pendências: nao-concluido / em-andamento / concluido com contadores
   - Demandas recebidas nos últimos 30 dias: abertas / concluídas

PARTE 2 — app/sidebar.jsx:
No dropdown do avatar (já existe), adicionar item antes de "Sair":
<button onClick={() => onNavigate('perfil')}>Meu Perfil</button>

PARTE 3 — app/main.jsx:
- Adicionar 'perfil' em PAGE_TITLES: 'Meu Perfil'
- Adicionar case 'perfil' em renderPage: <Perfil profile={profile} onBack={() => setPage('dashboard')} />
- Adicionar script em index.html: <script type="text/babel" src="./app/perfil.jsx"></script> ANTES de main.jsx

Design: seguir padrão existente de cards (bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4). Botão voltar no topo esquerdo com IconChevLeft.

Restrições: verificar se AvatarUpload existe em window antes de usar — fallback para input file simples se não.
```

---

### [P1-2] Relatório Semanal para Gestor

```
/caveman full

ultrathink

Arquivo alvo: app/dashboard.jsx
Componentes de dados: store.pendencias, store.demandas, store.profiles (já carregados no _state global)

Tarefa: adicionar aba "Relatório" no dashboard do gestor (só visível para role === 'gestor').

Estrutura:
1. Nova tab ao lado das existentes (pessoal/equipe): [Meu painel] [Equipe] [Relatório]
   - Usar mesmo SegTabs já existente, adicionar terceiro item

2. Componente RelatorioView({ store, profile }) renderizado quando scope === 'relatorio':

BLOCO A — Ranking da Semana:
- Calcular conclusões por pessoa nos últimos 7 dias (pendencias status=concluido + demandas status=concluida filtradas por updated_at >= startOfWeek)
- Demanda vale 2 pontos, pendência vale 1 ponto
- Tabela: Avatar | Nome | Pendências | Demandas | Pontos | Barra de progresso relativa ao maior score
- Destaque dourado para o primeiro lugar (#1)
- Linha cinza para quem tem zero conclusões

BLOCO B — Itens em Atraso:
- pendencias onde prazo < hoje AND status !== 'concluido'
- demandas onde prazo < hoje AND status NOT IN ('concluida','cancelada')
- Tabela compacta: Tipo (badge) | Título | Responsável | Prazo (vermelho) | Status badge
- Se vazio: EmptyState "Nenhum item em atraso. Equipe em dia!"

BLOCO C — Progresso da Meta:
- Se currentGoal existe: barra grande de progresso, total concluído vs meta, dias restantes
- Se não existe: Btn "Definir Meta" abre MetaModal

BLOCO D — Demandas por Status (mini chart visual):
- 4 barras horizontais CSS (sem lib externa):
  Abertas | Em Andamento | Concluídas | Canceladas
- Largura proporcional ao total de demandas
- Cores: sky/amber/emerald/gray (já usadas no projeto)

Botão no topo do relatório: "Imprimir" → window.print()
CSS print: adicionar em index.html no <style>:
@media print { .sidebar, .topbar, .no-print { display: none !important; } }

Restrições: não criar arquivo novo. Tudo em dashboard.jsx. Não usar libs de chart externas.
```

---

### [P1-3] Build Step — Pré-compilar JSX (Performance)

```
/caveman full

think harder

Problema: Babel standalone compila todos os .jsx no browser a cada load. Em conexão 3G, primeiro render demora 6-10s. Babel standalone pesa ~900KB.

Stack atual: package.json tem @babel/cli, @babel/core, @babel/preset-react já instalados como devDependencies. Script serve para dev.

Tarefa: adicionar pipeline de compilação que gera JS vanilla a partir dos JSX.

O que fazer:

1. Criar babel.config.json na raiz:
{
  "presets": [["@babel/preset-react", { "runtime": "classic" }]]
}

2. Adicionar scripts no package.json:
"build": "mkdir -p dist/app && node -e \"const fs=require('fs'); ['icons','ui','tweaks-panel','data','extras','sidebar','login','dashboard','pendencias','demandas','equipe','feedback','usuarios','main'].forEach(f => require('child_process').execSync('npx babel app/'+f+'.jsx -o dist/app/'+f+'.js'))\"",
"prebuild": "rm -rf dist",
"serve:prod": "npx serve . -l 3000"

3. Criar index.prod.html (cópia do index.html):
- Remover <script src="https://unpkg.com/@babel/standalone/babel.min.js">
- Substituir todos os <script type="text/babel" src="./app/X.jsx"> por <script src="./dist/app/X.js">
- Adicionar antes dos scripts: <script src="https://unpkg.com/react@18/umd/react.production.min.js"> (já tem)

4. Criar vercel.json:
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/dist/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}] },
    { "source": "/(.*).png", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}] }
  ]
}

5. Atualizar vercel.json para usar index.prod.html como entry point OU configurar build command no Vercel dashboard para rodar npm run build e servir dist/

ATENÇÃO: os arquivos .jsx usam globals (window.supabase, window.api, etc.). A compilação babel preserva isso — não é um bundler. Manter type="text/javascript" sem module para compatibilidade.

Testar: npx serve . → abrir index.prod.html → verificar console sem erros.
```

---

### [P1-4] Onboarding Tour Completo

```
/caveman full

think

Arquivo alvo: app/extras.jsx (OnboardingTour já existe lá, verificar implementação atual)

Tarefa: implementar conteúdo real no OnboardingTour.

Se OnboardingTour estiver vazio/stub, implementar do zero em extras.jsx:

Estrutura do tour:
const TOUR_STEPS = [
  { target: '[data-tour="sidebar"]',    title: 'Navegação',         desc: 'Use o menu lateral para acessar todas as telas do sistema.' },
  { target: '[data-tour="dashboard"]',  title: 'Dashboard',         desc: 'Veja seus indicadores, metas e atividade recente em um só lugar.' },
  { target: '[data-tour="pendencias"]', title: 'Pendências',        desc: 'Organize suas tarefas em colunas: A fazer → Em andamento → Concluído. Arraste para mover.' },
  { target: '[data-tour="demandas"]',   title: 'Demandas',          desc: 'Demandas são enviadas pelo gestor. Atualize o status conforme avança.' },
  { target: '[data-tour="notif"]',      title: 'Notificações',      desc: 'Alertas de prazos vencidos, demandas novas e menções aparecem aqui.' },
  { target: '[data-tour="perfil"]',     title: 'Seu Perfil',        desc: 'Atualize foto e dados. Tour concluído — bom trabalho! 🎉' },
];

Implementação:
1. Tour só inicia se localStorage.getItem('ns-tour-done') não existe
2. Highlight do elemento: encontrar via querySelector do target, adicionar ring-4 ring-brand-500 ring-offset-2 temporariamente
3. Tooltip posicionado próximo ao elemento (getBoundingClientRect), always visible via z-50
4. Tooltip card: bg-white rounded-xl shadow-pop border border-brand-200 p-4 w-72
5. Footer do tooltip: "X de 6" + botão Pular + botão Próximo
6. Último step: só botão "Concluir" que seta localStorage e fecha
7. Overlay semi-transparente com buraco no elemento destacado (box-shadow inset trick)

Adicionar data-tour="sidebar" no nav do sidebar.jsx, data-tour="notif" no NotificationBell, etc.

Adicionar em TweaksPanel: botão "Iniciar Tour" que remove a flag do localStorage e dispara o tour.

Restrições: não usar libs externas de tour. CSS puro + React state.
```

---

## 🟢 P2 — Pós-Apresentação

---

### [P2-1] Modo Escuro

```
/caveman full

ultrathink

Stack: Tailwind CDN com config customizada em index.html. React browser-only.

Tarefa: implementar dark mode completo com toggle persistente.

1. Em index.html, adicionar ao tailwind.config:
   darkMode: 'class'

2. Em app/main.jsx, hook useDarkMode:
   - Ler preferência de localStorage('ns-dark') ou window.matchMedia('prefers-color-scheme: dark')
   - Toggle: document.documentElement.classList.toggle('dark', isDark)
   - Persistir em localStorage

3. Toggle de dark mode: adicionar ícone ☀️/🌙 no TopBar ao lado do NotificationBell

4. Auditar todos os arquivos JSX e adicionar variantes dark:: 
   - bg-white → dark:bg-gray-800
   - bg-[#f7f8fa] → dark:bg-gray-900
   - text-gray-900 → dark:text-gray-100
   - border-gray-200 → dark:border-gray-700
   - Sidebar (#111827) já é escura — ajustar texto e hover states
   - Cards: shadow-card → dark:shadow-none dark:border-gray-700
   - Inputs: bg-white → dark:bg-gray-700 dark:text-gray-100
   - Badges: verificar contraste em cada tone

5. Login page: gradiente verde claro → dark:bg-gray-900 dark:bg-none

Restrições: usar apenas dark: prefix do Tailwind. Sem CSS variables customizadas. Sem styled-components.
Esforço real: esse item é trabalhoso — estimar 1-2 sessões de implementação. Fazer por arquivo (uma sessão por screen).
```

---

### [P2-2] Animações de Transição entre Páginas

```
/caveman full

think

Arquivo alvo: app/main.jsx

Tarefa: adicionar fade suave ao trocar de página.

Implementação simples com CSS + state:

1. Estado: const [transitioning, setTransitioning] = React.useState(false);

2. handleNavigate modificado:
   const handleNavigate = (id) => {
     setTransitioning(true);
     setTimeout(() => {
       if (id !== 'pendencias') setPendFilter(null);
       setPage(id);
       setTransitioning(false);
     }, 120);
   };

3. Wrapper do <main>:
   <main className={`flex-1 min-w-0 transition-opacity duration-150 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>

4. Adicionar em index.html no <style>:
   main { transition: opacity 120ms ease; }

Resultado: fade out 120ms → troca de tela → fade in. Imperceptível mas polida.
```

---

### [P2-3] vercel.json — Headers de Cache e Performance

```
/caveman full

think

Tarefa: criar vercel.json com headers otimizados para produção.

Criar vercel.json na raiz:
{
  "headers": [
    {
      "source": "/(.*)\\.png",
      "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
    },
    {
      "source": "/(.*)\\.ico",
      "headers": [{"key": "Cache-Control", "value": "public, max-age=86400"}]
    },
    {
      "source": "/sw.js",
      "headers": [{"key": "Cache-Control", "value": "no-cache, no-store, must-revalidate"}]
    },
    {
      "source": "/manifest.json",
      "headers": [{"key": "Cache-Control", "value": "public, max-age=3600"}]
    },
    {
      "source": "/app/(.*)\\.jsx",
      "headers": [{"key": "Cache-Control", "value": "public, max-age=3600"}]
    }
  ]
}

IMPORTANTE: sw.js NUNCA deve ser cacheado pelo Vercel — browser precisa checar update a cada visit.
```

---

## 🛠 Dicas Avançadas de Uso

### Sequência recomendada para uma sessão longa:

```
# 1. Iniciar sessão — limpar contexto
/clear

# 2. Ativar caveman
/caveman full

# 3. Se retomando sessão anterior — compactar histórico
/compact

# 4. Colar o prompt da feature

# 5. Após implementação, revisar rapidamente
/caveman review
```

---

### Quando o Claude Code trava ou erra:

```
# Forçar re-análise da situação atual
ultrathink

Releia o arquivo [X] e identifique por que [Y] não está funcionando.
Mostre o estado atual do código e o erro antes de propor fix.
```

---

### Para features visuais — prompt de revisão de UI:

```
/caveman full

think

Audite visualmente o componente [X] contra os design rules do CLAUDE.md:
- Paleta coesa (verde #16a34a/#15803d + neutros escuros)
- Tipografia hierárquica (700 títulos / 500 labels / 400 corpo)
- Badges semânticos (vermelho=urgente, amarelo=andamento, verde=concluído)
- Estados interativos (focus ring, disabled opacity-50, hover transition)
- Espaçamento generoso

Liste o que está fora do padrão e corrija inline.
```

---

### Validar PWA após implementação:

```
/caveman full

think

Rode os seguintes checks e reporte resultado de cada um:
1. Abrir DevTools → Application → Manifest → verificar campos obrigatórios
2. Application → Service Workers → verificar status "activated and running"
3. Application → Cache Storage → listar caches presentes
4. Lighthouse → PWA audit (mode: mobile, throttling: slow 4G)
5. Simular offline: DevTools → Network → Offline → recarregar página
Reportar: o que passou, o que falhou, o que precisa corrigir.
```

---

*Documento gerado em 13/05/2026. Um prompt por sessão — não misture features.*
