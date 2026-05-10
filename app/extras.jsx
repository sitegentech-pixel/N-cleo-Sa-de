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
      case 'nova-demanda':       return { i: <IconInbox size={14}/>,    bg: 'bg-violet-50 text-violet-700' };
      case 'demanda-vencida':    return { i: <IconAlert size={14}/>,    bg: 'bg-rose-50 text-rose-700' };
      case 'demanda-prazo':      return { i: <IconClock size={14}/>,    bg: 'bg-amber-50 text-amber-700' };
      case 'pendencia-vencida':  return { i: <IconAlert size={14}/>,    bg: 'bg-rose-50 text-rose-700' };
      case 'pendencia-prazo':    return { i: <IconClock size={14}/>,    bg: 'bg-amber-50 text-amber-700' };
      case 'mencao':             return { i: <span style={{fontSize:12}}>@</span>, bg: 'bg-brand-50 text-brand-700 font-bold' };
      case 'comentario':         return { i: <IconDot size={14}/>,      bg: 'bg-blue-50 text-blue-700' };
      case 'atribuicao':         return { i: <IconUser size={14}/>,     bg: 'bg-emerald-50 text-emerald-700' };
      default:                   return { i: <IconBell size={14}/>,     bg: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="relative" ref={ref}>
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
        <div className="ns-pop-in absolute right-0 mt-2 w-[340px] max-w-[92vw] bg-white rounded-xl border border-gray-200 shadow-pop z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Notificações</div>
              <div className="text-[11px] text-gray-500">Atualizado há instantes</div>
            </div>
            <Badge tone="gray">{items.length}</Badge>
          </div>
          {items.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                <IconBell size={18}/>
              </div>
              <p className="text-sm text-gray-700 font-medium">Tudo em dia.</p>
              <p className="text-[11px] text-gray-500 mt-1">Você verá aqui novas demandas e prazos próximos.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {items.map(it => {
                const ic = iconFor(it.kind);
                const isMencao = it.kind === 'mencao';
                return (
                  <li key={it.id} className={isMencao ? 'bg-brand-50/40' : ''}>
                    <div className="flex items-stretch">
                      <button
                        onClick={() => { onNavigate(it.href.page); setOpen(false); if (it.isDb) api.markNotificacaoLida(it.id); }}
                        className="flex-1 text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50/80 transition-colors">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ic.bg}`}>{ic.i}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] font-medium ${isMencao ? 'text-brand-800' : 'text-gray-900'}`}>{it.title}</span>
                          {it.desc && <span className="block text-xs text-gray-700 truncate">{it.desc}</span>}
                          <span className="block text-[11px] text-gray-500 mt-0.5">{it.sub}{it.sub && it.time ? ' · ' : ''}{timeAgo(it.time)}</span>
                        </span>
                      </button>
                      {it.isDb && (
                        <button
                          onClick={() => api.markNotificacaoLida(it.id)}
                          title="Marcar como lida"
                          className="px-2 text-gray-300 hover:text-brand-500 transition-colors shrink-0">
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

// ---------- Pendências chart ----------
// Group pendencias by period; show stacked bars by status.
const groupBy = (list, period) => {
  const buckets = new Map();
  const now = new Date();
  let n, fmt, key;
  if (period === 'diario') {
    n = 7;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0,10), { label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.',''), items: [] });
    }
    key = (iso) => iso.slice(0,10);
  } else if (period === 'semanal') {
    n = 8;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - i*7);
      // week-of-month-ish label
      const wk = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
      buckets.set(`w-${i}`, { label: `S ${wk}`, weekStart: d.getTime(), items: [] });
    }
    key = (iso) => {
      const t = new Date(iso).getTime();
      let bestKey = null, bestStart = -Infinity;
      for (const [k, v] of buckets) {
        if (v.weekStart <= t && v.weekStart > bestStart) { bestStart = v.weekStart; bestKey = k; }
      }
      return bestKey;
    };
  } else if (period === 'mensal') {
    n = 6;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      buckets.set(k, { label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.',''), items: [] });
    }
    key = (iso) => iso.slice(0,7);
  } else { // anual
    n = 4;
    for (let i = n - 1; i >= 0; i--) {
      const y = now.getFullYear() - i;
      buckets.set(`${y}`, { label: `${y}`, items: [] });
    }
    key = (iso) => iso.slice(0,4);
  }
  for (const item of list) {
    const k = key(item.created_at || item.updated_at);
    if (k && buckets.has(k)) buckets.get(k).items.push(item);
  }
  return [...buckets.values()];
};

const PendChart = ({ items }) => {
  const [period, setPeriod] = React.useState('semanal');
  const buckets = groupBy(items, period);
  const max = Math.max(1, ...buckets.map(b => b.items.length));

  const STAT = [
    { key: 'concluido',     label: 'Concluído',      color: '#10b981' },
    { key: 'em-andamento',  label: 'Em andamento',   color: '#f59e0b' },
    { key: 'nao-concluido', label: 'Não concluído',  color: '#f43f5e' },
  ];

  const total = items.length;
  const totals = STAT.map(s => ({ ...s, count: items.filter(i => i.status === s.key).length }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pendências ao longo do tempo</h3>
          <p className="text-xs text-gray-500 mt-0.5">Distribuição por status no período.</p>
        </div>
        <SegTabs value={period} onChange={setPeriod} items={[
          { value: 'diario',  label: 'Diário'  },
          { value: 'semanal', label: 'Semanal' },
          { value: 'mensal',  label: 'Mensal'  },
          { value: 'anual',   label: 'Anual'   },
        ]}/>
      </div>

      <div className="px-5 pt-4 pb-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        {totals.map(t => (
          <span key={t.key} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }}></span>
            <span className="font-medium text-gray-700">{t.label}</span>
            <span className="text-gray-400 tabular-nums">{t.count}</span>
          </span>
        ))}
        <span className="ml-auto text-gray-400">Total: <span className="font-semibold text-gray-700 tabular-nums">{total}</span></span>
      </div>

      <div className="px-5 pb-5 pt-3">
        <div className="flex items-end gap-2 h-44">
          {buckets.map((b, i) => {
            const counts = STAT.map(s => b.items.filter(it => it.status === s.key).length);
            const heightPct = (b.items.length / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full max-w-[44px] flex flex-col-reverse rounded-md overflow-hidden bg-gray-50/80"
                     style={{ height: `${Math.max(2, heightPct)}%`, minHeight: 4 }}>
                  {STAT.map((s, j) => {
                    const c = counts[j];
                    if (c === 0) return null;
                    return <div key={s.key} title={`${s.label}: ${c}`}
                                style={{ background: s.color, height: `${(c / b.items.length) * 100}%` }}
                                className="w-full transition-all"></div>;
                  })}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {b.items.length}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 tracking-tight whitespace-nowrap">{b.label}</div>
              </div>
            );
          })}
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
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-card flex items-center justify-center text-gray-600 hover:text-brand-700 hover:border-brand-300"
                title="Trocar foto">
          <IconPencil size={12}/>
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onPick}/>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">Foto de perfil</div>
        <div className="text-xs text-gray-500 mt-0.5">PNG ou JPG, até 1,5 MB.</div>
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

Object.assign(window, { NotificationBell, PendChart, AvatarUpload });

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
        0%   { transform: translate(-50%,40px) scale(.9); opacity: 0; }
        15%  { transform: translate(-50%,0)   scale(1.04); opacity: 1; }
        100% { transform: translate(-50%,-30px) scale(1); opacity: 0; }
      }
      .ns-celebrate-toast {
        position: fixed; left: 50%; top: 18%; transform: translate(-50%,0);
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff; padding: 14px 22px; border-radius: 999px;
        font-size: 14px; font-weight: 600; letter-spacing: -0.01em;
        box-shadow: 0 18px 40px -12px rgba(16,185,129,.55), 0 0 0 6px rgba(16,185,129,.08);
        animation: ns-toast-pop 1800ms cubic-bezier(.2,.8,.2,1) forwards;
        display: inline-flex; align-items: center; gap: 10px;
      }
    `;
    document.head.appendChild(s);
  }
  return layer;
};

const celebrate = (opts = {}) => {
  const { count = 70, origin, message } = opts;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (message) toast(message);
    return;
  }
  const layer = _ensureCelebrateLayer();
  const cx = origin?.x ?? window.innerWidth / 2;
  const cy = origin?.y ?? Math.min(window.innerHeight * 0.35, 280);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    const isCircle = Math.random() < 0.35;
    const size = 6 + Math.random() * 8;
    const color = _celebrateColors[(Math.random() * _celebrateColors.length) | 0];
    const ang = Math.random() * Math.PI * 2;
    const dist = 140 + Math.random() * 260;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist + 220 + Math.random() * 140; // gravity
    const rot = (Math.random() * 720 - 360) | 0;
    const dur = 900 + Math.random() * 900;
    el.style.cssText = `
      position:absolute;left:${cx}px;top:${cy}px;
      width:${size}px;height:${isCircle ? size : size * 0.5}px;
      background:${color};border-radius:${isCircle ? '999px' : '2px'};
      --dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;
      animation: ns-confetti-fall ${dur}ms cubic-bezier(.2,.7,.3,1) forwards;
      will-change: transform, opacity;
    `;
    layer.appendChild(el);
    setTimeout(() => el.remove(), dur + 60);
  }

  if (message) {
    const t = document.createElement('div');
    t.className = 'ns-celebrate-toast';
    t.innerHTML = `<span style="font-size:18px">🎉</span><span>${message}</span>`;
    layer.appendChild(t);
    setTimeout(() => t.remove(), 1900);
  }
};

Object.assign(window, { celebrate });
