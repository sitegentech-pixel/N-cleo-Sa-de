// CalendarioView — centro operacional: mês/semana/dia, drawer lateral com
// pendências, demandas e eventos (criar/editar/concluir sem sair da tela).

const EV_TIPOS = {
  pessoal:     { label: 'Pessoal',     dot: 'bg-fuchsia-500', chip: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-200' },
  cooperativa: { label: 'Cooperativa', dot: 'bg-violet-500',  chip: 'bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200' },
  lembrete:    { label: 'Lembrete',    dot: 'bg-amber-500',   chip: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200' },
};

const calKeyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const calKeyToISO = (key) => new Date(key + 'T12:00:00').toISOString();

const calDOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Quick add (input colapsável) ─────────────────────────────────────────────
const CalQuickAdd = ({ placeholder, onSubmit, children }) => {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const inputRef = React.useRef(null);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    await onSubmit(t);
    setText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 30); }}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-50/60 dark:hover:bg-brand-950/30 transition-colors"
      >
        <IconPlus size={12} /> {placeholder}
      </button>
    );
  }
  return (
    <div className="ns-pop-in space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setOpen(false); setText(''); } }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 h-8 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
        <button onClick={submit} className="h-8 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors shrink-0">
          Criar
        </button>
      </div>
      {children}
    </div>
  );
};

// ── Linhas de item dentro do painel ──────────────────────────────────────────
const CalPendRow = ({ p, profile }) => {
  const done = p.status === 'concluido';
  const [editing, setEditing] = React.useState(false);
  const [titulo, setTitulo] = React.useState(p.titulo);

  const toggleDone = () => {
    if (done) {
      api.updatePendencia(p.id, { status: 'nao-concluido' });
    } else {
      api.updatePendencia(p.id, { status: 'concluido' });
      celebrate({ count: 50, message: 'Pendência concluída!' });
    }
  };

  const saveTitle = () => {
    const t = titulo.trim();
    if (t && t !== p.titulo) api.updatePendencia(p.id, { titulo: t });
    setEditing(false);
  };

  return (
    <div className={`group flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
      done
        ? 'bg-gray-50/60 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
        : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
    }`}>
      <button
        onClick={toggleDone}
        title={done ? 'Reabrir' : 'Concluir'}
        className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 text-transparent hover:text-emerald-300'
        }`}
      >
        <IconCheck size={10} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitulo(p.titulo); setEditing(false); } }}
            className="w-full bg-transparent border-b border-brand-400 text-sm text-gray-900 dark:text-gray-100 focus:outline-none pb-0.5"
          />
        ) : (
          <div
            className={`text-sm font-medium leading-snug cursor-text ${done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}
            onClick={() => setEditing(true)}
            title="Clique para editar"
          >
            {p.titulo}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StatusBadgePend status={p.status} />
          {p.responsavel && <span className="text-[11px] text-gray-500 dark:text-gray-400">{p.responsavel}</span>}
        </div>
      </div>

      {!done && p.status === 'nao-concluido' && (
        <button
          onClick={() => api.updatePendencia(p.id, { status: 'em-andamento' })}
          className="opacity-0 group-hover:opacity-100 self-center text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 px-2 py-1 rounded-md transition-all shrink-0"
        >
          Iniciar
        </button>
      )}
    </div>
  );
};

const CalDemRow = ({ d, profile, store }) => {
  const [resched, setResched] = React.useState(false);

  return (
    <div className="group p-2.5 rounded-xl border bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{d.titulo}</div>
          {d.responsavel && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{d.responsavel}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 pl-[18px] flex-wrap">
        <select
          value={d.status}
          onChange={e => api.updateDemanda(d.id, { status: e.target.value }, profile)}
          className="text-[11px] font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-1.5 h-6 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
        >
          <option value="aberta">Aberta</option>
          <option value="em-andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
        {resched ? (
          <input
            type="date"
            autoFocus
            defaultValue={d.prazo ? d.prazo.slice(0, 10) : ''}
            onBlur={() => setResched(false)}
            onChange={e => {
              if (!e.target.value) return;
              api.updateDemanda(d.id, { prazo: calKeyToISO(e.target.value) }, profile);
              setResched(false);
              toast('Demanda reagendada.');
            }}
            className="text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-1.5 h-6 text-gray-700 dark:text-gray-300 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setResched(true)}
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-1.5 h-6 rounded-md transition-colors inline-flex items-center gap-1"
          >
            <IconCal size={11} /> Reagendar
          </button>
        )}
      </div>
    </div>
  );
};

const CalEventoRow = ({ ev, profile }) => {
  const t = EV_TIPOS[ev.tipo] || EV_TIPOS.pessoal;
  const canDelete = ev.user_id === profile.id || profile.role === 'gestor';
  return (
    <div className="group flex items-center gap-2.5 p-2.5 rounded-xl border bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 transition-colors">
      <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{ev.titulo}</div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {t.label}{ev.tipo === 'cooperativa' && ev.criado_por ? ` · ${ev.criado_por}` : ''}
        </div>
      </div>
      {canDelete && (
        <button
          onClick={() => api.deleteEvento(ev.id)}
          title="Excluir evento"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
        >
          <IconTrash size={13} />
        </button>
      )}
    </div>
  );
};

// ── Painel do dia (usado no drawer e na visão diária) ────────────────────────
const CalSection = ({ title, count, color, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</span>
      {count > 0 && <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">{count}</span>}
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const CalDayPanel = ({ dateKey, items, profile, store }) => {
  const [evTipo, setEvTipo] = React.useState('pessoal');
  const [demRespId, setDemRespId] = React.useState(profile.id);
  const activeProfiles = store.profiles.filter(u => u.ativo);

  return (
    <div className="space-y-5">
      <CalSection title="Pendências" count={items.pendencias.length} color="bg-emerald-500">
        {items.pendencias.map(p => <CalPendRow key={p.id} p={p} profile={profile} />)}
        <CalQuickAdd
          placeholder="Nova pendência neste dia"
          onSubmit={(titulo) => api.createPendencia({
            titulo,
            responsavel: profile.nome,
            responsavel_id: profile.id,
            prazo: calKeyToISO(dateKey),
          }, profile)}
        />
      </CalSection>

      <CalSection title="Demandas" count={items.demandas.length} color="bg-blue-500">
        {items.demandas.map(d => <CalDemRow key={d.id} d={d} profile={profile} store={store} />)}
        <CalQuickAdd
          placeholder="Nova demanda neste dia"
          onSubmit={async (titulo) => {
            const u = activeProfiles.find(x => x.id === demRespId) || profile;
            await api.createDemanda({
              titulo,
              responsavel: u.nome,
              responsavel_id: u.id,
              prazo: calKeyToISO(dateKey),
            }, profile);
          }}
        >
          <select
            value={demRespId}
            onChange={e => setDemRespId(e.target.value)}
            className="text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-1.5 h-7 text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            {activeProfiles.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </CalQuickAdd>
      </CalSection>

      <CalSection title="Eventos" count={items.eventos.length} color="bg-violet-500">
        {items.eventos.map(ev => <CalEventoRow key={ev.id} ev={ev} profile={profile} />)}
        <CalQuickAdd
          placeholder="Novo evento ou lembrete"
          onSubmit={(titulo) => api.createEvento({ titulo, data: dateKey, tipo: evTipo }, profile)}
        >
          <div className="flex items-center gap-1.5">
            {Object.entries(EV_TIPOS).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setEvTipo(k)}
                className={`px-2 h-6 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 border transition-colors ${
                  evTipo === k
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} /> {t.label}
              </button>
            ))}
          </div>
        </CalQuickAdd>
      </CalSection>
    </div>
  );
};

// ── Indicadores discretos da célula ──────────────────────────────────────────
const CalDayBadges = ({ items, todayStr, dateKey }) => {
  const nPend = items.pendencias.filter(p => p.status !== 'concluido').length;
  const nDem  = items.demandas.filter(d => d.status !== 'concluida' && d.status !== 'cancelada').length;
  const nEv   = items.eventos.length;
  const late  = dateKey < todayStr && (nPend > 0 || nDem > 0);
  if (!nPend && !nDem && !nEv) return null;
  return (
    <div className="flex items-center gap-1 mt-auto pt-0.5 flex-wrap">
      {nPend > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded">{nPend}P</span>}
      {nDem  > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold tabular-nums text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1 rounded">{nDem}D</span>}
      {nEv   > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold tabular-nums text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-1 rounded">{nEv}E</span>}
      {late && <span title="Itens atrasados" className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
    </div>
  );
};

// ── View principal ───────────────────────────────────────────────────────────
const CalendarioView = ({ profile }) => {
  const store = useStore();

  const [scope, setScope]         = React.useState('meus');
  const [view, setView]           = React.useState('mes'); // mes | semana | dia
  const [viewDate, setViewDate]   = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState(null);

  const pendencias = React.useMemo(() => {
    const list = store.pendencias.filter(p => p.prazo && !p.arquivado);
    return scope === 'meus' ? list.filter(p => p.responsavel_id === profile.id) : list;
  }, [store.pendencias, scope, profile.id]);

  const demandas = React.useMemo(() => {
    const list = store.demandas.filter(d => d.prazo);
    return scope === 'meus' ? list.filter(d => d.responsavel_id === profile.id) : list;
  }, [store.demandas, scope, profile.id]);

  const eventos = React.useMemo(() => store.eventos || [], [store.eventos]);

  const EMPTY = { pendencias: [], demandas: [], eventos: [] };
  const dayMap = React.useMemo(() => {
    const map = {};
    const add = (key, type, item) => {
      if (!key) return;
      if (!map[key]) map[key] = { pendencias: [], demandas: [], eventos: [] };
      map[key][type].push(item);
    };
    pendencias.forEach(p => add(p.prazo.slice(0, 10), 'pendencias', p));
    demandas.forEach(d => add(d.prazo.slice(0, 10), 'demandas', d));
    eventos.forEach(e => add((e.data || '').slice(0, 10), 'eventos', e));
    return map;
  }, [pendencias, demandas, eventos]);

  const itemsOf = (key) => dayMap[key] || EMPTY;

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = calKeyOf(new Date());

  // ----- navegação por visão -----
  const navStep = (dir) => {
    setViewDate(v => {
      if (view === 'mes')    return new Date(v.getFullYear(), v.getMonth() + dir, 1);
      if (view === 'semana') { const d = new Date(v); d.setDate(d.getDate() + dir * 7); return d; }
      const d = new Date(v); d.setDate(d.getDate() + dir); return d;
    });
  };

  const headerLabel = React.useMemo(() => {
    if (view === 'mes') return viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (view === 'semana') {
      const start = new Date(viewDate); start.setDate(start.getDate() - start.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const f = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
      return `${f(start)} – ${f(end)}`;
    }
    return viewDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [view, viewDate]);

  // ----- células do mês -----
  const monthDays = React.useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= lastDate; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const monthKey = (d) =>
    d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;

  // ----- dias da semana -----
  const weekDays = React.useMemo(() => {
    const start = new Date(viewDate); start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const selectedItems = selectedDay ? itemsOf(selectedDay) : null;

  const drawerTitle = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  const chipOf = (kind, item) => {
    if (kind === 'ev') {
      const t = EV_TIPOS[item.tipo] || EV_TIPOS.pessoal;
      return { cls: t.chip, dot: t.dot };
    }
    return kind === 'pend'
      ? { cls: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-500' }
      : { cls: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200', dot: 'bg-blue-500' };
  };

  const allChipsOf = (items) => [
    ...items.pendencias.map(p => ({ kind: 'pend', item: p })),
    ...items.demandas.map(d  => ({ kind: 'dem',  item: d })),
    ...items.eventos.map(e   => ({ kind: 'ev',   item: e })),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">{headerLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Clique em um dia para ver e criar itens sem sair daqui
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SegTabs value={view} onChange={setView} items={[
            { value: 'mes',    label: 'Mês'    },
            { value: 'semana', label: 'Semana' },
            { value: 'dia',    label: 'Dia'    },
          ]}/>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {[
              { v: 'meus',  label: 'Meus'  },
              { v: 'todos', label: 'Todos' },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setScope(v)}
                className={`px-3 h-7 rounded-md text-xs font-medium transition-colors ${
                  scope === v
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navStep(-1)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Anterior"
            >
              <IconChevRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="px-3 h-8 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => navStep(1)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Próximo"
            >
              <IconChevRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Visão MÊS ── */}
      {view === 'mes' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-card">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            {calDOW.map(d => (
              <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide select-none">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const key      = monthKey(day);
              const items    = key ? itemsOf(key) : EMPTY;
              const isToday  = key === todayStr;
              const allChips = key ? allChipsOf(items) : [];
              const shown    = allChips.slice(0, 2);
              const overflow = allChips.length - shown.length;

              const isLastInRow = (i + 1) % 7 === 0;
              const isInLastRow = i >= monthDays.length - 7;

              return (
                <div
                  key={i}
                  onClick={() => { if (day) setSelectedDay(key); }}
                  className={[
                    'min-h-[96px] sm:min-h-[116px] p-1.5 sm:p-2 flex flex-col gap-0.5 transition-colors',
                    !isLastInRow ? 'border-r border-gray-100 dark:border-gray-700/60' : '',
                    !isInLastRow ? 'border-b border-gray-100 dark:border-gray-700/60' : '',
                    !day         ? 'bg-gray-50/60 dark:bg-gray-900/20' : '',
                    isToday && day ? 'bg-brand-50/40 dark:bg-brand-950/20' : '',
                    day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : '',
                  ].join(' ')}
                >
                  {day && (
                    <>
                      <div className={`self-start w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold select-none
                        ${isToday ? 'bg-brand-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {day}
                      </div>

                      <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden min-w-0">
                        {shown.map(({ kind, item }, ci) => {
                          const c = chipOf(kind, item);
                          return (
                            <div key={`${kind}-${item.id}-${ci}`} className={`flex items-center gap-1 px-1.5 py-[2px] rounded-[5px] min-w-0 ${c.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                              <span className="text-[10px] font-medium truncate leading-tight">{item.titulo}</span>
                            </div>
                          );
                        })}
                        {overflow > 0 && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1 font-medium leading-tight">
                            +{overflow} mais
                          </div>
                        )}
                      </div>

                      <CalDayBadges items={items} todayStr={todayStr} dateKey={key} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Visão SEMANA ── */}
      {view === 'semana' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-card">
          <div className="grid grid-cols-7 min-w-[840px]">
            {weekDays.map((d, i) => {
              const key     = calKeyOf(d);
              const items   = itemsOf(key);
              const isToday = key === todayStr;
              const chips   = allChipsOf(items);
              return (
                <div
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={[
                    'min-h-[300px] p-2 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30',
                    i < 6 ? 'border-r border-gray-100 dark:border-gray-700/60' : '',
                    isToday ? 'bg-brand-50/40 dark:bg-brand-950/20' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/60 mb-1">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase">{calDOW[d.getDay()]}</span>
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                      ${isToday ? 'bg-brand-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                  {chips.length === 0 && (
                    <div className="text-[11px] text-gray-300 dark:text-gray-600 text-center mt-6 select-none">—</div>
                  )}
                  {chips.map(({ kind, item }, ci) => {
                    const c = chipOf(kind, item);
                    return (
                      <div key={`${kind}-${item.id}-${ci}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-md min-w-0 ${c.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                        <span className="text-[11px] font-medium truncate leading-tight">{item.titulo}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Visão DIA ── */}
      {view === 'dia' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card p-4 sm:p-6 max-w-2xl">
          <CalDayPanel
            dateKey={calKeyOf(viewDate)}
            items={itemsOf(calKeyOf(viewDate))}
            profile={profile}
            store={store}
          />
        </div>
      )}

      {/* ── Legenda ── */}
      <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Pendência</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-600 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Demanda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-violet-400 dark:bg-violet-600 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Atrasado</span>
        </div>
      </div>

      {/* ── Drawer lateral do dia ── */}
      <Drawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={<span className="capitalize">{drawerTitle}</span>}
        subtitle={
          selectedItems
            ? `${selectedItems.pendencias.length} pendência(s) · ${selectedItems.demandas.length} demanda(s) · ${selectedItems.eventos.length} evento(s)`
            : ''
        }
        width={440}
      >
        {selectedDay && (
          <CalDayPanel
            dateKey={selectedDay}
            items={selectedItems}
            profile={profile}
            store={store}
          />
        )}
      </Drawer>
    </div>
  );
};
