// Extras: NotificationBell, PendChart, AvatarUpload, ScopeToggle.

const NotificationBell = ({ profile, onNavigate }) => {
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const items = api.notificationsFor(profile);
  const dismissedKey = `ns-notif-seen-${profile.id}`;
  const [seen, setSeen] = React.useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(dismissedKey) || '[]')); }
    catch (_) { return new Set(); }
  });
  const unseen = items.filter(i => !seen.has(i.id));

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markAllSeen = () => {
    const s = new Set([...seen, ...items.map(i => i.id)]);
    setSeen(s);
    sessionStorage.setItem(dismissedKey, JSON.stringify([...s]));
    // Mark DB notifications as read
    items.filter(i => i.isDb && !i.lida).forEach(i => api.markNotificacaoLida(i.id));
  };

  const iconFor = (k) => {
    switch (k) {
      case 'nova-demanda':       return { i: <IconInbox size={14}/>,    bg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300' };
      case 'demanda-vencida':    return { i: <IconAlert size={14}/>,    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300' };
      case 'demanda-prazo':      return { i: <IconClock size={14}/>,    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' };
      case 'pendencia-vencida':  return { i: <IconAlert size={14}/>,    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300' };
      case 'pendencia-prazo':    return { i: <IconClock size={14}/>,    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' };
      case 'mencao':             return { i: <span style={{fontSize:12}}>@</span>, bg: 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold' };
      case 'comentario':         return { i: <IconDot size={14}/>,      bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' };
      case 'atribuicao':         return { i: <IconUser size={14}/>,     bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' };
      default:                   return { i: <IconBell size={14}/>,     bg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
    }
  };

  return (
    <div className="relative" ref={ref} data-tour="notif">
      <button onClick={() => { setOpen(o => !o); if (!open) markAllSeen(); }}
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Notificações">
        <IconBell size={18}/>
        {unseen.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unseen.length}
          </span>
        )}
      </button>
      {open && (
        <div className="ns-pop-in absolute right-0 mt-2 w-[340px] max-w-[92vw] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-pop z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificações</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Atualizado há instantes</div>
            </div>
            <Badge tone="gray">{items.length}</Badge>
          </div>
          {items.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-2">
                <IconBell size={18}/>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Tudo em dia.</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Você verá aqui novas demandas e prazos próximos.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
              {items.map(it => {
                const ic = iconFor(it.kind);
                const isMencao = it.kind === 'mencao';
                return (
                  <li key={it.id} className={isMencao ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''}>
                    <div className="flex items-stretch">
                      <button
                        onClick={() => { onNavigate(it.href.page); setOpen(false); if (it.isDb) api.markNotificacaoLida(it.id); }}
                        className="flex-1 text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ic.bg}`}>{ic.i}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] font-medium ${isMencao ? 'text-brand-800 dark:text-brand-400' : 'text-gray-900 dark:text-gray-100'}`}>{it.title}</span>
                          {it.desc && <span className="block text-xs text-gray-700 dark:text-gray-300 truncate">{it.desc}</span>}
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{it.sub}{it.sub && it.time ? ' · ' : ''}{timeAgo(it.time)}</span>
                        </span>
                      </button>
                      {it.isDb && (
                        <button
                          onClick={() => api.markNotificacaoLida(it.id)}
                          title="Marcar como lida"
                          className="px-2 text-gray-300 dark:text-gray-600 hover:text-brand-500 dark:hover:text-brand-400 transition-colors shrink-0">
                          <IconCheck size={14}/>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Pendências chart (estilo Linear/Stripe) ----------
const CHART_PERIODS = [
  { value: 'hoje', label: 'Hoje'    },
  { value: '7d',   label: '7 dias'  },
  { value: '30d',  label: '30 dias' },
  { value: '90d',  label: '90 dias' },
  { value: 'ano',  label: 'Ano'     },
];

// Gera baldes de tempo para o período; offset=1 → período anterior (comparação).
const chartBuckets = (period, offset = 0) => {
  const now = new Date();
  const buckets = [];
  const push = (start, end, label) =>
    buckets.push({ start: start.getTime(), end: end.getTime(), label, criadas: 0, concluidas: 0 });

  if (period === 'hoje') {
    const day = new Date(now); day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    for (let h = 0; h < 24; h += 2) {
      const s = new Date(day); s.setHours(h);
      const e = new Date(day); e.setHours(h + 2);
      push(s, e, `${String(h).padStart(2, '0')}h`);
    }
  } else if (period === '7d' || period === '30d') {
    const n = period === '7d' ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - i - offset * n);
      const e = new Date(s); e.setDate(s.getDate() + 1);
      push(s, e, s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    }
  } else if (period === '90d') {
    for (let i = 12; i >= 0; i--) {
      const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - i * 7 - 6 - offset * 91);
      const e = new Date(s); e.setDate(s.getDate() + 7);
      push(s, e, s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    }
  } else { // ano
    for (let i = 11; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i - offset * 12, 1);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      push(s, e, s.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
    }
  }
  return buckets;
};

const fillChartBuckets = (buckets, items) => {
  const t0 = buckets[0].start, t1 = buckets[buckets.length - 1].end;
  let criadas = 0, concluidas = 0;
  for (const it of items) {
    const c = new Date(it.created_at || it.criado_em || it.updated_at).getTime();
    if (c >= t0 && c < t1) {
      criadas++;
      const b = buckets.find(x => c >= x.start && c < x.end);
      if (b) b.criadas++;
    }
    if (it.status === 'concluido') {
      const u = new Date(it.updated_at || it.created_at).getTime();
      if (u >= t0 && u < t1) {
        concluidas++;
        const b = buckets.find(x => u >= x.start && u < x.end);
        if (b) b.concluidas++;
      }
    }
  }
  return { criadas, concluidas };
};

// Curva suave por beziers entre os pontos.
const smoothPath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

const ChartKpi = ({ label, value, delta, tone }) => {
  const tones = {
    brand:   'text-gray-900 dark:text-gray-100',
    green:   'text-emerald-600 dark:text-emerald-400',
    red:     'text-rose-600 dark:text-rose-400',
    neutral: 'text-gray-900 dark:text-gray-100',
  };
  return (
    <div className="flex-1 min-w-[120px] px-4 py-3">
      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-xl font-bold tabular-nums tracking-tight ${tones[tone] || tones.neutral}`}>{value}</span>
        {delta != null && isFinite(delta) && (
          <span className={`text-[10px] font-semibold tabular-nums inline-flex items-center gap-0.5 ${
            delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round(delta))}%
          </span>
        )}
      </div>
    </div>
  );
};

const PendChart = ({ items }) => {
  const [period, setPeriod] = React.useState('30d');
  const [hover, setHover] = React.useState(null); // índice do balde
  const plotRef = React.useRef(null);

  const { buckets, kpi } = React.useMemo(() => {
    const cur  = chartBuckets(period, 0);
    const prev = chartBuckets(period, 1);
    const curTotals  = fillChartBuckets(cur, items);
    const prevTotals = fillChartBuckets(prev, items);

    const now = Date.now();
    const atrasadas = items.filter(p => p.prazo && new Date(p.prazo).getTime() < now && p.status !== 'concluido').length;
    const taxa = curTotals.criadas > 0 ? Math.round((curTotals.concluidas / curTotals.criadas) * 100) : null;

    const deltaOf = (c, p) => (p > 0 ? ((c - p) / p) * 100 : null);
    return {
      buckets: cur,
      kpi: {
        criadas:    { v: curTotals.criadas,    d: deltaOf(curTotals.criadas,    prevTotals.criadas) },
        concluidas: { v: curTotals.concluidas, d: deltaOf(curTotals.concluidas, prevTotals.concluidas) },
        atrasadas,
        taxa,
      },
    };
  }, [items, period]);

  // ----- geometria do SVG -----
  const W = 720, H = 180, PX = 6, PT = 12, PB = 6;
  const n = buckets.length;
  const maxV = Math.max(1, ...buckets.map(b => Math.max(b.criadas, b.concluidas)));
  const xOf = (i) => PX + (i / Math.max(1, n - 1)) * (W - PX * 2);
  const yOf = (v) => PT + (1 - v / maxV) * (H - PT - PB);

  const ptsCriadas    = buckets.map((b, i) => [xOf(i), yOf(b.criadas)]);
  const ptsConcluidas = buckets.map((b, i) => [xOf(i), yOf(b.concluidas)]);
  const pathCriadas    = smoothPath(ptsCriadas);
  const pathConcluidas = smoothPath(ptsConcluidas);
  const areaConcluidas = pathConcluidas
    ? `${pathConcluidas} L ${xOf(n - 1)} ${H - PB} L ${xOf(0)} ${H - PB} Z`
    : '';

  // rótulos do eixo X (≈6 visíveis)
  const labelStep = Math.max(1, Math.ceil(n / 6));

  const onMove = (e) => {
    const el = plotRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1))));
    setHover(idx);
  };

  const hb = hover != null ? buckets[hover] : null;
  const hoverLeftPct = hover != null ? (xOf(hover) / W) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pendências ao longo do tempo</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Criadas vs. concluídas, comparado ao período anterior.</p>
        </div>
        <SegTabs value={period} onChange={(v) => { setPeriod(v); setHover(null); }} items={CHART_PERIODS} />
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap divide-x divide-gray-100 dark:divide-gray-700/60 border-b border-gray-100 dark:border-gray-700">
        <ChartKpi label="Criadas"           value={kpi.criadas.v}    delta={kpi.criadas.d}    tone="neutral" />
        <ChartKpi label="Concluídas"        value={kpi.concluidas.v} delta={kpi.concluidas.d} tone="green" />
        <ChartKpi label="Atrasadas (hoje)"  value={kpi.atrasadas}    tone={kpi.atrasadas > 0 ? 'red' : 'neutral'} />
        <ChartKpi label="Taxa de conclusão" value={kpi.taxa != null ? `${kpi.taxa}%` : '—'} tone="brand" />
      </div>

      {/* plot */}
      <div className="px-4 pt-4 pb-2">
        <div
          ref={plotRef}
          className="relative select-none cursor-crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height: 'clamp(140px, 24vw, 200px)' }} preserveAspectRatio="none">
            {/* gridlines sutis */}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={f} x1={PX} x2={W - PX} y1={PT + f * (H - PT - PB)} y2={PT + f * (H - PT - PB)}
                    className="stroke-gray-100 dark:stroke-gray-700/50" strokeWidth="1" strokeDasharray="4 6" />
            ))}
            <line x1={PX} x2={W - PX} y1={H - PB} y2={H - PB} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />

            {/* área concluídas */}
            <defs>
              <linearGradient id="ns-grad-done" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path key={`a-${period}`} d={areaConcluidas} fill="url(#ns-grad-done)" className="ns-fade-in" />

            {/* linhas */}
            <path key={`c-${period}`} d={pathCriadas} fill="none" stroke="#94a3b8" strokeWidth="1.75"
                  strokeLinecap="round" pathLength="1" className="ns-chart-draw" strokeDasharray="1" />
            <path key={`d-${period}`} d={pathConcluidas} fill="none" stroke="#10b981" strokeWidth="2.25"
                  strokeLinecap="round" pathLength="1" className="ns-chart-draw" strokeDasharray="1" />

            {/* guia + pontos do hover */}
            {hb && (
              <g>
                <line x1={xOf(hover)} x2={xOf(hover)} y1={PT - 4} y2={H - PB}
                      className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />
                <circle cx={xOf(hover)} cy={yOf(hb.criadas)}    r="3.5" fill="#94a3b8" className="stroke-white dark:stroke-gray-800" strokeWidth="1.5" />
                <circle cx={xOf(hover)} cy={yOf(hb.concluidas)} r="3.5" fill="#10b981" className="stroke-white dark:stroke-gray-800" strokeWidth="1.5" />
              </g>
            )}
          </svg>

          {/* tooltip rico */}
          {hb && (
            <div
              className="ns-pop-in absolute top-0 pointer-events-none z-10"
              style={{
                left: `${hoverLeftPct}%`,
                transform: hoverLeftPct > 70 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
              }}
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-pop px-3 py-2 min-w-[130px]">
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{hb.label}</div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Criadas
                  </span>
                  <span className="font-bold tabular-nums text-gray-900 dark:text-gray-100">{hb.criadas}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs mt-1">
                  <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Concluídas
                  </span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{hb.concluidas}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* eixo X */}
        <div className="flex justify-between px-1 mt-1.5">
          {buckets.map((b, i) => (
            <span
              key={i}
              className={`text-[10px] tabular-nums whitespace-nowrap transition-colors ${
                hover === i ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-400 dark:text-gray-500'
              } ${i % labelStep !== 0 && i !== n - 1 ? 'opacity-0' : ''}`}
              style={{ width: `${100 / n}%`, textAlign: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center' }}
            >
              {b.label}
            </span>
          ))}
        </div>

        {/* legenda */}
        <div className="flex items-center gap-4 px-1 pt-2 pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="w-4 h-[2px] rounded bg-slate-400" /> Criadas
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="w-4 h-[2px] rounded bg-emerald-500" /> Concluídas
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------- AvatarUpload ----------
const AvatarUpload = ({ profile, size = 72 }) => {
  const ref = React.useRef(null);
  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast('Imagem muito grande (máx 1.5MB).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      api.setProfileAvatar(profile.id, reader.result);
      toast('Foto de perfil atualizada.');
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar name={profile.nome} src={profile.avatar} size={size}/>
        <button onClick={() => ref.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-card flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:border-brand-300"
                title="Trocar foto">
          <IconPencil size={12}/>
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onPick}/>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Foto de perfil</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PNG ou JPG, até 1,5 MB.</div>
        <div className="mt-2 flex items-center gap-2">
          <Btn kind="secondary" size="sm" onClick={() => ref.current?.click()}>Enviar imagem</Btn>
          {profile.avatar && (
            <Btn kind="ghost" size="sm" onClick={() => { api.setProfileAvatar(profile.id, null); toast('Foto removida.', 'info'); }}>
              Remover
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- OnboardingTour ----------
const TOUR_STEPS = [
  { target: '[data-tour="sidebar"]',    title: 'Navegação',         desc: 'Use o menu lateral para acessar todas as telas do sistema.' },
  { target: '[data-tour="dashboard"]',  title: 'Dashboard',         desc: 'Veja seus indicadores, metas e atividade recente em um só lugar.' },
  { target: '[data-tour="pendencias"]', title: 'Pendências',        desc: 'Organize suas tarefas em colunas: A fazer → Em andamento → Concluído. Arraste para mover.' },
  { target: '[data-tour="demandas"]',   title: 'Demandas',          desc: 'Demandas são enviadas pelo gestor. Atualize o status conforme avança.' },
  { target: '[data-tour="notif"]',      title: 'Notificações',      desc: 'Alertas de prazos vencidos, demandas novas e menções aparecem aqui.' },
  { target: '[data-tour="perfil"]',     title: 'Seu Perfil',        desc: 'Atualize foto e dados. Tour concluído — bom trabalho! 🎉' },
];

const OnboardingTour = () => {
  const [step, setStep] = React.useState(null);
  const [rect, setRect] = React.useState(null);

  const dismiss = React.useCallback(() => {
    localStorage.setItem('ns-tour-done', '1');
    setStep(null);
    setRect(null);
  }, []);

  React.useEffect(() => {
    if (!localStorage.getItem('ns-tour-done')) {
      const t = setTimeout(() => setStep(0), 900);
      return () => clearTimeout(t);
    }
  }, []);

  React.useEffect(() => {
    const handler = () => { localStorage.removeItem('ns-tour-done'); setStep(0); };
    window.addEventListener('ns-start-tour', handler);
    return () => window.removeEventListener('ns-start-tour', handler);
  }, []);

  React.useEffect(() => {
    if (step === null) return;
    const update = () => {
      const el = document.querySelector(TOUR_STEPS[step].target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);

  if (step === null) return null;

  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;
  const PAD     = 8;
  const TW = 288, TH = 168;

  let tipTop, tipLeft;
  if (rect && rect.width > 0) {
    const below = rect.bottom + PAD + 8;
    const above = rect.top - TH - PAD - 8;
    const useAbove = below + TH > window.innerHeight - 16;
    tipTop  = useAbove ? Math.max(16, above) : Math.min(window.innerHeight - TH - 16, below);
    tipLeft = Math.min(window.innerWidth - TW - 16, Math.max(16, rect.left));
  } else {
    tipTop  = Math.round(window.innerHeight / 2 - TH / 2);
    tipLeft = Math.round(window.innerWidth  / 2 - TW / 2);
  }

  const spotStyle = rect && rect.width > 0 ? {
    position: 'fixed',
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
    borderRadius: 10,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'top .2s,left .2s,width .2s,height .2s',
  } : {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 9998, pointerEvents: 'none',
  };

  return (
    <>
      <div style={spotStyle} />
      <div className="ns-pop-in" style={{ position: 'fixed', top: tipTop, left: tipLeft, width: TW, zIndex: 9999 }}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-[1.5px] border-emerald-200 dark:border-emerald-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              {step + 1} de {TOUR_STEPS.length}
            </span>
            <button onClick={dismiss}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 flex rounded-md transition-colors"
                    title="Pular tour">
              <IconClose size={14} />
            </button>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{current.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{current.desc}</div>
          <div className={`flex items-center gap-2 ${isLast ? 'justify-end' : 'justify-between'}`}>
            {!isLast && (
              <button onClick={dismiss}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 transition-colors">
                Pular
              </button>
            )}
            <button
              onClick={isLast ? dismiss : () => setStep(s => s + 1)}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              {isLast ? 'Concluir 🎉' : <><span>Próximo</span><IconChevRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { NotificationBell, PendChart, AvatarUpload, OnboardingTour });

// ---------- Celebrate (confetti) ----------
const _celebrateColors = ['#10b981', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#f97316'];
const _ensureCelebrateLayer = () => {
  let layer = document.getElementById('ns-celebrate-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'ns-celebrate-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999;';
    document.body.appendChild(layer);
  }
  // inject keyframes once
  if (!document.getElementById('ns-celebrate-style')) {
    const s = document.createElement('style');
    s.id = 'ns-celebrate-style';
    s.textContent = `
      @keyframes ns-confetti-fall {
        0%   { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
        100% { transform: translate3d(var(--dx),var(--dy),0) rotate(var(--rot)); opacity: 0; }
      }
      @keyframes ns-toast-pop {
        0%   { transform: translate(-50%, 80px) scale(.85) rotate(-1.5deg); opacity: 0; }
        12%  { transform: translate(-50%, 0)   scale(1.05) rotate(1deg); opacity: 1; }
        16%  { transform: translate(-50%, 0)   scale(1) rotate(0deg); opacity: 1; }
        84%  { transform: translate(-50%, 0)   scale(1) rotate(0deg); opacity: 1; }
        100% { transform: translate(-50%, -40px) scale(.92); opacity: 0; }
      }
      @keyframes ns-sparkle {
        0%, 100% { opacity: 0.4; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      @keyframes ns-icon-bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.25) rotate(8deg); }
      }
      .ns-celebrate-toast {
        position: fixed; left: 50%; top: 22%; transform: translate(-50%,0);
        background: rgba(255, 255, 255, 0.95);
        color: #0f172a; padding: 14px 24px; border-radius: 20px;
        font-size: 14px; font-weight: 700; letter-spacing: -0.015em;
        display: inline-flex; align-items: center; gap: 10px;
        border: 2px solid #a7f3d0;
        box-shadow: 
          0 24px 48px -12px rgba(5, 150, 105, 0.2),
          0 0 0 1px rgba(16, 185, 129, 0.04),
          inset 0 1px 2px rgba(255, 255, 255, 0.6);
        animation: ns-toast-pop 2500ms cubic-bezier(.17,1,.22,1) forwards;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .dark .ns-celebrate-toast {
        background: rgba(30, 41, 59, 0.95);
        color: #f8fafc;
        border-color: #065f46;
        box-shadow: 
          0 24px 48px -12px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }
      .ns-celebrate-icon {
        font-size: 20px;
        display: inline-block;
        animation: ns-icon-bounce 1.5s infinite ease-in-out;
      }
      .ns-celebrate-spark {
        font-size: 14px;
        animation: ns-sparkle 1.2s infinite ease-in-out;
        color: #eab308;
      }
    `;
    document.head.appendChild(s);
  }
  return layer;
};

const celebrate = (opts = {}) => {
  const { count = 80, origin, message } = opts;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (message) toast(message);
    return;
  }
  const layer = _ensureCelebrateLayer();
  
  // Confetti from two sources: bottom-left shooting up-right and bottom-right shooting up-left
  const origins = [
    { x: 0, y: window.innerHeight, angle: -Math.PI / 4 },
    { x: window.innerWidth, y: window.innerHeight, angle: -3 * Math.PI / 4 }
  ];

  origins.forEach(orig => {
    for (let i = 0; i < count / 2; i++) {
      const el = document.createElement('span');
      const isCircle = Math.random() < 0.4;
      const size = 6 + Math.random() * 8;
      const color = _celebrateColors[(Math.random() * _celebrateColors.length) | 0];
      const ang = orig.angle + (Math.random() * 0.5 - 0.25);
      const dist = 320 + Math.random() * 400;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist + 240 + Math.random() * 120; // gravity pull
      const rot = (Math.random() * 1080 - 540) | 0;
      const dur = 1200 + Math.random() * 1000;
      el.style.cssText = `
        position:absolute;left:${orig.x}px;top:${orig.y}px;
        width:${size}px;height:${isCircle ? size : size * 0.55}px;
        background:${color};border-radius:${isCircle ? '999px' : '2.5px'};
        --dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;
        animation: ns-confetti-fall ${dur}ms cubic-bezier(.12,.8,.32,1) forwards;
        will-change: transform, opacity;
      `;
      layer.appendChild(el);
      setTimeout(() => el.remove(), dur + 60);
    }
  });

  if (message) {
    const t = document.createElement('div');
    t.className = 'ns-celebrate-toast';
    t.innerHTML = `
      <span class="ns-celebrate-icon">🎉</span>
      <span>${message}</span>
      <span class="ns-celebrate-spark">✨</span>
    `;
    layer.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
};

Object.assign(window, { celebrate });
