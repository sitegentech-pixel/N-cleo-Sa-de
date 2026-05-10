// Feedback — bug reports and feature ideas from any user.

const FEEDBACK_KEY = 'ns-feedback-items';

const loadFeedback = () => {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); } catch (_) { return []; }
};
const saveFeedback = (items) => localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));

const Feedback = ({ profile }) => {
  const isGestor = profile.role === 'gestor';
  const [items, setItems] = React.useState(loadFeedback);
  const [tipo, setTipo] = React.useState('bug');
  const [texto, setTexto] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const submit = () => {
    if (!texto.trim()) return;
    setSending(true);
    const novo = {
      id: Date.now(),
      tipo,
      texto: texto.trim(),
      autor: profile.nome,
      autor_id: profile.id,
      criado_em: new Date().toISOString(),
      status: 'aberto',
    };
    const updated = [novo, ...items];
    saveFeedback(updated);
    setItems(updated);
    setTexto('');
    setSending(false);
    toast('Feedback enviado. Obrigado!');
  };

  const resolve = (id) => {
    const updated = items.map(i => i.id === id ? { ...i, status: 'resolvido' } : i);
    saveFeedback(updated);
    setItems(updated);
  };

  const remove = (id) => {
    if (!confirmAction('Excluir este feedback?')) return;
    const updated = items.filter(i => i.id !== id);
    saveFeedback(updated);
    setItems(updated);
  };

  const tipoInfo = {
    bug:    { label: 'Bug',    bg: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-500' },
    ideia:  { label: 'Ideia',  bg: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    outros: { label: 'Outros', bg: 'bg-gray-100 text-gray-700 border-gray-200',   dot: 'bg-gray-400' },
  };

  const visible = isGestor ? items : items.filter(i => i.autor_id === profile.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[860px] mx-auto">
      <PageHeader
        title="Feedback"
        subtitle="Reporte bugs ou sugira melhorias para o sistema."
      />

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-6">
        <div className="flex gap-2 mb-3">
          {Object.entries(tipoInfo).map(([k, v]) => (
            <button key={k}
              onClick={() => setTipo(k)}
              className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all
                ${tipo === k ? v.bg + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={3}
          placeholder={
            tipo === 'bug'   ? 'Descreva o bug: o que aconteceu, quando, em qual tela...' :
            tipo === 'ideia' ? 'Descreva sua ideia: qual problema resolve, como funcionaria...' :
                               'Sua mensagem...'
          }
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
        />
        <div className="flex justify-end mt-2">
          <Btn onClick={submit} isLoading={sending} disabled={!texto.trim()}>Enviar</Btn>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {visible.length === 0 && <EmptyState title="Nenhum feedback ainda." subtitle="Seja o primeiro a relatar algo." />}
        {visible.map(item => {
          const t = tipoInfo[item.tipo] || tipoInfo.outros;
          return (
            <div key={item.id} className={`bg-white rounded-xl border shadow-card p-4 flex gap-3 ${item.status === 'resolvido' ? 'opacity-60' : ''}`}>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${t.dot}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.bg}`}>{t.label}</span>
                  <span className="text-[11px] text-gray-500">{item.autor} · {timeAgo(item.criado_em)}</span>
                  {item.status === 'resolvido' && <span className="text-[11px] text-emerald-600 font-medium">✓ Resolvido</span>}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.texto}</p>
              </div>
              {isGestor && (
                <div className="flex flex-col gap-1 shrink-0">
                  {item.status !== 'resolvido' && (
                    <button onClick={() => resolve(item.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="Marcar resolvido">
                      <IconCheck size={14}/>
                    </button>
                  )}
                  <button onClick={() => remove(item.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50" title="Excluir">
                    <IconTrash size={14}/>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { Feedback });
