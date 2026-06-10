// Workspace Pessoal — área privada de cada usuário.
// Notas (post-it), Projetos (kanban), Fluxogramas (canvas simples) e Conhecimento,
// com compartilhamento estilo Google Docs (view / comment / edit).

// ---------- helpers ----------

const WS_NOTE_COLORS = {
  amarelo: { bg: 'bg-[#FEF9C3] dark:bg-[#3d3a1f]', border: 'border-[#FDE68A] dark:border-[#5c5530]', dot: '#FDE047' },
  verde:   { bg: 'bg-[#DCFCE7] dark:bg-[#1d3d2a]', border: 'border-[#BBF7D0] dark:border-[#2d5c40]', dot: '#4ADE80' },
  rosa:    { bg: 'bg-[#FCE7F3] dark:bg-[#3d1f30]', border: 'border-[#FBCFE8] dark:border-[#5c3048]', dot: '#F472B6' },
  azul:    { bg: 'bg-[#E0F2FE] dark:bg-[#1f2f3d]', border: 'border-[#BAE6FD] dark:border-[#30485c]', dot: '#38BDF8' },
  roxo:    { bg: 'bg-[#EDE9FE] dark:bg-[#2c1f3d]', border: 'border-[#DDD6FE] dark:border-[#44305c]', dot: '#A78BFA' },
  laranja: { bg: 'bg-[#FFEDD5] dark:bg-[#3d2c1f]', border: 'border-[#FED7AA] dark:border-[#5c4430]', dot: '#FB923C' },
};

const WS_PROJECT_COLORS = {
  emerald: 'bg-emerald-500', sky: 'bg-sky-500', amber: 'bg-amber-500',
  rose: 'bg-rose-500', violet: 'bg-violet-500', slate: 'bg-slate-500',
};

const WS_TASK_COLS = [
  { status: 'backlog',    label: 'Backlog',      dot: 'bg-slate-400'   },
  { status: 'andamento',  label: 'Em andamento', dot: 'bg-amber-400'   },
  { status: 'aguardando', label: 'Aguardando',   dot: 'bg-sky-400'     },
  { status: 'concluido',  label: 'Concluído',    dot: 'bg-emerald-500' },
];

const wsOwnerName = (store, userId) => {
  const p = store.profiles.find(x => x.id === userId);
  return p ? p.nome.split(' ')[0] : '—';
};

// own ou compartilhado com permissão de edição
const wsCanEdit = (item, tipo, profile) =>
  item.user_id === profile.id || api.sharePermissionFor(tipo, item.id, profile) === 'edit';

// ---------- compartilhamento ----------

const WsShareModal = ({ open, onClose, tipo, recurso, profile }) => {
  const store = useStore();
  const [userId, setUserId] = React.useState('');
  const [perm, setPerm] = React.useState('view');
  if (!recurso) return null;

  const shares = api.listShares(tipo, recurso.id);
  const candidates = store.profiles.filter(p =>
    p.ativo && p.id !== profile.id && !shares.some(s => s.usuario_id === p.id));

  const permLabel = { view: 'Visualizar', comment: 'Comentar', edit: 'Editar' };

  const add = async () => {
    if (!userId) return;
    await api.createShare(tipo, recurso.id, userId, perm, profile);
    setUserId('');
    toast('Compartilhado com sucesso.');
  };

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar" subtitle={recurso.titulo || recurso.nome} size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Selecionar pessoa...</option>
              {candidates.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </div>
          <div className="w-32">
            <Select value={perm} onChange={e => setPerm(e.target.value)}>
              <option value="view">Visualizar</option>
              <option value="comment">Comentar</option>
              <option value="edit">Editar</option>
            </Select>
          </div>
          <Btn onClick={add} disabled={!userId} icon={<IconPlus size={14}/>}>Adicionar</Btn>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Pessoas com acesso</p>
          {shares.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-3 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Privado — só você tem acesso.
            </p>
          )}
          <div className="space-y-2">
            {shares.map(s => {
              const u = store.profiles.find(p => p.id === s.usuario_id);
              if (!u) return null;
              return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
                  <Avatar name={u.nome} src={u.avatar} size={28}/>
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{u.nome}</span>
                  <select
                    value={s.permissao}
                    onChange={async (e) => { await api.createShare(tipo, recurso.id, s.usuario_id, e.target.value, profile); }}
                    className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 h-7 text-gray-600 dark:text-gray-300">
                    {Object.entries(permLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button onClick={() => api.deleteShare(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Remover acesso">
                    <IconClose size={14}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ---------- NOTAS ----------

const WsNoteCard = ({ note, profile, store, onEdit, onShare }) => {
  const c = WS_NOTE_COLORS[note.cor] || WS_NOTE_COLORS.amarelo;
  const isMine = note.user_id === profile.id;
  const canEdit = wsCanEdit(note, 'note', profile);
  const rot = ((Number(note.id) % 5) - 2) * 0.7;

  return (
    <div
      className={`ws-note group relative rounded-xl border ${c.bg} ${c.border} p-4 cursor-pointer select-none shadow-card hover:shadow-pop`}
      style={{ '--ws-rot': `${rot}deg` }}
      onClick={() => onEdit(note)}
    >
      {note.fixada && (
        <span className="ws-clip absolute -top-3 left-4 text-gray-500/80 dark:text-gray-300/70 pointer-events-none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 12.5 12 21.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.85 1.85 0 0 1-2.6-2.6l8-8"/>
          </svg>
        </span>
      )}

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {note.titulo && <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 break-words">{note.titulo}</p>}
          <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed line-clamp-[8]">{note.conteudo}</p>
        </div>
        {note.favorita && <span className="text-amber-500 shrink-0"><IconStar size={14} filled /></span>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-500/80 dark:text-gray-400">
          {!isMine ? `de ${wsOwnerName(store, note.user_id)}` : timeAgo(note.atualizado_em)}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {canEdit && (
            <button onClick={() => api.updateNote(note.id, { fixada: !note.fixada })}
                    className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${note.fixada ? 'text-brand-700 dark:text-brand-400' : 'text-gray-500'}`}
                    title={note.fixada ? 'Desafixar' : 'Fixar'}>
              <IconPaperclip size={13}/>
            </button>
          )}
          {canEdit && (
            <button onClick={() => api.updateNote(note.id, { favorita: !note.favorita })}
                    className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${note.favorita ? 'text-amber-500' : 'text-gray-500'}`}
                    title="Favoritar">
              <IconStar size={13} filled={note.favorita}/>
            </button>
          )}
          {isMine && (
            <button onClick={() => onShare(note)} className="p-1.5 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10" title="Compartilhar">
              <IconShare size={13}/>
            </button>
          )}
          {canEdit && (
            <button onClick={() => api.updateNote(note.id, { arquivada: !note.arquivada })}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
                    title={note.arquivada ? 'Restaurar' : 'Arquivar'}>
              <IconArchive size={13}/>
            </button>
          )}
          {isMine && (
            <button onClick={() => { if (confirmAction('Excluir esta nota?')) api.deleteNote(note.id); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/40" title="Excluir">
              <IconTrash size={13}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const WsNoteModal = ({ note, open, onClose, profile }) => {
  const [titulo, setTitulo] = React.useState('');
  const [conteudo, setConteudo] = React.useState('');
  const [cor, setCor] = React.useState('amarelo');

  React.useEffect(() => {
    if (open) {
      setTitulo(note?.titulo || '');
      setConteudo(note?.conteudo || '');
      setCor(note?.cor || 'amarelo');
    }
  }, [open, note]);

  const readOnly = note && !wsCanEdit(note, 'note', profile);

  const save = async () => {
    if (!conteudo.trim() && !titulo.trim()) { onClose(); return; }
    if (note) await api.updateNote(note.id, { titulo, conteudo, cor });
    else { await api.createNote({ titulo, conteudo, cor }, profile); toast('Nota criada.'); }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={readOnly ? 'Nota compartilhada' : (note ? 'Editar nota' : 'Nova nota')} size="md"
      footer={!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Object.entries(WS_NOTE_COLORS).map(([k, v]) => (
              <button key={k} onClick={() => setCor(k)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${cor === k ? 'scale-110 border-gray-500 dark:border-gray-300' : 'border-transparent hover:scale-105'}`}
                      style={{ background: v.dot }} title={k}/>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={save}>Salvar</Btn>
          </div>
        </div>
      )}>
      <div className="space-y-3">
        <Input placeholder="Título (opcional)" value={titulo} onChange={e => setTitulo(e.target.value)} disabled={readOnly}/>
        <Textarea placeholder="Escreva sua nota..." rows={7} value={conteudo} onChange={e => setConteudo(e.target.value)} disabled={readOnly} autoFocus/>
      </div>
    </Modal>
  );
};

const WsNotesTab = ({ profile }) => {
  const store = useStore();
  const [busca, setBusca] = React.useState('');
  const [view, setView] = React.useState('ativas'); // ativas | favoritas | arquivadas
  const [editing, setEditing] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sharing, setSharing] = React.useState(null);

  const notes = React.useMemo(() => {
    let list = store.wsNotes;
    if (view === 'arquivadas') list = list.filter(n => n.arquivada);
    else {
      list = list.filter(n => !n.arquivada);
      if (view === 'favoritas') list = list.filter(n => n.favorita);
    }
    const t = busca.trim().toLowerCase();
    if (t) list = list.filter(n => (n.titulo + ' ' + n.conteudo).toLowerCase().includes(t));
    return list;
  }, [store.wsNotes, busca, view]);

  const fixadas = notes.filter(n => n.fixada);
  const outras  = notes.filter(n => !n.fixada);

  const grid = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(n => (
        <WsNoteCard key={n.id} note={n} profile={profile} store={store}
                    onEdit={(note) => { setEditing(note); setModalOpen(true); }}
                    onShare={setSharing}/>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch size={15}/></span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar notas..."
                 className="w-full pl-9 pr-3 h-9 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"/>
        </div>
        <SegTabs value={view} onChange={setView} items={[
          { value: 'ativas',     label: 'Ativas' },
          { value: 'favoritas',  label: 'Favoritas' },
          { value: 'arquivadas', label: 'Arquivadas' },
        ]}/>
        <Btn size="sm" className="sm:ml-auto" icon={<IconPlus size={14}/>}
             onClick={() => { setEditing(null); setModalOpen(true); }}>Nova nota</Btn>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={<IconNote size={26}/>} title="Nenhuma nota por aqui."
                    subtitle="Crie sua primeira nota — ideias, lembretes, rascunhos. Tudo privado por padrão."
                    action={<Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => { setEditing(null); setModalOpen(true); }}>Criar nota</Btn>}/>
      ) : (
        <>
          {fixadas.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                <IconPaperclip size={12}/> Fixadas
              </p>
              {grid(fixadas)}
            </div>
          )}
          {outras.length > 0 && (
            <div>
              {fixadas.length > 0 && <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 mt-6">Outras</p>}
              {grid(outras)}
            </div>
          )}
        </>
      )}

      <WsNoteModal note={editing} open={modalOpen} onClose={() => setModalOpen(false)} profile={profile}/>
      <WsShareModal open={!!sharing} onClose={() => setSharing(null)} tipo="note" recurso={sharing} profile={profile}/>
    </div>
  );
};

// ---------- PROJETOS (kanban) ----------

const WsTaskCard = ({ task, canEdit, onDragStart, dragging, colIndex, onMove }) => (
  <div
    draggable={canEdit}
    onDragStart={canEdit ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(task.id); } : undefined}
    className={`group/task bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 shadow-card text-sm text-gray-800 dark:text-gray-200
                ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging ? 'opacity-40' : ''} transition-shadow hover:shadow-pop`}>
    <div className="flex items-start gap-2">
      <span className="flex-1 break-words leading-snug">{task.titulo}</span>
      {canEdit && (
        <button onClick={() => { if (confirmAction('Excluir tarefa?')) api.deleteWsTask(task.id); }}
                className="opacity-0 group-hover/task:opacity-100 p-1 -m-1 rounded text-gray-400 hover:text-rose-600 transition-opacity shrink-0">
          <IconTrash size={12}/>
        </button>
      )}
    </div>
    {canEdit && (
      <div className="flex sm:hidden gap-1 mt-2">
        {colIndex > 0 && (
          <button onClick={() => onMove(task, -1)} className="flex-1 h-7 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">←</button>
        )}
        {colIndex < WS_TASK_COLS.length - 1 && (
          <button onClick={() => onMove(task, 1)} className="flex-1 h-7 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">→</button>
        )}
      </div>
    )}
  </div>
);

const WsBoard = ({ project, profile, onBack }) => {
  const store = useStore();
  const canEdit = wsCanEdit(project, 'project', profile);
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [adding, setAdding] = React.useState(null); // status da coluna com input aberto
  const [novoTitulo, setNovoTitulo] = React.useState('');
  const [sharing, setSharing] = React.useState(false);

  const tasks = store.wsTasks.filter(t => t.project_id === project.id);

  const dropTo = (status) => {
    setDragOver(null);
    if (!draggingId) return;
    const t = tasks.find(x => x.id === draggingId);
    setDraggingId(null);
    if (!t || t.status === status) return;
    const ordem = tasks.filter(x => x.status === status).length;
    api.updateWsTask(t.id, { status, ordem });
  };

  const moveTask = (task, dir) => {
    const idx = WS_TASK_COLS.findIndex(c => c.status === task.status);
    const next = WS_TASK_COLS[idx + dir];
    if (next) api.updateWsTask(task.id, { status: next.status });
  };

  const addTask = async (status) => {
    const titulo = novoTitulo.trim();
    if (!titulo) { setAdding(null); return; }
    setNovoTitulo('');
    await api.createWsTask({ project_id: project.id, titulo, status }, profile);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Voltar">
          <IconArrowLeft size={16}/>
        </button>
        <span className={`w-2.5 h-2.5 rounded-full ${WS_PROJECT_COLORS[project.cor] || 'bg-emerald-500'}`}/>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{project.nome}</h3>
          {project.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.descricao}</p>}
        </div>
        {project.user_id === profile.id && (
          <Btn size="sm" kind="secondary" icon={<IconShare size={13}/>} onClick={() => setSharing(true)}>Compartilhar</Btn>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {WS_TASK_COLS.map((col, ci) => {
          const items = tasks.filter(t => t.status === col.status).sort((a, b) => a.ordem - b.ordem || a.id - b.id);
          return (
            <div key={col.status}
                 onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
                 onDragLeave={() => setDragOver(d => d === col.status ? null : d)}
                 onDrop={(e) => { e.preventDefault(); dropTo(col.status); }}
                 className={`rounded-xl border p-2.5 min-h-[180px] transition-colors
                   ${dragOver === col.status ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-950/30' : 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40'}`}>
              <div className="flex items-center gap-2 px-1 pb-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`}/>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{col.label}</span>
                <span className="ml-auto text-[10px] text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(t => (
                  <WsTaskCard key={t.id} task={t} canEdit={canEdit} colIndex={ci} onMove={moveTask}
                              dragging={draggingId === t.id} onDragStart={setDraggingId}/>
                ))}
              </div>
              {canEdit && (adding === col.status ? (
                <div className="mt-2">
                  <input autoFocus value={novoTitulo}
                         onChange={e => setNovoTitulo(e.target.value)}
                         onKeyDown={e => { if (e.key === 'Enter') addTask(col.status); if (e.key === 'Escape') { setAdding(null); setNovoTitulo(''); } }}
                         onBlur={() => addTask(col.status)}
                         placeholder="Título da tarefa..."
                         className="w-full px-2.5 h-9 text-sm rounded-lg bg-white dark:bg-gray-800 border border-brand-300 dark:border-brand-700 text-gray-900 dark:text-gray-100 focus:outline-none"/>
                </div>
              ) : (
                <button onClick={() => { setAdding(col.status); setNovoTitulo(''); }}
                        className="mt-2 w-full h-8 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1 transition-colors">
                  <IconPlus size={12}/> Adicionar
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <WsShareModal open={sharing} onClose={() => setSharing(false)} tipo="project" recurso={project} profile={profile}/>
    </div>
  );
};

const WsProjectsTab = ({ profile }) => {
  const store = useStore();
  const [openId, setOpenId] = React.useState(null);
  const [modal, setModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [cor, setCor] = React.useState('emerald');

  const openProject = store.wsProjects.find(p => p.id === openId);
  if (openProject) return <WsBoard project={openProject} profile={profile} onBack={() => setOpenId(null)}/>;

  const openModal = (p) => {
    setEditing(p || null);
    setNome(p?.nome || '');
    setDescricao(p?.descricao || '');
    setCor(p?.cor || 'emerald');
    setModal(true);
  };

  const save = async () => {
    if (!nome.trim()) return;
    if (editing) await api.updateWsProject(editing.id, { nome, descricao, cor });
    else {
      const row = await api.createWsProject({ nome, descricao, cor }, profile);
      if (row) toast('Projeto criado.');
    }
    setModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Organize tarefas em quadros simples — arraste entre colunas.</p>
        <Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => openModal(null)}>Novo projeto</Btn>
      </div>

      {store.wsProjects.length === 0 ? (
        <EmptyState icon={<IconColumns size={26}/>} title="Nenhum projeto ainda."
                    subtitle="Crie um projeto para organizar tarefas em Backlog, Em andamento, Aguardando e Concluído."
                    action={<Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => openModal(null)}>Criar projeto</Btn>}/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.wsProjects.map(p => {
            const tasks = store.wsTasks.filter(t => t.project_id === p.id);
            const done = tasks.filter(t => t.status === 'concluido').length;
            const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
            const isMine = p.user_id === profile.id;
            return (
              <div key={p.id} onClick={() => setOpenId(p.id)}
                   className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${WS_PROJECT_COLORS[p.cor] || 'bg-emerald-500'}`}/>
                  <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.nome}</span>
                  {!isMine && <Badge tone="blue">de {wsOwnerName(store, p.user_id)}</Badge>}
                  {isMine && (
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openModal(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><IconPencil size={13}/></button>
                      <button onClick={() => { if (confirmAction('Excluir projeto e todas as tarefas?')) api.deleteWsProject(p.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"><IconTrash size={13}/></button>
                    </div>
                  )}
                </div>
                {p.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{p.descricao}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }}/>
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums">{done}/{tasks.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar projeto' : 'Novo projeto'} size="sm"
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Object.entries(WS_PROJECT_COLORS).map(([k, cls]) => (
                <button key={k} onClick={() => setCor(k)}
                        className={`w-6 h-6 rounded-full ${cls} border-2 transition-transform ${cor === k ? 'scale-110 border-gray-500 dark:border-gray-300' : 'border-transparent hover:scale-105'}`}/>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn kind="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={save} disabled={!nome.trim()}>Salvar</Btn>
            </div>
          </div>
        }>
        <div className="space-y-3">
          <div>
            <Label required>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Campanha de vacinação" autoFocus/>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Opcional"/>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ---------- FLUXOGRAMAS ----------

const WS_NODE_W = 150, WS_NODE_H = 46;

const WsFlowEditor = ({ flow, profile, onBack }) => {
  const canEdit = wsCanEdit(flow, 'flow', profile);
  const [nodes, setNodes] = React.useState(() => (flow.dados?.nodes || []));
  const [edges, setEdges] = React.useState(() => (flow.dados?.edges || []));
  const [selected, setSelected] = React.useState(null);   // node id
  const [connectFrom, setConnectFrom] = React.useState(null);
  const [sharing, setSharing] = React.useState(false);
  const svgRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const saveTimer = React.useRef(null);

  const scheduleSave = (n, e) => {
    if (!canEdit) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateFlow(flow.id, { dados: { nodes: n, edges: e } });
    }, 700);
  };
  React.useEffect(() => () => clearTimeout(saveTimer.current), []);

  const svgPoint = (evt) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  };

  const addNode = (tipo) => {
    const id = 'n' + Date.now();
    const n = [...nodes, { id, tipo, label: tipo === 'inicio' ? 'Início' : tipo === 'fim' ? 'Fim' : tipo === 'decisao' ? 'Decisão?' : 'Nova etapa',
                           x: 60 + (nodes.length % 4) * 180, y: 50 + Math.floor(nodes.length / 4) * 100 }];
    setNodes(n); setSelected(id); scheduleSave(n, edges);
  };

  const renameSelected = (label) => {
    const n = nodes.map(x => x.id === selected ? { ...x, label } : x);
    setNodes(n); scheduleSave(n, edges);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const n = nodes.filter(x => x.id !== selected);
    const e = edges.filter(x => x.from !== selected && x.to !== selected);
    setNodes(n); setEdges(e); setSelected(null); scheduleSave(n, e);
  };

  const onNodePointerDown = (evt, node) => {
    evt.stopPropagation();
    if (!canEdit) { setSelected(node.id); return; }
    if (connectFrom) {
      if (connectFrom === 'pick') { setConnectFrom(node.id); setSelected(node.id); return; }
      if (connectFrom !== node.id && !edges.some(x => x.from === connectFrom && x.to === node.id)) {
        const e = [...edges, { from: connectFrom, to: node.id }];
        setEdges(e); scheduleSave(nodes, e);
      }
      setConnectFrom(null);
      return;
    }
    setSelected(node.id);
    const p = svgPoint(evt);
    dragRef.current = { id: node.id, dx: p.x - node.x, dy: p.y - node.y, moved: false };
    svgRef.current.setPointerCapture?.(evt.pointerId);
  };

  const onPointerMove = (evt) => {
    const d = dragRef.current;
    if (!d) return;
    const p = svgPoint(evt);
    d.moved = true;
    setNodes(ns => ns.map(x => x.id === d.id
      ? { ...x, x: Math.max(10, p.x - d.dx), y: Math.max(10, p.y - d.dy) }
      : x));
  };

  const onPointerUp = () => {
    if (dragRef.current?.moved) {
      setNodes(ns => { scheduleSave(ns, edges); return ns; });
    }
    dragRef.current = null;
  };

  const removeEdge = (i) => {
    if (!canEdit) return;
    const e = edges.filter((_, idx) => idx !== i);
    setEdges(e); scheduleSave(nodes, e);
  };

  const center = (n) => ({ cx: n.x + WS_NODE_W / 2, cy: n.y + WS_NODE_H / 2 });
  const selNode = nodes.find(n => n.id === selected);

  const renderNode = (n) => {
    const sel = selected === n.id;
    const isConnSrc = connectFrom === n.id;
    const base = `cursor-pointer ${canEdit ? '' : 'cursor-default'}`;
    const stroke = isConnSrc ? '#f59e0b' : sel ? '#059669' : 'rgba(100,116,139,.45)';
    const sw = sel || isConnSrc ? 2 : 1.25;
    const fill = { inicio: '#d1fae5', fim: '#ffe4e6', decisao: '#fef3c7', etapa: '#ffffff' }[n.tipo] || '#ffffff';
    const darkFill = { inicio: '#064e3b', fim: '#4c1d2e', decisao: '#453a16', etapa: '#1f2937' }[n.tipo] || '#1f2937';
    const isDark = document.documentElement.classList.contains('dark');
    const f = isDark ? darkFill : fill;
    return (
      <g key={n.id} onPointerDown={(e) => onNodePointerDown(e, n)} className={base}>
        {n.tipo === 'decisao' ? (
          <polygon points={`${n.x + WS_NODE_W/2},${n.y - 6} ${n.x + WS_NODE_W + 10},${n.y + WS_NODE_H/2} ${n.x + WS_NODE_W/2},${n.y + WS_NODE_H + 6} ${n.x - 10},${n.y + WS_NODE_H/2}`}
                   fill={f} stroke={stroke} strokeWidth={sw}/>
        ) : (
          <rect x={n.x} y={n.y} width={WS_NODE_W} height={WS_NODE_H}
                rx={n.tipo === 'inicio' || n.tipo === 'fim' ? 23 : 10}
                fill={f} stroke={stroke} strokeWidth={sw}/>
        )}
        <text x={n.x + WS_NODE_W/2} y={n.y + WS_NODE_H/2 + 4} textAnchor="middle"
              className="select-none pointer-events-none"
              style={{ fontSize: 12, fontWeight: 600, fill: isDark ? '#e5e7eb' : '#1f2937' }}>
          {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Voltar">
          <IconArrowLeft size={16}/>
        </button>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate">{flow.nome}</h3>
        {flow.user_id === profile.id && (
          <Btn size="sm" kind="secondary" icon={<IconShare size={13}/>} onClick={() => setSharing(true)}>Compartilhar</Btn>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          <Btn size="sm" kind="secondary" icon={<IconPlus size={13}/>} onClick={() => addNode('etapa')}>Etapa</Btn>
          <Btn size="sm" kind="secondary" onClick={() => addNode('inicio')}>Início</Btn>
          <Btn size="sm" kind="secondary" onClick={() => addNode('decisao')}>Decisão</Btn>
          <Btn size="sm" kind="secondary" onClick={() => addNode('fim')}>Fim</Btn>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"/>
          <Btn size="sm" kind={connectFrom ? 'primary' : 'secondary'}
               onClick={() => setConnectFrom(connectFrom ? null : (selected || 'pick'))}
               title="Clique em um bloco de origem e depois no destino">
            {connectFrom ? 'Clique no destino...' : 'Conectar'}
          </Btn>
          {selNode && (
            <>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"/>
              <input value={selNode.label} onChange={e => renameSelected(e.target.value)}
                     className="px-2.5 h-8 w-44 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"/>
              <button onClick={deleteSelected} className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Excluir bloco">
                <IconTrash size={14}/>
              </button>
            </>
          )}
          <span className="text-[11px] text-gray-400 ml-auto hidden sm:block">Arraste blocos · "Conectar" liga etapas · alterações salvam sozinhas</span>
        </div>
      )}

      <div className="ws-canvas rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto bg-white dark:bg-gray-900">
        <svg ref={svgRef} width="1200" height="640"
             onPointerMove={onPointerMove} onPointerUp={onPointerUp}
             onPointerDown={() => { setSelected(null); if (connectFrom === 'pick') setConnectFrom(null); }}>
          <defs>
            <marker id="ws-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#94a3b8"/>
            </marker>
          </defs>
          {edges.map((e, i) => {
            const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            const ca = center(a), cb = center(b);
            return (
              <g key={i} onPointerDown={(evt) => { evt.stopPropagation(); if (canEdit && confirmAction('Remover esta conexão?')) removeEdge(i); }}
                 className={canEdit ? 'cursor-pointer' : ''}>
                <line x1={ca.cx} y1={ca.cy} x2={cb.cx} y2={cb.cy} stroke="transparent" strokeWidth="12"/>
                <line x1={ca.cx} y1={ca.cy} x2={cb.cx} y2={cb.cy} stroke="#94a3b8" strokeWidth="1.75" markerEnd="url(#ws-arrow)"/>
              </g>
            );
          })}
          {nodes.map(renderNode)}
          {nodes.length === 0 && (
            <text x="600" y="300" textAnchor="middle" style={{ fontSize: 13, fill: '#9ca3af' }}>
              {canEdit ? 'Adicione blocos com os botões acima e arraste para organizar.' : 'Fluxo vazio.'}
            </text>
          )}
        </svg>
      </div>

      <WsShareModal open={sharing} onClose={() => setSharing(false)} tipo="flow" recurso={flow} profile={profile}/>
    </div>
  );
};

const WsFlowsTab = ({ profile }) => {
  const store = useStore();
  const [openId, setOpenId] = React.useState(null);

  const openFlow = store.wsFlows.find(f => f.id === openId);
  if (openFlow) return <WsFlowEditor key={openFlow.id} flow={openFlow} profile={profile} onBack={() => setOpenId(null)}/>;

  const create = async () => {
    const nome = window.prompt('Nome do fluxo:', 'Novo fluxo');
    if (!nome?.trim()) return;
    const row = await api.createFlow(nome.trim(), profile);
    if (row) setOpenId(row.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Desenhe processos simples — autorização, financeiro, atendimento.</p>
        <Btn size="sm" icon={<IconPlus size={14}/>} onClick={create}>Novo fluxo</Btn>
      </div>

      {store.wsFlows.length === 0 ? (
        <EmptyState icon={<IconFlow size={26}/>} title="Nenhum fluxograma ainda."
                    subtitle="Crie um fluxo, adicione etapas e conecte-as. Simples como desenhar no papel."
                    action={<Btn size="sm" icon={<IconPlus size={14}/>} onClick={create}>Criar fluxo</Btn>}/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.wsFlows.map(f => {
            const isMine = f.user_id === profile.id;
            const nNodes = (f.dados?.nodes || []).length;
            return (
              <div key={f.id} onClick={() => setOpenId(f.id)}
                   className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <IconFlow size={16}/>
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{f.nome}</span>
                  {!isMine && <Badge tone="blue">de {wsOwnerName(store, f.user_id)}</Badge>}
                  {isMine && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirmAction('Excluir fluxo?')) api.deleteFlow(f.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity">
                      <IconTrash size={13}/>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">{nNodes} {nNodes === 1 ? 'bloco' : 'blocos'} · {timeAgo(f.atualizado_em)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- CONHECIMENTO ----------

const WsKnowledgeTab = ({ profile }) => {
  const store = useStore();
  const [catFilter, setCatFilter] = React.useState(null);
  const [modal, setModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [sharing, setSharing] = React.useState(null);
  const [titulo, setTitulo] = React.useState('');
  const [categoria, setCategoria] = React.useState('');
  const [conteudo, setConteudo] = React.useState('');

  const cats = [...new Set(store.wsKnowledge.map(k => k.categoria))].sort();
  const cards = catFilter ? store.wsKnowledge.filter(k => k.categoria === catFilter) : store.wsKnowledge;

  const openModal = (k) => {
    setEditing(k || null);
    setTitulo(k?.titulo || '');
    setCategoria(k?.categoria || '');
    setConteudo(k?.conteudo || '');
    setModal(true);
  };

  const save = async () => {
    if (!titulo.trim()) return;
    const data = { titulo: titulo.trim(), categoria: categoria.trim() || 'Geral', conteudo };
    if (editing) await api.updateKnowledge(editing.id, data);
    else { await api.createKnowledge(data, profile); toast('Card criado.'); }
    setModal(false);
  };

  const readOnly = editing && !wsCanEdit(editing, 'knowledge', profile);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button onClick={() => setCatFilter(null)}
                  className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${!catFilter ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
            Todas
          </button>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c === catFilter ? null : c)}
                    className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${catFilter === c ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              {c}
            </button>
          ))}
        </div>
        <Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => openModal(null)}>Novo card</Btn>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon={<IconBook size={26}/>} title="Nenhum card de conhecimento."
                    subtitle="Guarde procedimentos, checklists e aprendizados organizados por categoria."
                    action={<Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => openModal(null)}>Criar card</Btn>}/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(k => {
            const isMine = k.user_id === profile.id;
            return (
              <div key={k.id} onClick={() => openModal(k)}
                   className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Badge tone="violet" className="mb-2">{k.categoria}</Badge>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{k.titulo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 whitespace-pre-wrap">{k.conteudo}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {isMine && (
                      <button onClick={() => setSharing(k)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" title="Compartilhar">
                        <IconShare size={13}/>
                      </button>
                    )}
                    {isMine && (
                      <button onClick={() => { if (confirmAction('Excluir card?')) api.deleteKnowledge(k.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Excluir">
                        <IconTrash size={13}/>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                  {!isMine ? `de ${wsOwnerName(store, k.user_id)}` : timeAgo(k.atualizado_em)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={readOnly ? 'Card compartilhado' : (editing ? 'Editar card' : 'Novo card')} size="lg"
        footer={!readOnly && (
          <div className="flex justify-end gap-2">
            <Btn kind="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={!titulo.trim()}>Salvar</Btn>
          </div>
        )}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Título</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Como emitir autorização" disabled={readOnly} autoFocus/>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex.: Procedimentos" list="ws-cats" disabled={readOnly}/>
              <datalist id="ws-cats">{cats.map(c => <option key={c} value={c}/>)}</datalist>
            </div>
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea rows={10} value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="Procedimento, checklist, aprendizado..." disabled={readOnly}/>
          </div>
        </div>
      </Modal>

      <WsShareModal open={!!sharing} onClose={() => setSharing(null)} tipo="knowledge" recurso={sharing} profile={profile}/>
    </div>
  );
};

// ---------- página ----------

const Workspace = ({ profile }) => {
  const store = useStore();
  const [tab, setTab] = React.useState('notas');
  const [status, setStatus] = React.useState(store.wsLoaded ? 'ok' : 'loading');

  React.useEffect(() => {
    if (store.wsLoaded) { setStatus('ok'); return; }
    api.loadWorkspace().then(ok => setStatus(ok ? 'ok' : 'setup'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Spinner size={22}/>
      </div>
    );
  }

  if (status === 'setup') {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <EmptyState icon={<IconNote size={26}/>} title="Workspace ainda não configurado"
                    subtitle="As tabelas do Workspace Pessoal não existem no banco. Rode o arquivo migrations/migration_workspace.sql no SQL Editor do Supabase e recarregue a página."
                    action={<Btn size="sm" onClick={() => window.location.reload()} icon={<IconRotateCcw size={14}/>}>Recarregar</Btn>}/>
      </div>
    );
  }

  const counts = {
    notas:        store.wsNotes.filter(n => !n.arquivada).length,
    projetos:     store.wsProjects.length,
    fluxos:       store.wsFlows.length,
    conhecimento: store.wsKnowledge.length,
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Meu Workspace</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Seu espaço pessoal — tudo privado por padrão. Compartilhe quando quiser.</p>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <SegTabs value={tab} onChange={setTab} items={[
            { value: 'notas',        label: 'Notas',        count: counts.notas },
            { value: 'projetos',     label: 'Projetos',     count: counts.projetos },
            { value: 'fluxos',       label: 'Fluxos',       count: counts.fluxos },
            { value: 'conhecimento', label: 'Conhecimento', count: counts.conhecimento },
          ]}/>
        </div>
      </div>

      <div className="ns-fade-in" key={tab}>
        {tab === 'notas'        && <WsNotesTab profile={profile}/>}
        {tab === 'projetos'     && <WsProjectsTab profile={profile}/>}
        {tab === 'fluxos'       && <WsFlowsTab profile={profile}/>}
        {tab === 'conhecimento' && <WsKnowledgeTab profile={profile}/>}
      </div>
    </div>
  );
};

Object.assign(window, { Workspace });
