// Pendências — Kanban with native HTML5 drag and drop, plus modal CRUD.
// Mobile (<768px): snap-scroll columns + move buttons replace drag.

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const STATUS_ORDER = ['nao-concluido', 'em-andamento', 'concluido'];

const LabelChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all
      ${onClick ? 'cursor-pointer' : 'cursor-default'}
      ${active === undefined ? '' : active ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
    style={{
      backgroundColor: label.cor + '22',
      color: label.cor,
      border: active ? `1.5px solid ${label.cor}` : `1.5px solid transparent`,
    }}
  >
    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: label.cor }}></span>
    {label.nome}
  </button>
);

const PendenciaCard = ({ p, onEdit, onArchive, canArchive, onDragStart, onDragEnd, dragging, isMobile, colIndex, onMove }) => {
  const store = useStore();
  const overdue = isOverdue(p.prazo, p.status, 'concluido');
  const user = store.profiles.find(x => x.id === p.responsavel_id);
  const respName = user ? user.nome : p.responsavel;
  const checklistItems = (store.checklistItems || []).filter(c => c.pendencia_id === p.id);
  const checklistDone  = checklistItems.filter(c => c.concluido).length;
  const checklistPct   = checklistItems.length ? (checklistDone / checklistItems.length) * 100 : 0;
  const cardLabels = (_state.pendenciasLabels || [])
    .filter(pl => pl.pendencia_id === p.id)
    .map(pl => (_state.labels || []).find(l => l.id === pl.label_id))
    .filter(Boolean);

  return (
    <div
      data-pendencia-id={p.id}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(p.id); }}
      onDragEnd={onDragEnd}
      className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-card hover:shadow-pop hover:border-gray-300 dark:hover:border-gray-600 transition cursor-grab active:cursor-grabbing
                  ${dragging ? 'ns-dragging' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className={isMobile ? 'hidden' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 mt-0.5 shrink-0'}>
          <IconDrag size={14}/>
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{p.titulo}</div>
            {p.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
          </div>
          {p.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.descricao}</p>}
          {cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cardLabels.map(l => <LabelChip key={l.id} label={l} />)}
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar name={respName} src={user?.avatar} size={20}/>
              <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{respName}</span>
            </div>
            <div className={`text-[11px] inline-flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {overdue ? <IconAlert size={11}/> : <IconCal size={11}/>}
              {formatDate(p.prazo)}
            </div>
          </div>
        </div>
      </div>
      {checklistItems.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
              {checklistDone}/{checklistItems.length} concluídos
            </span>
            {checklistPct === 100 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Tudo feito</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${checklistPct}%`,
                background: checklistPct === 100
                  ? 'var(--color-emerald-500, #10b981)'
                  : 'var(--color-brand-500, #6366f1)',
              }}
            />
          </div>
        </div>
      )}
      {isMobile ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => onMove(p, -1)}
            disabled={colIndex === 0}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40"
          >
            ← Voltar
          </button>
          <button
            onClick={() => onMove(p, 1)}
            disabled={colIndex === STATUS_ORDER.length - 1}
            className="flex-1 bg-brand-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40"
          >
            Avançar →
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(p)}
                  className="ml-auto p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Editar">
            <IconPencil size={14}/>
          </button>
          {canArchive && (
            <button onClick={() => onArchive(p)}
                    className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    title="Arquivar">
              <IconArchive size={14}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const STATUS_LABEL = { 'nao-concluido': 'Não concluído', 'em-andamento': 'Em andamento', 'concluido': 'Concluído' };

const ArchivedPendenciaCard = ({ p, onRestore, onDelete, isGestor }) => {
  const store = useStore();
  const user = store.profiles.find(x => x.id === p.responsavel_id);
  const respName = user ? user.nome : (p.responsavel || '—');
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{p.titulo}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2 mt-0.5">
          <span>{respName}</span>
          <span>·</span>
          <span>{STATUS_LABEL[p.status] || p.status}</span>
          {p.prazo && <><span>·</span><span>{formatDate(p.prazo)}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onRestore(p)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-lg transition"
        >
          <IconRotateCcw size={12}/>
          Restaurar
        </button>
        {isGestor && (
          <button
            onClick={() => onDelete(p)}
            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
            title="Excluir permanentemente"
          >
            <IconTrash size={14}/>
          </button>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, label, headerColor, headerDot, items, onDropTo, onDragOver, isOver, isMobile, colIndex, onMove, ...handlers }) => (
  <div
    onDragOver={(e) => { e.preventDefault(); onDragOver(status); }}
    onDragLeave={() => onDragOver(null)}
    onDrop={(e) => { e.preventDefault(); onDropTo(status, e); }}
    className={`flex flex-col bg-gray-50/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl min-h-[200px]
      ${isMobile ? 'min-w-[85vw] snap-start' : ''}
      ${isOver ? 'ns-drag-over' : ''}`}
  >
    <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full ${headerDot}`}></span>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 rounded-md tabular-nums">{items.length}</span>
    </div>
    <div className="px-3 pb-3 space-y-2 flex-1 overflow-y-auto">
      {items.length === 0
        ? <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl mx-1">
            {isMobile ? 'Vazio' : 'Solte cards aqui'}
          </div>
        : items.map(p => (
            <PendenciaCard key={p.id} p={p} isMobile={isMobile} colIndex={colIndex} onMove={onMove} {...handlers}/>
          ))}
    </div>
  </div>
);

const PendenciaModal = ({ open, onClose, editing, profile, onSaved }) => {
  const store = useStore();
  const isGestor = profile.role === 'gestor';
  const activeUsers = store.profiles.filter(p => p.ativo);

  const [form, setForm] = React.useState(() => ({
    titulo: '', descricao: '', responsavel: profile.nome, responsavel_id: profile.id, prazo: '', urgente: false, status: 'nao-concluido',
  }));
  const [errors, setErrors] = React.useState({});
  const [newChecklistText, setNewChecklistText] = React.useState('');
  const checklistItems = editing
    ? (store.checklistItems || [])
        .filter(c => c.pendencia_id === editing.id)
        .sort((a, b) => a.ordem - b.ordem || new Date(a.criado_em) - new Date(b.criado_em))
    : [];
  const checklistDone = checklistItems.filter(i => i.concluido).length;

  const handleAddChecklistItem = async () => {
    const text = newChecklistText.trim();
    if (!text || !editing) return;
    setNewChecklistText('');
    await api.addChecklistItem(editing.id, text);
  };

  React.useEffect(() => {
    if (open) {
      setErrors({});
      if (editing) {
        setForm({
          titulo: editing.titulo || '',
          descricao: editing.descricao || '',
          responsavel: editing.responsavel || profile.nome,
          responsavel_id: editing.responsavel_id || profile.id,
          prazo: editing.prazo ? editing.prazo.slice(0, 10) : '',
          urgente: !!editing.urgente,
          status: editing.status || 'nao-concluido',
        });
      } else {
        setForm({
          titulo: '', descricao: '',
          responsavel: profile.nome,
          responsavel_id: profile.id,
          prazo: '', urgente: false, status: 'nao-concluido',
        });
      }
    }
  }, [open, editing, profile.nome]);

  const submit = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Informe o título.';
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = {
      ...form,
      prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
    };
    if (editing) {
      const wasNotDone = editing.status !== 'concluido';
      api.updatePendencia(editing.id, payload);
      toast('Pendência atualizada.');
      if (payload.status === 'concluido' && wasNotDone) {
        celebrate({ message: 'Pendência concluída!' });
      }
    } else {
      api.createPendencia(payload, profile);
      toast('Pendência criada.');
    }
    onSaved?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}
           title={editing ? 'Editar pendência' : 'Nova pendência'}
           subtitle={editing ? 'Atualize os dados abaixo.' : 'Adicione uma tarefa ao seu kanban.'}
           footer={
             <div className="flex items-center justify-end gap-2">
               <Btn kind="secondary" onClick={onClose}>Cancelar</Btn>
               <Btn kind="primary" onClick={submit}>{editing ? 'Salvar alterações' : 'Criar pendência'}</Btn>
             </div>
           }>
      <div className="space-y-4">
        <div>
          <Label required>Título</Label>
          <Input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                 placeholder="O que precisa ser feito?" error={errors.titulo} />
          <FieldError>{errors.titulo}</FieldError>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Detalhes opcionais..."/>
        </div>
        {editing && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Checklist</Label>
              {checklistItems.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {checklistDone}/{checklistItems.length}
                </span>
              )}
            </div>
            {checklistItems.length > 0 && (
              <div className="space-y-0.5 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {checklistItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2 group/item hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => api.toggleChecklistItem(item.id)}
                      className="w-4 h-4 shrink-0 rounded border-gray-300 dark:border-gray-600 accent-brand-600 cursor-pointer"
                    />
                    <span className={`flex-1 text-sm select-none ${item.concluido ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.texto}
                    </span>
                    <button
                      onClick={() => api.deleteChecklistItem(item.id)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      title="Remover item"
                    >
                      <IconTrash size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Adicionar item ao checklist..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
              />
              <Btn kind="secondary" onClick={handleAddChecklistItem} disabled={!newChecklistText.trim()}>
                <IconPlus size={14}/>
              </Btn>
            </div>
          </div>
        )}
        {editing && (store.labels || []).length > 0 && (
          <div>
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(store.labels || []).map(l => {
                const active = (store.pendenciasLabels || []).some(
                  pl => pl.pendencia_id === editing.id && pl.label_id === l.id
                );
                return (
                  <LabelChip
                    key={l.id}
                    label={l}
                    active={active}
                    onClick={() => api.togglePendenciaLabel(editing.id, l.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Responsável</Label>
            {isGestor ? (
              <Select value={form.responsavel_id} onChange={(e) => {
                const u = activeUsers.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, responsavel_id: u.id, responsavel: u.nome }));
              }}>
                {activeUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
            ) : (
              <Input value={form.responsavel} disabled />
            )}
          </div>
          <div>
            <Label>Prazo</Label>
            <Input type="date" value={form.prazo} onChange={(e) => setForm(f => ({ ...f, prazo: e.target.value }))}/>
          </div>
        </div>
        {editing && (
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="nao-concluido">Não concluído</option>
              <option value="em-andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
            </Select>
          </div>
        )}
        <Checkbox checked={form.urgente} onChange={(v) => setForm(f => ({ ...f, urgente: v }))}
                  label="Marcar como urgente" hint="Itens urgentes recebem destaque vermelho na lista."/>
      </div>
    </Modal>
  );
};

const Pendencias = ({ profile, filterByResponsavel }) => {
  const store = useStore();
  const isGestor = profile.role === 'gestor';
  const isMobile = useIsMobile();

  const [responsavelFilter, setResponsavelFilter] = React.useState(filterByResponsavel || 'todos');
  const [labelFilter, setLabelFilter] = React.useState('');
  const [showArquivadas, setShowArquivadas] = React.useState(false);
  const [modal, setModal] = React.useState({ open: false, editing: null });
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [activeCol, setActiveCol] = React.useState(0);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { setResponsavelFilter(filterByResponsavel || 'todos'); }, [filterByResponsavel]);

  React.useEffect(() => {
    const handleNew = () => setModal({ open: true, editing: null });
    window.addEventListener('ns-open-new-pendencia', handleNew);
    return () => window.removeEventListener('ns-open-new-pendencia', handleNew);
  }, []);

  const all = isGestor
    ? store.pendencias.filter(p => !p.arquivado)
    : store.pendencias.filter(p => p.responsavel_id === profile.id && !p.arquivado);
  const byResp = (isGestor && responsavelFilter !== 'todos')
    ? all.filter(p => p.responsavel_id === responsavelFilter)
    : all;
  const filtered = labelFilter
    ? byResp.filter(p => (store.pendenciasLabels || []).some(
        pl => pl.pendencia_id === p.id && pl.label_id === labelFilter
      ))
    : byResp;

  const arquivadas = isGestor
    ? store.pendencias.filter(p => p.arquivado)
    : store.pendencias.filter(p => p.responsavel_id === profile.id && p.arquivado);

  const cols = [
    { status: 'nao-concluido', label: 'Não Concluído', headerDot: 'bg-rose-500' },
    { status: 'em-andamento',  label: 'Em Andamento',   headerDot: 'bg-amber-400' },
    { status: 'concluido',     label: 'Concluído',      headerDot: 'bg-emerald-500' },
  ];

  const onDropTo = (newStatus, e) => {
    setDragOver(null);
    const dragId = draggingId;
    if (dragId == null) return;
    setDraggingId(null);
    const p = store.pendencias.find(x => x.id === dragId);
    if (!p) return;

    if (p.status === newStatus) {
      const colEl = e.currentTarget;
      const cards = Array.from(colEl.querySelectorAll('[data-pendencia-id]'));
      const mouseY = e.clientY;
      const colItems = filtered
        .filter(x => x.status === newStatus)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || new Date(b.updated_at) - new Date(a.updated_at));
      const dragOrigIdx = colItems.findIndex(x => x.id === dragId);

      let insertIdx = colItems.length;
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (mouseY < rect.top + rect.height / 2) { insertIdx = i; break; }
      }

      const adjustedInsert = insertIdx > dragOrigIdx ? insertIdx - 1 : insertIdx;
      if (adjustedInsert === dragOrigIdx) return;

      const newOrder = colItems.filter(x => x.id !== dragId);
      newOrder.splice(adjustedInsert, 0, p);
      newOrder.forEach((item, idx) => {
        if ((item.ordem ?? 0) !== idx) api.reorderPendencia(item.id, idx);
      });
      return;
    }

    const prevStatus = p.status;
    api.updatePendencia(p.id, { status: newStatus });
    toast(`Movido para "${cols.find(c => c.status === newStatus).label}".`);
    if (newStatus === 'concluido' && prevStatus !== 'concluido') {
      celebrate({ message: 'Pendência concluída!' });
    }
  };

  const onMoveCard = (p, direction) => {
    const idx = STATUS_ORDER.indexOf(p.status);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return;
    const newStatus = STATUS_ORDER[newIdx];
    const prevStatus = p.status;
    api.updatePendencia(p.id, { status: newStatus });
    toast(`Movido para "${cols.find(c => c.status === newStatus).label}".`);
    if (newStatus === 'concluido' && prevStatus !== 'concluido') {
      celebrate({ message: 'Pendência concluída!' });
    }
  };

  const onArchive = (p) => {
    if (!confirmAction(`Arquivar a pendência "${p.titulo}"?`)) return;
    api.archivarPendencia(p.id);
    toast('Pendência arquivada.', 'info');
  };

  const onRestore = (p) => {
    api.restaurarPendencia(p.id);
    toast('Pendência restaurada.');
  };

  const onDeletePermanent = (p) => {
    if (!confirmAction(`Excluir permanentemente "${p.titulo}"? Esta ação não pode ser desfeita.`)) return;
    api.deletePendencia(p.id);
    toast('Pendência excluída permanentemente.', 'info');
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
        title="Minhas pendências"
        subtitle={isGestor ? 'Quadro de tarefas de toda a equipe.' : 'Suas tarefas, organizadas por status.'}
        right={
          <div className="flex items-center gap-2 flex-wrap">
            {isGestor && !showArquivadas && (
              <Select value={responsavelFilter} onChange={(e) => setResponsavelFilter(e.target.value)}>
                <option value="todos">Todos os responsáveis</option>
                {store.profiles.filter(u => u.ativo).map(u =>
                  <option key={u.id} value={u.id}>{u.nome}</option>
                )}
              </Select>
            )}
            {(store.labels || []).length > 0 && !showArquivadas && (
              <Select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
                <option value="">Todas as etiquetas</option>
                {(store.labels || []).map(l =>
                  <option key={l.id} value={l.id}>{l.nome}</option>
                )}
              </Select>
            )}
            <button
              onClick={() => setShowArquivadas(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition
                ${showArquivadas
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <IconArchive size={14}/>
              Arquivadas
              {arquivadas.length > 0 && (
                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full tabular-nums">
                  {arquivadas.length}
                </span>
              )}
            </button>
            {!showArquivadas && (
              <Btn icon={<IconPlus size={16}/>} onClick={() => setModal({ open: true, editing: null })}>
                Nova Pendência
              </Btn>
            )}
          </div>
        }
      />

      {showArquivadas ? (
        <div className="space-y-2">
          {arquivadas.length === 0 ? (
            <div className="text-center text-sm text-gray-400 dark:text-gray-600 py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              Nenhuma pendência arquivada.
            </div>
          ) : (
            arquivadas.map(p => (
              <ArchivedPendenciaCard
                key={p.id}
                p={p}
                onRestore={onRestore}
                onDelete={onDeletePermanent}
                isGestor={isGestor}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div
            ref={isMobile ? scrollRef : null}
            onScroll={isMobile ? onScroll : undefined}
            className={isMobile
              ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4'
              : 'grid grid-cols-3 gap-4'}
          >
            {cols.map((c, i) => (
              <KanbanColumn
                key={c.status}
                status={c.status}
                label={c.label}
                headerDot={c.headerDot}
                items={filtered.filter(p => p.status === c.status)
                               .sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0) || new Date(b.updated_at) - new Date(a.updated_at))}
                onDragOver={setDragOver}
                isOver={dragOver === c.status}
                onDropTo={onDropTo}
                onEdit={(p) => setModal({ open: true, editing: p })}
                onArchive={onArchive}
                canArchive={true}
                onDragStart={setDraggingId}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                dragging={false}
                isMobile={isMobile}
                colIndex={i}
                onMove={onMoveCard}
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

      <PendenciaModal
        open={modal.open}
        editing={modal.editing}
        profile={profile}
        onClose={() => setModal({ open: false, editing: null })}
      />
    </div>
  );
};

Object.assign(window, { Pendencias });
