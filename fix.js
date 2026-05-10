const fs = require('fs');
let text = fs.readFileSync('app/ui.jsx', 'utf-8');

const regex = /\/\/ ---------- Tabs \(segmented\) ----------.*?(?=else if \(key === 'M'\))/s;

const replacement = `// ---------- Tabs (segmented) ----------
const SegTabs = ({ value, onChange, items }) => (
  <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
    {items.map(it => {
      const active = value === it.value;
      return (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={\`px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors
            \${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
        >
          {it.label}
          {it.count != null && (
            <span className={\`text-[10px] px-1.5 rounded-md \${active ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-500'}\`}>
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
              key={\`\${r.type}-\${r.id}\`}
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
      `;

if (regex.test(text)) {
  text = text.replace(regex, replacement);
  fs.writeFileSync('app/ui.jsx', text);
  console.log("ui.jsx fixed!");
} else {
  console.log("Regex did not match.");
}
