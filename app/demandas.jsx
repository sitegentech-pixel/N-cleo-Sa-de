// Demandas — table view + modal with edit history.

// useIsMobile is defined in pendencias.jsx (loaded before this file) and shared as
// a global. Re-declaring it here throws "already declared" and aborts this script.

const DemandaCard = ({ d, onEdit, onDelete, canDelete, onDragStart, onDragEnd, dragging, isMobile, colIndex, onMove, isGestor }) => {
  const store = useStore();
  const overdue = isOverdue(d.prazo, d.status, 'concluida') && d.status !== 'cancelada';
  const user = store.profiles.find(x => x.id === d.responsavel_id);
  const respName = user ? user.nome : d.responsavel;

  return (
    <div
      data-demanda-id={d.id}
      draggable={isGestor}
      onDragStart={isGestor ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(d.id); } : undefined}
      onDragEnd={isGestor ? onDragEnd : undefined}
      onClick={() => onEdit(d)}
      className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-card hover:shadow-pop hover:border-gray-300 dark:hover:border-gray-600 transition cursor-pointer active:cursor-grabbing
                  ${dragging ? 'opacity-50 border-brand-500' : ''}`}
    >
      <div className="flex items-start gap-2">
        {isGestor && !isMobile && (
          <span className="text-gray-300 dark:text-gray-650 group-hover:text-gray-400 dark:group-hover:text-gray-500 mt-0.5 shrink-0 cursor-grab active:cursor-grabbing">
            <IconDrag size={14}/>
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{d.titulo}</div>
            {d.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
          </div>
          {d.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{d.descricao}</p>}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar name={respName} src={user?.avatar} size={20}/>
              <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{respName}</span>
            </div>
            <div className={`text-[11px] inline-flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {overdue ? <IconAlert size={11}/> : <IconCal size={11}/>}
              {formatDate(d.prazo)}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">
              Criado por {d.criado_por}
            </span>
          </div>
        </div>
      </div>

      {isMobile && isGestor ? (
        <div className="mt-2.5 pt-2.5 border-t border-gray-150 dark:border-gray-750 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onMove(d, -1)}
            disabled={colIndex === 0}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40"
          >
            ← Voltar
          </button>
          <button
            onClick={() => onMove(d, 1)}
            disabled={colIndex === 3}
            className="flex-1 bg-brand-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40"
          >
            Avançar →
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(d)}
                  className="ml-auto p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Editar">
            <IconPencil size={14}/>
          </button>
          {canDelete && (
            <button onClick={() => onDelete(d)}
                    className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Excluir">
              <IconTrash size={14}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const DemandaKanbanColumn = ({ status, label, headerDot, items, onDropTo, onDragOver, isOver, isMobile, colIndex, onMove, draggingId, ...handlers }) => (
  <div
    onDragOver={(e) => { e.preventDefault(); onDragOver(status); }}
    onDragLeave={() => onDragOver(null)}
    onDrop={(e) => { e.preventDefault(); onDropTo(status, e); }}
    className={`flex flex-col bg-gray-50/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl min-h-[200px]
      ${isMobile ? 'min-w-[85vw] snap-start' : ''}
      ${isOver ? 'bg-gray-100/80 dark:bg-gray-800/40 border-dashed border-brand-500' : ''}`}
  >
    <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full ${headerDot}`}></span>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 rounded-md tabular-nums">{items.length}</span>
    </div>
    <div className="px-3 pb-3 space-y-2 flex-1 overflow-y-auto">
      {items.length === 0
        ? <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl mx-1">
            {isMobile ? 'Vazio' : 'Solte demandas aqui'}
          </div>
        : items.map(d => (
            <DemandaCard key={d.id} d={d} isMobile={isMobile} colIndex={colIndex} onMove={onMove} dragging={draggingId === d.id} {...handlers}/>
          ))}
    </div>
  </div>
);

const DemandaModal = ({ open, onClose, editing, profile }) => {
  const store = useStore();
  const isGestor = profile.role === 'gestor';
  const activeUsers = store.profiles.filter(p => p.ativo);

  const blank = {
    titulo: '', descricao: '', responsavel: activeUsers[0]?.nome || profile.nome,
    responsavel_id: activeUsers[0]?.id || profile.id,
    prazo: '', urgente: false, status: 'aberta',
  };
  const [form, setForm] = React.useState(blank);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (open) {
      setErrors({});
      if (editing) {
        setForm({
          titulo: editing.titulo || '',
          descricao: editing.descricao || '',
          responsavel: editing.responsavel || '',
          responsavel_id: editing.responsavel_id || '',
          prazo: editing.prazo ? editing.prazo.slice(0, 10) : '',
          urgente: !!editing.urgente,
          status: editing.status || 'aberta',
        });
      } else {
        setForm(blank);
      }
    }
  }, [open, editing]);

  const submit = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Informe o título.';
    if (!form.responsavel) e.responsavel = 'Selecione um responsável.';
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { ...form, prazo: form.prazo ? new Date(form.prazo).toISOString() : null };
    if (editing) {
      const wasNotDone = editing.status !== 'concluida';
      api.updateDemanda(editing.id, payload, profile);
      toast('Demanda atualizada.');
      if (payload.status === 'concluida' && wasNotDone) {
        celebrate({ message: 'Demanda concluída!' });
      }
    } else {
      api.createDemanda(payload, profile);
      toast('Demanda criada.');
    }
    onClose();
  };

  const [tab, setTab] = React.useState('detalhes');
  const [novoComentario, setNovoComentario] = React.useState('');
  const uploadRef = React.useRef(null);
  const historico = editing ? api.listHistorico(editing.id) : [];
  const comentarios = editing ? api.listComentarios(editing.id) : [];
  const anexos = editing ? api.listAnexos(editing.id) : [];
  // Funcionários têm responsável readonly (não editam) — gestor edita tudo
  const responsavelReadonly = !!editing && !isGestor;

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Arquivo muito grande (máx 5MB).', 'error'); return; }
    api.createAnexo(editing.id, file, profile);
    e.target.value = null;
  };

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;
    await api.createComentario(editing.id, novoComentario, profile);
    setNovoComentario('');
  };

  return (
    <Modal open={open} onClose={onClose}
           size="lg"
           title={editing ? 'Editar demanda' : 'Nova demanda'}
           subtitle={editing ? `#${editing.id} · criado por ${editing.criado_por}` : 'Preencha os dados e atribua a um cooperado.'}
           footer={
             <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
               {editing ? (
                 <SegTabs value={tab} onChange={setTab} items={[
                   { value: 'detalhes', label: 'Detalhes' },
                   { value: 'anexos', label: 'Anexos', count: anexos.length },
                   { value: 'comentarios', label: 'Comentários', count: comentarios.length }
                 ]} />
               ) : <div/>}
               <div className="flex items-center justify-end gap-2">
                 <Btn kind="secondary" onClick={onClose}>Cancelar</Btn>
                 <Btn kind="primary" onClick={submit}>{editing ? 'Salvar alterações' : 'Criar demanda'}</Btn>
               </div>
             </div>
           }>
      {(!editing || tab === 'detalhes') && (
        <div className="space-y-4">
          <div>
            <Label required>Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                   placeholder="Resumo claro da demanda" error={errors.titulo}
                   disabled={!isGestor && editing} />
            <FieldError>{errors.titulo}</FieldError>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={4} value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Contexto, links, observações..."/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Responsável</Label>
              {responsavelReadonly ? (
                <Input value={form.responsavel} disabled />
              ) : (
                <Select value={form.responsavel_id} onChange={(e) => {
                  const u = activeUsers.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, responsavel_id: u.id, responsavel: u.nome }));
                }} error={errors.responsavel}>
                  <option value="" disabled>Selecione...</option>
                  {activeUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </Select>
              )}
              <FieldError>{errors.responsavel}</FieldError>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={form.prazo} onChange={(e) => setForm(f => ({ ...f, prazo: e.target.value }))}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="aberta">Aberta</option>
                <option value="em-andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <Checkbox checked={form.urgente} onChange={(v) => setForm(f => ({ ...f, urgente: v }))}
                        label="Marcar como urgente"/>
            </div>
          </div>

          {editing && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-400 dark:text-gray-500"><IconHistory size={14}/></span>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Histórico</h4>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{historico.length} {historico.length === 1 ? 'alteração' : 'alterações'}</span>
              </div>
              {historico.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic px-3 py-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-800">
                  Nenhuma alteração registrada ainda.
                </div>
              ) : (
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 pl-5 space-y-3 max-h-56 overflow-y-auto pr-2">
                  {historico.map(h => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-brand-500" />
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{h.campo}</span> alterado de{' '}
                        <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded font-mono text-[11px]">{h.valor_antigo || '—'}</span>{' '}
                        para{' '}
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-mono text-[11px]">{h.valor_novo || '—'}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">por {h.editado_por} · {timeAgo(h.criado_em)}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      {editing && tab === 'anexos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Anexos ({anexos.length})</h4>
            <Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => uploadRef.current?.click()}>Enviar Arquivo</Btn>
            <input type="file" className="hidden" ref={uploadRef} onChange={handleUpload} />
          </div>
          {anexos.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 border-dashed rounded-xl">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto shadow-sm mb-3">
                <IconInbox size={20}/>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Nenhum arquivo anexado</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Envie PDFs, imagens ou documentos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anexos.map(a => {
                const u = store.profiles.find(p => p.id === a.autor_id);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg group">
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1 hover:text-brand-600 dark:hover:text-brand-400">
                      <div className="w-8 h-8 rounded bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center shrink-0">
                        <IconMenu size={14} className="text-gray-400 dark:text-gray-500"/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">{a.nome_arquivo}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Enviado por {u?.nome || 'Desconhecido'} · {timeAgo(a.criado_em)}</p>
                      </div>
                    </a>
                    {isGestor && (
                      <button onClick={() => { if (confirmAction('Excluir anexo?')) api.deleteAnexo(a); }} className="p-1.5 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconTrash size={14}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {editing && tab === 'comentarios' && (
        <div className="space-y-4 flex flex-col h-[50vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {comentarios.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
              </div>
            ) : (
              comentarios.map(c => {
                const u = store.profiles.find(p => p.id === c.autor_id);
                const isMe = c.autor_id === profile.id;
                return (
                  <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar name={u?.nome || '?'} src={u?.avatar} size={28}/>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{u?.nome?.split(' ')[0]} · {timeAgo(c.criado_em)}</span>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                        {c.texto}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-auto border-t border-gray-100 pt-3 relative">
            {(() => {
              const atMatch = novoComentario.match(/@(\w*)$/);
              const mentionQuery = atMatch ? atMatch[1].toLowerCase() : null;
              const mentionSuggestions = mentionQuery !== null
                ? activeUsers.filter(u => u.nome.toLowerCase().includes(mentionQuery)).slice(0, 5)
                : [];
              const insertMention = (nome) => {
                setNovoComentario(prev => prev.replace(/@\w*$/, `@${nome} `));
              };
              return (
                <>
                  {mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                      {mentionSuggestions.map(u => (
                        <button
                          key={u.id}
                          onMouseDown={e => { e.preventDefault(); insertMention(u.nome); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-gray-700 text-left transition-colors"
                        >
                          <Avatar name={u.nome} src={u.avatar} size={24}/>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{u.nome}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{u.role === 'gestor' ? 'Gestor' : 'Funcionário'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none pr-12"
                    rows={2}
                    placeholder="Adicione um comentário... use @ para mencionar"
                    value={novoComentario}
                    onChange={e => setNovoComentario(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarComentario();
                      }
                    }}
                  />
                  <button
                    onClick={enviarComentario}
                    disabled={!novoComentario.trim()}
                    className="absolute right-3 bottom-5 p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <IconChevRight size={18} />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Modal>
  );
};

const Demandas = ({ profile }) => {
  const store = useStore();
  const isGestor = profile.role === 'gestor';
  const isMobile = useIsMobile();
  const activeUsers = store.profiles.filter(p => p.ativo);

  const [view, setView] = React.useState('tabela');
  const [tab, setTab] = React.useState('todas');
  const [q, setQ] = React.useState('');
  const [dq, setDq] = React.useState('');
  const [page, setPage] = React.useState(1);
  const PER = 10;
  const [modal, setModal] = React.useState({ open: false, editing: null });

  // Novas states de filtros
  const [responsavelFilter, setResponsavelFilter] = React.useState('todos');
  const [escopoFilter, setEscopoFilter] = React.useState('todas');
  const [urgenciaFilter, setUrgenciaFilter] = React.useState('todos');

  // Drag and drop states
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [activeCol, setActiveCol] = React.useState(0);
  const scrollRef = React.useRef(null);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDq(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // reset pagination
  React.useEffect(() => { setPage(1); }, [tab, dq, responsavelFilter, escopoFilter, urgenciaFilter, view]);

  const visible = isGestor ? store.demandas : store.demandas.filter(d => d.responsavel_id === profile.id);

  // Lógica de filtragem com useMemo
  const baseFiltered = React.useMemo(() => {
    return visible
      .filter(d => !dq || d.titulo.toLowerCase().includes(dq) || (d.responsavel || '').toLowerCase().includes(dq))
      .filter(d => {
        if (responsavelFilter === 'todos') return true;
        return d.responsavel_id === responsavelFilter;
      })
      .filter(d => {
        if (escopoFilter === 'todas') return true;
        if (escopoFilter === 'atribuidas') return d.responsavel_id === profile.id;
        if (escopoFilter === 'criadas') return d.criado_por_id === profile.id;
        return true;
      })
      .filter(d => {
        if (urgenciaFilter === 'todos') return true;
        if (urgenciaFilter === 'urgente') return d.urgente;
        if (urgenciaFilter === 'normal') return !d.urgente;
        return true;
      });
  }, [visible, dq, responsavelFilter, escopoFilter, urgenciaFilter, profile.id]);

  const counts = {
    todas:          baseFiltered.length,
    'aberta':       baseFiltered.filter(d => d.status === 'aberta').length,
    'em-andamento': baseFiltered.filter(d => d.status === 'em-andamento').length,
    'concluida':    baseFiltered.filter(d => d.status === 'concluida').length,
    'cancelada':    baseFiltered.filter(d => d.status === 'cancelada').length,
  };

  const filtered = React.useMemo(() => {
    return baseFiltered
      .filter(d => tab === 'todas' || d.status === tab)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [baseFiltered, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageItems = filtered.slice((page - 1) * PER, page * PER);

  const cols = [
    { status: 'aberta',       label: 'Aberta',       headerDot: 'bg-sky-500' },
    { status: 'em-andamento', label: 'Em Andamento', headerDot: 'bg-amber-400' },
    { status: 'concluida',    label: 'Concluída',    headerDot: 'bg-emerald-500' },
    { status: 'cancelada',    label: 'Cancelada',    headerDot: 'bg-gray-400' },
  ];

  const onDropTo = (newStatus, e) => {
    setDragOver(null);
    const dragId = draggingId;
    if (dragId == null) return;
    setDraggingId(null);
    const d = store.demandas.find(x => x.id === dragId);
    if (!d) return;

    if (d.status === newStatus) return;

    const prevStatus = d.status;
    api.updateDemanda(d.id, { status: newStatus }, profile);
    toast(`Movido para "${cols.find(c => c.status === newStatus).label}".`);
    if (newStatus === 'concluida' && prevStatus !== 'concluida') {
      celebrate({ message: 'Demanda concluída!' });
    }
  };

  const STATUS_ORDER = ['aberta', 'em-andamento', 'concluida', 'cancelada'];

  const onMoveCard = (d, direction) => {
    const idx = STATUS_ORDER.indexOf(d.status);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return;
    const newStatus = STATUS_ORDER[newIdx];
    const prevStatus = d.status;
    api.updateDemanda(d.id, { status: newStatus }, profile);
    toast(`Movido para "${cols.find(c => c.status === newStatus).label}".`);
    if (newStatus === 'concluida' && prevStatus !== 'concluida') {
      celebrate({ message: 'Demanda concluída!' });
    }
  };

  const onDelete = (d) => {
    if (!confirmAction(`Excluir a demanda "${d.titulo}"?`)) return;
    api.deleteDemanda(d.id);
    toast('Demanda excluída.', 'info');
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth } = scrollRef.current;
    const segmentWidth = scrollWidth / cols.length;
    setActiveCol(Math.min(Math.round(scrollLeft / segmentWidth), cols.length - 1));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Demandas"
        subtitle={isGestor ? 'Acompanhe todas as demandas atribuídas à equipe.' : 'Demandas atribuídas a você.'}
        right={
          <div className="flex items-center gap-3">
            <div className="inline-flex p-0.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setView('tabela')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'tabela' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'}`}
                title="Visualização em Tabela"
              >
                <IconList size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'}`}
                title="Visualização em Kanban"
              >
                <IconColumns size={16} />
              </button>
            </div>
            {isGestor && (
              <Btn icon={<IconPlus size={16}/>} onClick={() => setModal({ open: true, editing: null })}>
                Nova Demanda
              </Btn>
            )}
          </div>
        }
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          {view === 'tabela' ? (
            <div className="overflow-x-auto -mx-1 px-1 max-w-full">
              <SegTabs value={tab} onChange={setTab} items={[
                { value: 'todas',        label: 'Todas',        count: counts.todas },
                { value: 'aberta',       label: 'Abertas',      count: counts['aberta'] },
                { value: 'em-andamento', label: 'Em andamento', count: counts['em-andamento'] },
                { value: 'concluida',    label: 'Concluídas',   count: counts['concluida'] },
                { value: 'cancelada',    label: 'Canceladas',   count: counts['cancelada'] },
              ]}/>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quadro de Demandas</h3>
          )}
          <div className="ml-auto relative w-full sm:w-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><IconSearch size={14}/></span>
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou responsável..."
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 h-9 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Filtros avançados */}
        <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/10 flex flex-wrap items-center gap-4 text-xs">
          {isGestor && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500 dark:text-gray-400">Responsável:</span>
              <select
                value={responsavelFilter}
                onChange={(e) => setResponsavelFilter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 h-8 text-xs text-gray-800 dark:text-gray-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="todos">Todos</option>
                {activeUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Escopo:</span>
            <select
              value={escopoFilter}
              onChange={(e) => setEscopoFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 h-8 text-xs text-gray-800 dark:text-gray-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="todas">Todas as demandas</option>
              <option value="atribuidas">Atribuídas a mim</option>
              <option value="criadas">Criadas por mim</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Prioridade:</span>
            <select
              value={urgenciaFilter}
              onChange={(e) => setUrgenciaFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 h-8 text-xs text-gray-800 dark:text-gray-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="todos">Todos</option>
              <option value="urgente">Apenas Urgentes</option>
              <option value="normal">Normais</option>
            </select>
          </div>

          {(responsavelFilter !== 'todos' || escopoFilter !== 'todas' || urgenciaFilter !== 'todos') && (
            <button
              onClick={() => {
                setResponsavelFilter('todos');
                setEscopoFilter('todas');
                setUrgenciaFilter('todos');
              }}
              className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors ml-auto text-xs"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {view === 'tabela' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card overflow-hidden">
          {pageItems.length === 0 ? (
            <EmptyState title="Nenhuma demanda encontrada." subtitle="Ajuste os filtros ou crie uma nova demanda."
                        action={isGestor ? <Btn icon={<IconPlus size={14}/>} onClick={() => setModal({ open: true, editing: null })}>Nova demanda</Btn> : null}/>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/40">
                    <th className="px-5 py-2.5 w-[40%]">Título</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Responsável</th>
                    <th className="px-3 py-2.5">Criado por</th>
                    <th className="px-3 py-2.5">Prazo</th>
                    <th className="px-3 py-2.5 text-right pr-5">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {pageItems.map(d => {
                    const overdue = isOverdue(d.prazo, d.status, 'concluida') && d.status !== 'cancelada';
                    const user = store.profiles.find(x => x.id === d.responsavel_id);
                    const respName = user ? user.nome : d.responsavel;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 cursor-pointer transition-colors group"
                          onClick={() => setModal({ open: true, editing: d })}>
                        <td className="px-5 py-3">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{d.titulo}</span>
                                {d.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
                              </div>
                              {d.descricao && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{d.descricao}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3"><StatusBadgeDem status={d.status}/></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={respName} src={user?.avatar} size={22}/>
                            <span className="text-gray-700 dark:text-gray-300">{respName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{d.criado_por}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {overdue && <IconAlert size={12}/>}
                            {formatDate(d.prazo)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right pr-5">
                          <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, editing: d }); }}
                                    className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" title="Editar">
                              <IconPencil size={14}/>
                            </button>
                            {isGestor && (
                              <button onClick={(e) => { e.stopPropagation(); onDelete(d); }}
                                      className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30" title="Excluir">
                                <IconTrash size={14}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > PER && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Mostrando {(page - 1) * PER + 1}–{Math.min(page * PER, filtered.length)} de {filtered.length}</span>
              <div className="flex items-center gap-1.5">
                 <Btn kind="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Btn>
                <span className="px-2 tabular-nums">Página {page} de {totalPages}</span>
                <Btn kind="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Btn>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={isMobile ? scrollRef : null}
            onScroll={isMobile ? onScroll : undefined}
            className={isMobile
              ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4'
              : 'grid grid-cols-4 gap-4'}
          >
            {cols.map((c, i) => (
              <DemandaKanbanColumn
                key={c.status}
                status={c.status}
                label={c.label}
                headerDot={c.headerDot}
                items={baseFiltered.filter(d => d.status === c.status)}
                onDragOver={setDragOver}
                isOver={dragOver === c.status}
                onDropTo={onDropTo}
                onEdit={(d) => setModal({ open: true, editing: d })}
                onDelete={onDelete}
                canDelete={isGestor}
                onDragStart={setDraggingId}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                draggingId={draggingId}
                isMobile={isMobile}
                colIndex={i}
                onMove={onMoveCard}
                isGestor={isGestor}
              />
            ))}
          </div>

          {isMobile && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {cols.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeCol ? 'bg-brand-600 dark:bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <DemandaModal
        open={modal.open}
        editing={modal.editing}
        profile={profile}
        onClose={() => setModal({ open: false, editing: null })}
      />
    </div>
  );
};

Object.assign(window, { Demandas });
