// Dashboard ("Meu dia") — greeting, count cards, recent activity feed.

const PageHeader = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between gap-4 mb-6">
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const CountCard = ({ label, value, accent, sub, icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4 flex items-start gap-4">
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>{icon}</span>
    <div className="min-w-0 flex-1">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-0.5 tracking-tight tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${fmt(mon)} a ${fmt(sun)}`;
};

const MetaModal = ({ open, onClose, form, setForm, onSubmit, isEdit }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-sm w-full rounded-2xl shadow-pop p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-gray-900">Meta da Equipe</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-5">Semana de {getWeekRange()}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pendências a concluir</label>
            <input
              type="number" min="1" max="99"
              value={form.pends}
              onChange={e => setForm(f => ({ ...f, pends: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ex: 10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Demandas a concluir</label>
            <input
              type="number" min="1" max="99"
              value={form.dems}
              onChange={e => setForm(f => ({ ...f, dems: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ex: 5"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Btn kind="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" className="flex-1" onClick={onSubmit}>
            {isEdit ? 'Salvar' : 'Definir Meta'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Relatório (gestor only) ──────────────────────────────────────────────────
const RelatorioView = ({ store, profile, currentGoal, onMetaOpen }) => {
  const startOfWeek = React.useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStart = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // BLOCO A — ranking
  const rankingData = React.useMemo(() => {
    const scores = {};
    const pendCounts = {};
    const demCounts = {};
    store.pendencias.forEach(p => {
      if (p.status === 'concluido' && new Date(p.updated_at) >= startOfWeek) {
        scores[p.responsavel_id] = (scores[p.responsavel_id] || 0) + 1;
        pendCounts[p.responsavel_id] = (pendCounts[p.responsavel_id] || 0) + 1;
      }
    });
    store.demandas.forEach(d => {
      if (d.status === 'concluida' && new Date(d.updated_at) >= startOfWeek) {
        scores[d.responsavel_id] = (scores[d.responsavel_id] || 0) + 2;
        demCounts[d.responsavel_id] = (demCounts[d.responsavel_id] || 0) + 1;
      }
    });
    const active = store.profiles.filter(u => u.ativo);
    const maxScore = Math.max(1, ...active.map(u => scores[u.id] || 0));
    return active
      .map(u => ({
        user: u,
        pends: pendCounts[u.id] || 0,
        dems: demCounts[u.id] || 0,
        score: scores[u.id] || 0,
        pct: ((scores[u.id] || 0) / maxScore) * 100,
      }))
      .sort((a, b) => b.score - a.score);
  }, [store.pendencias, store.demandas, store.profiles, startOfWeek]);

  // BLOCO B — overdue items
  const overdueItems = React.useMemo(() => {
    const items = [];
    store.pendencias.forEach(p => {
      if (p.prazo && new Date(p.prazo) < todayStart && p.status !== 'concluido')
        items.push({ ...p, _kind: 'pendencia' });
    });
    store.demandas.forEach(d => {
      if (d.prazo && new Date(d.prazo) < todayStart && d.status !== 'concluida' && d.status !== 'cancelada')
        items.push({ ...d, _kind: 'demanda' });
    });
    return items.sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
  }, [store.pendencias, store.demandas, todayStart]);

  // BLOCO C — goal progress
  const goalTotal   = currentGoal ? (currentGoal.qtd_pendencias + currentGoal.qtd_demandas) : 0;
  const pendDone    = store.pendencias.filter(p => p.status === 'concluido'  && new Date(p.updated_at) >= startOfWeek).length;
  const demDone     = store.demandas.filter(d  => d.status === 'concluida'  && new Date(d.updated_at) >= startOfWeek).length;
  const concludedWk = pendDone + demDone;
  const goalPct     = goalTotal ? Math.min(100, (concludedWk / goalTotal) * 100) : 0;
  const daysLeft    = currentGoal ? Math.max(0, Math.ceil((new Date(currentGoal.data_fim) - new Date()) / 86400000)) : 0;

  // BLOCO D — demand stats
  const ds = {
    aberta:       store.demandas.filter(d => d.status === 'aberta').length,
    emAndamento:  store.demandas.filter(d => d.status === 'em-andamento').length,
    concluida:    store.demandas.filter(d => d.status === 'concluida').length,
    cancelada:    store.demandas.filter(d => d.status === 'cancelada').length,
  };
  const totalDem = Math.max(1, store.demandas.length);

  return (
    <div>
      {/* Print button */}
      <div className="flex justify-end mb-6 no-print">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-card transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <path d="M6 9V3h12v6"/>
            <rect x="6" y="14" width="12" height="8" rx="1"/>
          </svg>
          Imprimir
        </button>
      </div>

      <div className="space-y-8">

        {/* ── BLOCO A — Ranking ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Ranking da Semana</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Colaborador</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 hidden sm:table-cell">Pendências</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 hidden sm:table-cell">Demandas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Pts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 hidden md:table-cell w-36">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankingData.map((row, idx) => {
                  const isFirst = idx === 0 && row.score > 0;
                  const isZero  = row.score === 0;
                  return (
                    <tr key={row.user.id}
                        className={`transition-colors ${isFirst ? 'bg-amber-50/50' : isZero ? 'bg-gray-50/20' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-center">
                        {isFirst
                          ? <span className="text-lg leading-none">🥇</span>
                          : <span className={`text-sm font-semibold ${isZero ? 'text-gray-300' : 'text-gray-400'}`}>{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.user.nome} src={row.user.avatar} size={28}/>
                          <span className={`text-sm font-medium ${isZero ? 'text-gray-400' : 'text-gray-800'}`}>{row.user.nome}</span>
                          {isFirst && <Badge tone="yellow">Líder</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums hidden sm:table-cell">
                        <span className={isZero ? 'text-gray-300' : 'text-gray-600'}>{row.pends}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums hidden sm:table-cell">
                        <span className={isZero ? 'text-gray-300' : 'text-gray-600'}>{row.dems}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold tabular-nums ${isFirst ? 'text-amber-600' : isZero ? 'text-gray-300' : 'text-gray-700'}`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFirst ? 'bg-amber-400' : isZero ? 'bg-gray-100' : 'bg-brand-500'}`}
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── BLOCO B — Itens em Atraso ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Itens em Atraso</h2>
          {overdueItems.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-semibold text-emerald-700">Nenhum item em atraso.</div>
              <div className="text-xs text-emerald-500 mt-1">Equipe em dia!</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 hidden sm:table-cell">Responsável</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Prazo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overdueItems.map(it => (
                    <tr key={`${it._kind}-${it.id}`} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <Badge tone={it._kind === 'pendencia' ? 'yellow' : 'violet'}>
                          {it._kind === 'pendencia' ? 'Pend.' : 'Dem.'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[200px]">
                        <span className="line-clamp-1">{it.titulo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{it.responsavel}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-rose-600 inline-flex items-center gap-1">
                          <IconAlert size={11}/>{formatDate(it.prazo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {it._kind === 'pendencia'
                          ? <StatusBadgePend status={it.status}/>
                          : <StatusBadgeDem  status={it.status}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── BLOCO C + D side-by-side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BLOCO C — Progresso da Meta */}
          <section className="flex flex-col">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Progresso da Meta</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex-1">
              {currentGoal ? (
                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-3xl font-bold text-gray-900 tabular-nums">{concludedWk}</span>
                      <span className="text-sm text-gray-400 ml-2">/ {goalTotal} concluídas</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                      {daysLeft}d restantes
                    </span>
                  </div>
                  <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${goalPct >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                  <div className="text-right text-sm font-bold text-brand-600 mb-5">{Math.round(goalPct)}%</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-brand-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-brand-700 tabular-nums">
                        {pendDone}
                        <span className="text-sm text-brand-400 font-normal"> / {currentGoal.qtd_pendencias}</span>
                      </div>
                      <div className="text-xs text-brand-600 mt-1">Pendências</div>
                      <div className="mt-2.5 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full"
                             style={{ width: `${Math.min(100, (pendDone / currentGoal.qtd_pendencias) * 100)}%` }}/>
                      </div>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-violet-700 tabular-nums">
                        {demDone}
                        <span className="text-sm text-violet-400 font-normal"> / {currentGoal.qtd_demandas}</span>
                      </div>
                      <div className="text-xs text-violet-600 mt-1">Demandas</div>
                      <div className="mt-2.5 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full"
                             style={{ width: `${Math.min(100, (demDone / currentGoal.qtd_demandas) * 100)}%` }}/>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[180px] text-center gap-4">
                  <div className="text-5xl">🎯</div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Sem meta para esta semana.</div>
                    <div className="text-xs text-gray-400 mt-1">Defina um objetivo para a equipe.</div>
                  </div>
                  <Btn kind="secondary" onClick={onMetaOpen}>Definir Meta</Btn>
                </div>
              )}
            </div>
          </section>

          {/* BLOCO D — Demandas por Status */}
          <section className="flex flex-col">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Demandas por Status</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex-1">
              <div className="space-y-5">
                {[
                  { label: 'Abertas',      count: ds.aberta,      bar: 'bg-sky-400',     text: 'text-sky-600'     },
                  { label: 'Em Andamento', count: ds.emAndamento,  bar: 'bg-amber-400',   text: 'text-amber-600'   },
                  { label: 'Concluídas',   count: ds.concluida,    bar: 'bg-emerald-500', text: 'text-emerald-600' },
                  { label: 'Canceladas',   count: ds.cancelada,    bar: 'bg-gray-300',    text: 'text-gray-500'    },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.bar}`}/>
                        <span className="text-xs font-medium text-gray-600">{row.label}</span>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${row.text}`}>{row.count}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${row.bar}`}
                        style={{ width: `${(row.count / totalDem) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 text-right">
                {store.demandas.length} demandas no total
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({ profile, onNavigate }) => {
  const store = useStore();

  const isGestor = profile.role === 'gestor';
  const [scope, setScope] = React.useState('pessoal'); // pessoal | equipe | relatorio
  const [metaModalOpen, setMetaModalOpen] = React.useState(false);
  const [metaForm, setMetaForm] = React.useState({ pends: '', dems: '' });

  const useTeam = isGestor && scope === 'equipe';
  const visiblePend = useTeam
    ? store.pendencias
    : store.pendencias.filter(p => p.responsavel_id === profile.id);
  const visibleDem = useTeam
    ? store.demandas
    : store.demandas.filter(d => d.responsavel_id === profile.id);

  const pendBy = (s) => visiblePend.filter(p => p.status === s).length;
  const demBy  = (s) => visibleDem.filter(d => d.status === s).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const recent = [...visiblePend.map(p => ({ ...p, _kind: 'pendencia' })),
                  ...visibleDem.map(d => ({ ...d, _kind: 'demanda' }))]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6);

  const focusToday = visiblePend
    .filter(p => p.status !== 'concluido' && p.prazo)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 4);

  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const currentGoal = isGestor ? store.metas.find(m => {
    const now = new Date();
    return new Date(m.data_inicio) <= now && new Date(m.data_fim) >= now;
  }) : null;

  const handleMetaOpen = () => {
    setMetaForm({
      pends: currentGoal?.qtd_pendencias || '',
      dems:  currentGoal?.qtd_demandas  || '',
    });
    setMetaModalOpen(true);
  };

  const handleMetaSubmit = () => {
    const p = Number(metaForm.pends);
    const d = Number(metaForm.dems);
    if (!p || !d) return;
    if (currentGoal) {
      window.api.updateMeta(currentGoal.id, p, d);
    } else {
      window.api.createMeta(profile.id, p, d);
    }
    setMetaModalOpen(false);
  };

  const weekStats = React.useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    let conclusoes = 0;
    const scores = {};

    store.pendencias.forEach(p => {
      if (p.status === 'concluido' && new Date(p.updated_at) >= startOfWeek) {
        conclusoes++;
        scores[p.responsavel_id] = (scores[p.responsavel_id] || 0) + 1;
      }
    });
    store.demandas.forEach(d => {
      if (d.status === 'concluida' && new Date(d.updated_at) >= startOfWeek) {
        conclusoes++;
        scores[d.responsavel_id] = (scores[d.responsavel_id] || 0) + 2;
      }
    });

    let bestScore = 0;
    let bestUser = null;
    for (const [id, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestUser = id; }
    }

    return { conclusoes, bestUser: store.profiles.find(p => p.id === bestUser) };
  }, [store.pendencias, store.demandas, store.profiles]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PageHeader
        title={<span>{greeting}, {profile.nome.split(' ')[0]} <span className="text-yellow-500">👋</span></span>}
        subtitle={<span className="capitalize">{dateStr} · {today.getFullYear()}</span>}
        right={isGestor && (
          <SegTabs value={scope} onChange={setScope} items={[
            { value: 'pessoal',   label: 'Meu painel' },
            { value: 'equipe',    label: 'Equipe'     },
            { value: 'relatorio', label: 'Relatório'  },
          ]}/>
        )}
      />

      {/* Relatório tab */}
      {isGestor && scope === 'relatorio' && (
        <RelatorioView
          store={store}
          profile={profile}
          currentGoal={currentGoal}
          onMetaOpen={handleMetaOpen}
        />
      )}

      {/* Meu painel / Equipe tabs */}
      {scope !== 'relatorio' && (
        <>
          {/* Team Dashboard Cards */}
          {isGestor && (
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-5 shadow-card text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-brand-100 font-medium text-xs tracking-wide uppercase mb-3">Carga Atual (Equipe)</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{store.pendencias.filter(p => p.status !== 'concluido').length}</span>
                    <span className="text-brand-200 text-sm">pendências</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold">{store.demandas.filter(d => d.status !== 'concluida' && d.status !== 'cancelada').length}</span>
                    <span className="text-brand-200 text-sm">demandas</span>
                  </div>
                </div>
                <IconUsers size={120} className="absolute -right-8 -bottom-8 text-brand-900 opacity-20" />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-500 font-medium text-xs tracking-wide uppercase">Meta Semanal</h3>
                    {currentGoal ? <Badge tone="green">Ativa</Badge> : <Badge tone="gray">Não definida</Badge>}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 tabular-nums">{weekStats.conclusoes}</span>
                    <span className="text-gray-500 text-sm">/ {currentGoal ? (currentGoal.qtd_pendencias + currentGoal.qtd_demandas) : '?'} concluídas</span>
                  </div>
                </div>
                {currentGoal ? (
                  <div className="mt-4">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (weekStats.conclusoes / (currentGoal.qtd_pendencias + currentGoal.qtd_demandas)) * 100)}%` }} />
                    </div>
                    {profile.role === 'gestor' && (
                      <Btn size="sm" kind="ghost" className="w-full text-xs mt-3" onClick={handleMetaOpen}>Editar Meta</Btn>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    {profile.role === 'gestor' ? (
                      <Btn size="sm" kind="secondary" className="w-full text-xs" onClick={handleMetaOpen}>Definir Meta da Equipe</Btn>
                    ) : (
                      <div className="text-center text-xs text-gray-400 py-2">O gestor ainda não definiu a meta da semana.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-card">
                <h3 className="text-gray-500 font-medium text-xs tracking-wide uppercase mb-4">Destaque da Semana</h3>
                {weekStats.bestUser ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar name={weekStats.bestUser.nome} src={weekStats.bestUser.avatar} size={48} />
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white rounded-full p-1 border-2 border-white shadow-sm">
                        <IconSpark size={10} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{weekStats.bestUser.nome.split(' ')[0]}</div>
                      <div className="text-xs text-emerald-600 font-medium mt-0.5">Mais produtivo</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-12 text-sm text-gray-400 italic">
                    Nenhuma conclusão...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pendências */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pendências</h2>
            <button onClick={() => onNavigate('pendencias')} className="text-xs text-brand-700 hover:text-brand-800 font-medium inline-flex items-center gap-1">
              Ver kanban <IconChevRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CountCard label="Não Concluídas" value={pendBy('nao-concluido')} accent="bg-rose-50 text-rose-600"      icon={<IconCircle size={18} />} sub="Aguardando início" />
            <CountCard label="Em Andamento"   value={pendBy('em-andamento')}  accent="bg-amber-50 text-amber-600"     icon={<IconClock size={18} />}  sub="Com você agora" />
            <CountCard label="Concluídas"     value={pendBy('concluido')}     accent="bg-emerald-50 text-emerald-600" icon={<IconCheck size={18} />}  sub="Últimos 30 dias" />
          </div>

          {/* Demandas */}
          <div className="flex items-center justify-between mt-8 mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demandas</h2>
            <button onClick={() => onNavigate('demandas')} className="text-xs text-brand-700 hover:text-brand-800 font-medium inline-flex items-center gap-1">
              Ver tabela <IconChevRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountCard label="Abertas"      value={demBy('aberta')}       accent="bg-sky-50 text-sky-600"         icon={<IconInbox size={18} />} />
            <CountCard label="Em Andamento" value={demBy('em-andamento')} accent="bg-amber-50 text-amber-600"     icon={<IconClock size={18} />} />
            <CountCard label="Concluídas"   value={demBy('concluida')}    accent="bg-emerald-50 text-emerald-600" icon={<IconCheck size={18} />} />
            <CountCard label="Canceladas"   value={demBy('cancelada')}    accent="bg-gray-100 text-gray-500"      icon={<IconClose size={18} />} />
          </div>

          {/* Pendências chart */}
          <div className="mt-8">
            <PendChart items={visiblePend}/>
          </div>

          {/* Two columns */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Atividade recente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Últimas atualizações de pendências e demandas.</p>
                </div>
                <Badge tone="gray">{recent.length}</Badge>
              </div>
              {recent.length === 0
                ? <EmptyState title="Sem atividade ainda." subtitle="Crie sua primeira pendência ou demanda para vê-la aqui." />
                : <ul className="divide-y divide-gray-100">
                    {recent.map(it => {
                      const overdue = it._kind === 'pendencia'
                        ? isOverdue(it.prazo, it.status, 'concluido')
                        : isOverdue(it.prazo, it.status, 'concluida');
                      return (
                        <li key={`${it._kind}-${it.id}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center
                            ${it._kind === 'pendencia' ? 'bg-brand-50 text-brand-700' : 'bg-violet-50 text-violet-700'}`}>
                            {it._kind === 'pendencia' ? <IconCheckSq size={16}/> : <IconInbox size={16}/>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">{it.titulo}</span>
                              {it.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
                              {overdue && <Badge tone="red" icon={<IconAlert size={10}/>}>Vencido</Badge>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{it.responsavel}</span>
                              <span className="text-gray-300">·</span>
                              <span>{timeAgo(it.updated_at)}</span>
                            </div>
                          </div>
                          {it._kind === 'pendencia'
                            ? <StatusBadgePend status={it.status}/>
                            : <StatusBadgeDem status={it.status}/>}
                        </li>
                      );
                    })}
                  </ul>}
            </div>

            {/* Focus today */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Foco para hoje</h3>
                <button onClick={() => onNavigate('pendencias')} className="text-xs text-brand-700 hover:text-brand-800 font-medium">Abrir</button>
              </div>
              {focusToday.length === 0
                ? <EmptyState title="Nada urgente." subtitle="Você está em dia com suas pendências." />
                : <ul className="p-3 space-y-2">
                    {focusToday.map(p => {
                      const overdue = isOverdue(p.prazo, p.status, 'concluido');
                      return (
                        <li key={p.id} className="rounded-lg border border-gray-200 p-3 hover:border-brand-300 hover:bg-brand-50/40 transition-colors cursor-pointer"
                            onClick={() => onNavigate('pendencias')}>
                          <div className="flex items-start gap-2">
                            <span className={`mt-1 w-2 h-2 rounded-full ${
                              p.status === 'em-andamento' ? 'bg-amber-400' : 'bg-rose-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{p.titulo}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                                <IconCal size={11} />
                                <span className={overdue ? 'text-rose-600 font-medium' : ''}>
                                  {overdue && <IconAlert size={10} className="inline -mt-0.5 mr-0.5" />}
                                  {formatDate(p.prazo)}
                                </span>
                                <span className="text-gray-300">·</span>
                                <span>{p.responsavel}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>}
            </div>
          </div>
        </>
      )}

      <MetaModal
        open={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        form={metaForm}
        setForm={setMetaForm}
        onSubmit={handleMetaSubmit}
        isEdit={!!currentGoal}
      />
    </div>
  );
};

Object.assign(window, { Dashboard, PageHeader });
