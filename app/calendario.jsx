// CalendarioView — monthly grid with pendencia/demanda chips by prazo date.

const CalendarioView = ({ profile }) => {
  const store = useStore();

  const [scope, setScope]           = React.useState('meus');
  const [viewDate, setViewDate]     = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState(null);

  const pendencias = React.useMemo(() => {
    const list = store.pendencias.filter(p => p.prazo);
    return scope === 'meus' ? list.filter(p => p.responsavel_id === profile.id) : list;
  }, [store.pendencias, scope, profile.id]);

  const demandas = React.useMemo(() => {
    const list = store.demandas.filter(d => d.prazo);
    return scope === 'meus' ? list.filter(d => d.responsavel_id === profile.id) : list;
  }, [store.demandas, scope, profile.id]);

  const dayMap = React.useMemo(() => {
    const map = {};
    const add = (key, type, item) => {
      if (!map[key]) map[key] = { pendencias: [], demandas: [] };
      map[key][type].push(item);
    };
    pendencias.forEach(p => add(p.prazo.slice(0, 10), 'pendencias', p));
    demandas.forEach(d => add(d.prazo.slice(0, 10), 'demandas', d));
    return map;
  }, [pendencias, demandas]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = React.useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= lastDate; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const todayStr   = new Date().toLocaleDateString('sv');
  const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const dayKey = (d) =>
    d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;

  const prevMonth = () => setViewDate(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedItems = selectedDay
    ? (dayMap[selectedDay] || { pendencias: [], demandas: [] })
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Prazos de pendências e demandas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope toggle */}
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

          {/* Month navigation */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Mês anterior"
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
              onClick={nextMonth}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Próximo mês"
            >
              <IconChevRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          {DOW.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide select-none">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key      = dayKey(day);
            const items    = key ? (dayMap[key] || { pendencias: [], demandas: [] }) : null;
            const isToday  = key === todayStr;
            const allChips = items
              ? [
                  ...items.pendencias.map(p => ({ kind: 'pend', item: p })),
                  ...items.demandas.map(d   => ({ kind: 'dem',  item: d })),
                ]
              : [];
            const shown    = allChips.slice(0, 2);
            const overflow = allChips.length - shown.length;
            const hasItems = allChips.length > 0;

            // border mimicking dividers
            const isLastInRow = (i + 1) % 7 === 0;
            const isInLastRow = i >= days.length - 7;

            return (
              <div
                key={i}
                onClick={() => { if (day && hasItems) setSelectedDay(key); }}
                className={[
                  'min-h-[96px] sm:min-h-[116px] p-1.5 sm:p-2 flex flex-col gap-0.5 transition-colors',
                  !isLastInRow ? 'border-r border-gray-100 dark:border-gray-700/60' : '',
                  !isInLastRow ? 'border-b border-gray-100 dark:border-gray-700/60' : '',
                  !day         ? 'bg-gray-50/60 dark:bg-gray-900/20' : '',
                  isToday && day ? 'bg-brand-50/40 dark:bg-brand-950/20' : '',
                  hasItems     ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : '',
                ].join(' ')}
              >
                {day && (
                  <>
                    <div className={`self-start w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold select-none
                      ${isToday
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {day}
                    </div>

                    <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden min-w-0">
                      {shown.map(({ kind, item }, ci) => (
                        <div
                          key={`${kind}-${item.id}-${ci}`}
                          className={`flex items-center gap-1 px-1.5 py-[2px] rounded-[5px] min-w-0 ${
                            kind === 'pend'
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            kind === 'pend' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-[10px] font-medium truncate leading-tight">
                            {item.titulo}
                          </span>
                        </div>
                      ))}

                      {overflow > 0 && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1 font-medium leading-tight">
                          +{overflow} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Pendência</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-600 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Demanda</span>
        </div>
        <div className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          Clique em um dia para ver detalhes
        </div>
      </div>

      {/* ── Day detail modal ── */}
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })
            : ''
        }
        subtitle={
          selectedItems
            ? `${selectedItems.pendencias.length} pendência(s) · ${selectedItems.demandas.length} demanda(s)`
            : ''
        }
        size="sm"
      >
        {selectedItems && (
          <div className="space-y-4">
            {selectedItems.pendencias.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Pendências
                </div>
                <div className="space-y-2">
                  {selectedItems.pendencias.map(p => (
                    <div
                      key={p.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40"
                    >
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                          {p.titulo}
                        </div>
                        {p.responsavel && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.responsavel}</div>
                        )}
                        <div className="mt-1.5">
                          <StatusBadgePend status={p.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.demandas.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Demandas
                </div>
                <div className="space-y-2">
                  {selectedItems.demandas.map(d => (
                    <div
                      key={d.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40"
                    >
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                          {d.titulo}
                        </div>
                        {d.responsavel && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.responsavel}</div>
                        )}
                        <div className="mt-1.5">
                          <StatusBadgeDem status={d.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
