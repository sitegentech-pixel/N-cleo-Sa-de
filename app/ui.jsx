// UI primitives: Toast host, Modal, Badge, Spinner, EmptyState, Avatar, Field

// ---------- Toast ----------
const _toastSubs = new Set();
let _toastSeq = 0;
const toast = (message, kind = 'success') => {
  const id = ++_toastSeq;
  _toastSubs.forEach(fn => fn({ id, message, kind }));
  setTimeout(() => _toastSubs.forEach(fn => fn({ id, dismiss: true })), 2800);
};

const ToastHost = () => {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const sub = (evt) => {
      if (evt.dismiss) setItems(xs => xs.filter(x => x.id !== evt.id));
      else setItems(xs => [...xs, evt]);
    };
    _toastSubs.add(sub);
    return () => _toastSubs.delete(sub);
  }, []);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {items.map(t => {
        const colors = t.kind === 'error'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : t.kind === 'info'
          ? 'bg-sky-50 text-sky-800 border-sky-200'
          : 'bg-white text-gray-800 border-gray-200';
        const dot = t.kind === 'error' ? 'bg-rose-500' : t.kind === 'info' ? 'bg-sky-500' : 'bg-emerald-500';
        return (
          <div key={t.id}
               className={`ns-toast-in pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-pop min-w-[260px] ${colors}`}>
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Spinner ----------
const Spinner = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// ---------- Badge ----------
const Badge = ({ children, tone = 'gray', icon, className = '' }) => {
  const tones = {
    gray:    'bg-gray-100 text-gray-600 ring-gray-200',
    green:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    yellow:  'bg-amber-50 text-amber-800 ring-amber-200',
    red:     'bg-rose-50 text-rose-700 ring-rose-200',
    blue:    'bg-sky-50 text-sky-700 ring-sky-200',
    violet:  'bg-violet-50 text-violet-700 ring-violet-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${tones[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

const StatusBadgePend = ({ status }) => {
  const map = {
    'nao-concluido': { tone: 'red',    label: 'Não concluído' },
    'em-andamento':  { tone: 'yellow', label: 'Em andamento'  },
    'concluido':     { tone: 'green',  label: 'Concluído'     },
  };
  const m = map[status] || { tone: 'gray', label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
};

const StatusBadgeDem = ({ status }) => {
  const map = {
    'aberta':       { tone: 'blue',    label: 'Aberta' },
    'em-andamento': { tone: 'yellow',  label: 'Em andamento' },
    'concluida':    { tone: 'green',   label: 'Concluída' },
    'cancelada':    { tone: 'gray',    label: 'Cancelada' },
  };
  const m = map[status] || { tone: 'gray', label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
};

// ---------- Avatar ----------
const Avatar = ({ name, src, size = 32, className = '' }) => {
  if (src) {
    return (
      <img src={src} alt={name}
           className={`inline-block rounded-full object-cover ring-1 ring-black/5 ${className}`}
           style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-tight ${avatarColor(name)} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
};

// ---------- EmptyState ----------
const EmptyState = ({ title = 'Nenhum item encontrado.', subtitle, icon, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
      {icon || <IconInbox size={26} />}
    </div>
    <p className="text-gray-800 font-medium">{title}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ---------- Modal ----------
const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md' }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="ns-fade-in fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`ns-pop-in bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <IconClose size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

// ---------- Buttons ----------
const Btn = (props) => {
  const kind = props.kind || 'primary';
  const size = props.size || 'md';
  const Tag  = props.as || 'button';
  const icon = props.icon, iconRight = props.iconRight;
  const className = props.className || '';
  const _loading = !!props.isLoading;
  const children = props.children;
  // Build rest by stripping known component props — destructure rest was unreliable here.
  const SKIP = new Set(['kind','size','as','icon','iconRight','className','isLoading','loading','children']);
  const rest = {};
  for (const k of Object.keys(props)) if (!SKIP.has(k)) rest[k] = props[k];
  const sizes = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-11 text-sm px-5',
  };
  const kinds = {
    primary:  'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm focus:ring-2 focus:ring-brand-500/40',
    secondary:'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300',
    ghost:    'text-gray-700 hover:bg-gray-100',
    danger:   'bg-rose-600 text-white hover:bg-rose-700',
    dark:     'bg-gray-900 text-white hover:bg-gray-800',
  };
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${kinds[kind]} ${className}`}
      {...rest}
    >
      {_loading ? <Spinner size={14} /> : icon}
      {children}
      {iconRight}
    </Tag>
  );
};

// ---------- Form fields ----------
const Label = ({ children, required, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-rose-500 ml-0.5">*</span>}
  </label>
);

const inputCls =
  "w-full bg-white border border-gray-300 rounded-lg px-3 h-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition disabled:bg-gray-50 disabled:text-gray-500";

const Input = React.forwardRef(({ error, ...rest }, ref) => (
  <input ref={ref} className={`${inputCls} ${error ? 'border-rose-300 focus:ring-rose-500/30 focus:border-rose-500' : ''}`} {...rest} />
));

const Textarea = ({ error, rows = 3, ...rest }) => (
  <textarea
    rows={rows}
    className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition resize-none ${error ? 'border-rose-300' : ''}`}
    {...rest}
  />
);

const Select = ({ error, children, ...rest }) => (
  <div className="relative">
    <select
      className={`appearance-none w-full bg-white border border-gray-300 rounded-lg pl-3 pr-9 h-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition ${error ? 'border-rose-300' : ''}`}
      {...rest}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
      <IconChevDown size={16} />
    </span>
  </div>
);

const Checkbox = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <span className="relative inline-flex items-center justify-center mt-0.5">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} className="peer sr-only" />
      <span className="w-[18px] h-[18px] rounded-md border border-gray-300 bg-white peer-checked:bg-brand-600 peer-checked:border-brand-600 peer-focus:ring-2 peer-focus:ring-brand-500/40 transition-colors"></span>
      <span className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity">
        <IconCheck size={12} strokeWidth={3} />
      </span>
    </span>
    <span>
      <span className="block text-sm text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>}
    </span>
  </label>
);

const FieldError = ({ children }) => children
  ? <p className="text-xs text-rose-600 mt-1.5">{children}</p>
  : null;

// ---------- Tabs (segmented) ----------
const SegTabs = ({ value, onChange, items }) => (
  <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
    {items.map(it => {
      const active = value === it.value;
      return (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={`px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors
            ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          {it.label}
          {it.count != null && (
            <span className={`text-[10px] px-1.5 rounded-md ${active ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-500'}`}>
              {it.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ---------- Confirm helper ----------
const confirmAction = (msg) => window.confirm(msg);

// ---------- Global Search ----------
const GlobalSearch = ({ onNavigate }) => {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState('');
  const inputRef = React.useRef(null);
  const store = window.useStore();
  
  React.useEffect(() => {
    const handleOpen = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); };
    window.addEventListener('ns-open-search', handleOpen);
    return () => window.removeEventListener('ns-open-search', handleOpen);
  }, []);

  const results = React.useMemo(() => {
    if (!term.trim() || term.length < 2) return [];
    const t = term.toLowerCase();
    const pends = store.pendencias.filter(p => p.titulo.toLowerCase().includes(t)).map(p => ({ type: 'Pendência', id: p.id, title: p.titulo, nav: 'pendencias' }));
    const dems = store.demandas.filter(d => d.titulo.toLowerCase().includes(t)).map(d => ({ type: 'Demanda', id: d.id, title: d.titulo, nav: 'demandas' }));
    const users = store.profiles.filter(u => u.nome.toLowerCase().includes(t)).map(u => ({ type: 'Usuário', id: u.id, title: u.nome, nav: 'equipe' }));
    return [...pends, ...dems, ...users].slice(0, 10);
  }, [term, store.pendencias, store.demandas, store.profiles]);

  return (
    <Modal open={open} onClose={() => { setOpen(false); setTerm(''); }} size="lg">
      <div className="-mx-6 -mt-5 -mb-5">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <IconSearch className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-lg"
            placeholder="Buscar pendências, demandas ou usuários..."
            value={term}
            onChange={e => setTerm(e.target.value)}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded border border-gray-200">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {term.length > 0 && term.length < 2 && (
            <div className="p-4 text-center text-sm text-gray-500">Digite pelo menos 2 caracteres...</div>
          )}
          {term.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">Nenhum resultado encontrado para "{term}".</div>
          )}
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => { onNavigate(r.nav); setOpen(false); setTerm(''); }}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <Badge tone={r.type === 'Pendência' ? 'yellow' : r.type === 'Demanda' ? 'blue' : 'gray'}>{r.type}</Badge>
              <span className="flex-1 text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate">{r.title}</span>
              <IconChevRight size={16} className="text-gray-300 group-hover:text-brand-500" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ---------- Keyboard Shortcuts ----------
const KeyboardShortcuts = ({ onNavigate }) => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const handleKey = (e) => {
      // Ignore if inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const key = e.key.toUpperCase();
      if (key === 'D') onNavigate('dashboard');
      else if (key === 'P') onNavigate('pendencias');
      else if (key === 'M') onNavigate('demandas');
      else if (key === 'E') onNavigate('equipe');
      else if (key === 'N') window.dispatchEvent(new CustomEvent('ns-open-new-pendencia'));
      else if (e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ns-open-search'));
      }
      else if (e.key === '?') setOpen(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNavigate]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Atalhos de Teclado" size="md">
      <div className="space-y-3">
        {[
          { k: 'D', l: 'Ir para Dashboard' },
          { k: 'P', l: 'Ir para Pendências' },
          { k: 'M', l: 'Ir para Demandas' },
          { k: 'E', l: 'Ir para Equipe' },
          { k: 'N', l: 'Nova Pendência' },
          { k: '/', l: 'Busca Global' },
          { k: 'ESC', l: 'Fechar modais' },
        ].map(it => (
          <div key={it.k} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700">{it.l}</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono text-gray-700">{it.k}</kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ---------- Onboarding Tour ----------
const OnboardingTour = () => {
  const [step, setStep] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  
  React.useEffect(() => {
    const seen = localStorage.getItem('ns_tour_seen');
    if (!seen) {
      setTimeout(() => setOpen(true), 1500);
    }
  }, []);

  const finish = () => {
    localStorage.setItem('ns_tour_seen', 'true');
    setOpen(false);
    toast('Tour finalizado! Bem-vindo ao Núcleo Saúde.');
  };

  const steps = [
    { title: "Bem-vindo ao Núcleo Saúde", text: "Este pequeno tour vai te mostrar como ser mais produtivo no sistema. Você pode acessá-lo usando o teclado!" },
    { title: "Atalhos Globais", text: "Pressione '?' em qualquer lugar para ver a lista de atalhos. Use 'D', 'P', 'M' ou 'E' para navegar rapidamente entre as telas." },
    { title: "Busca Rápida", text: "Perdeu uma demanda? Pressione '/' no teclado para abrir a busca global instantaneamente." },
    { title: "Menções e Notificações", text: "Nas demandas, digite '@' nos comentários para marcar alguém da equipe. Eles serão notificados aqui no topo." },
    { title: "Tudo pronto!", text: "Sua equipe agora trabalha sincronizada. Clique em Concluir para começar." }
  ];

  if (!open) return null;
  const s = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="ns-pop-in bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-brand-50 px-6 py-8 text-center relative">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-brand-600">
            <IconSpark size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-brand-500' : 'bg-brand-200'}`} />
            ))}
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{s.text}</p>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <>
                <Btn kind="ghost" className="flex-1" onClick={finish}>Pular</Btn>
                <Btn className="flex-1" onClick={() => setStep(x => x + 1)}>Próximo <IconChevRight size={14}/></Btn>
              </>
            ) : (
              <Btn className="w-full" onClick={finish} icon={<IconCheck size={16}/>}>Concluir Tour</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  toast, ToastHost, Spinner, Badge, StatusBadgePend, StatusBadgeDem, Avatar,
  EmptyState, Modal, Btn, Label, Input, Textarea, Select, Checkbox, FieldError,
  SegTabs, confirmAction, GlobalSearch, KeyboardShortcuts, OnboardingTour
});
