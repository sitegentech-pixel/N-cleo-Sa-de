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

const Dashboard = ({ profile, onNavigate }) => {
  const store = useStore();

  const isGestor = profile.role === 'gestor';
  const [scope, setScope] = React.useState('pessoal'); // pessoal | equipe
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

  // Metricas para gestor
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
        scores[d.responsavel_id] = (scores[d.responsavel_id] || 0) + 2; // demanda vale mais
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
            { value: 'pessoal', label: 'Meu painel' },
            { value: 'equipe',  label: 'Equipe'   },
          ]}/>
        )}
      />

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
        <CountCard label="Não Concluídas" value={pendBy('nao-concluido')} accent="bg-rose-50 text-rose-600"     icon={<IconCircle size={18} />} sub="Aguardando início" />
        <CountCard label="Em Andamento"   value={pendBy('em-andamento')}  accent="bg-amber-50 text-amber-600"    icon={<IconClock size={18} />}  sub="Com você agora" />
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
        <CountCard label="Abertas"      value={demBy('aberta')}       accent="bg-sky-50 text-sky-600"        icon={<IconInbox size={18} />} />
        <CountCard label="Em Andamento" value={demBy('em-andamento')} accent="bg-amber-50 text-amber-600"    icon={<IconClock size={18} />} />
        <CountCard label="Concluídas"   value={demBy('concluida')}    accent="bg-emerald-50 text-emerald-600" icon={<IconCheck size={18} />} />
        <CountCard label="Canceladas"   value={demBy('cancelada')}    accent="bg-gray-100 text-gray-500"     icon={<IconClose size={18} />} />
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
                          {it.urgente && (
                            <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>
                          )}
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
