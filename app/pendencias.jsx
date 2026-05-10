// Pendências — Kanban with native HTML5 drag and drop, plus modal CRUD.

const PendenciaCard = ({ p, onEdit, onDelete, canDelete, onDragStart, onDragEnd, dragging }) => {
  const store = useStore();
  const overdue = isOverdue(p.prazo, p.status, 'concluido');
  const user = store.profiles.find(x => x.id === p.responsavel_id);
  const respName = user ? user.nome : p.responsavel;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(p.id); }}
      onDragEnd={onDragEnd}
      className={`group bg-white border border-gray-200 rounded-xl p-3.5 shadow-card hover:shadow-pop hover:border-gray-300 transition cursor-grab active:cursor-grabbing
                  ${dragging ? 'ns-dragging' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-gray-300 group-hover:text-gray-400 mt-0.5 shrink-0"><IconDrag size={14}/></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-gray-900 leading-snug">{p.titulo}</div>
            {p.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
          </div>
          {p.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.descricao}</p>}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar name={respName} src={user?.avatar} size={20}/>
              <span className="text-[11px] text-gray-600 truncate">{respName}</span>
            </div>
            <div className={`text-[11px] inline-flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
              {overdue ? <IconAlert size={11}/> : <IconCal size={11}/>}
              {formatDate(p.prazo)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(p)}
                className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                title="Editar">
          <IconPencil size={14}/>
        </button>
        {canDelete && (
          <button onClick={() => onDelete(p)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Excluir">
            <IconTrash size={14}/>
          </button>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, label, headerColor, headerDot, items, onDropTo, onDragOver, isOver, ...handlers }) => (
  <div
    onDragOver={(e) => { e.preventDefault(); onDragOver(status); }}
    onDragLeave={() => onDragOver(null)}
    onDrop={(e) => { e.preventDefault(); onDropTo(status); }}
    className={`flex flex-col bg-gray-50/60 border border-gray-200 rounded-2xl min-h-[200px] ${isOver ? 'ns-drag-over' : ''}`}
  >
    <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full ${headerDot}`}></span>
      <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
      <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 rounded-md tabular-nums">{items.length}</span>
    </div>
    <div className="px-3 pb-3 space-y-2 flex-1 overflow-y-auto">
      {items.length === 0
        ? <div className="text-center text-xs text-gray-400 py-8 border border-dashed border-gray-200 rounded-xl mx-1">
            Solte cards aqui
          </div>
        : items.map(p => (
            <PendenciaCard key={p.id} p={p} {...handlers}/>
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

  const [responsavelFilter, setResponsavelFilter] = React.useState(filterByResponsavel || 'todos');
  const [modal, setModal] = React.useState({ open: false, editing: null });
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);

  React.useEffect(() => { setResponsavelFilter(filterByResponsavel || 'todos'); }, [filterByResponsavel]);

  React.useEffect(() => {
    const handleNew = () => setModal({ open: true, editing: null });
    window.addEventListener('ns-open-new-pendencia', handleNew);
    return () => window.removeEventListener('ns-open-new-pendencia', handleNew);
  }, []);

  const all = isGestor
    ? store.pendencias
    : store.pendencias.filter(p => p.responsavel_id === profile.id);
  const filtered = (isGestor && responsavelFilter !== 'todos')
    ? all.filter(p => p.responsavel_id === responsavelFilter)
    : all;

  const cols = [
    { status: 'nao-concluido', label: 'Não Concluído', headerDot: 'bg-rose-500' },
    { status: 'em-andamento',  label: 'Em Andamento',   headerDot: 'bg-amber-400' },
    { status: 'concluido',     label: 'Concluído',      headerDot: 'bg-emerald-500' },
  ];

  const onDropTo = (newStatus) => {
    setDragOver(null);
    if (draggingId == null) return;
    const p = store.pendencias.find(x => x.id === draggingId);
    const prevStatus = p?.status;
    setDraggingId(null);
    if (!p || p.status === newStatus) return;
    api.updatePendencia(p.id, { status: newStatus });
    toast(`Movido para "${cols.find(c => c.status === newStatus).label}".`);
    if (newStatus === 'concluido' && prevStatus !== 'concluido') {
      celebrate({ message: 'Pendência concluída!' });
    }
  };

  const onDelete = (p) => {
    if (!confirmAction(`Excluir a pendência "${p.titulo}"?`)) return;
    api.deletePendencia(p.id);
    toast('Pendência excluída.', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Minhas pendências"
        subtitle={isGestor ? 'Quadro de tarefas de toda a equipe.' : 'Suas tarefas, organizadas por status.'}
        right={
          <div className="flex items-center gap-2">
            {isGestor && (
              <Select value={responsavelFilter} onChange={(e) => setResponsavelFilter(e.target.value)}>
                <option value="todos">Todos os responsáveis</option>
                {store.profiles.filter(u => u.ativo).map(u =>
                  <option key={u.id} value={u.id}>{u.nome}</option>
                )}
              </Select>
            )}
            <Btn icon={<IconPlus size={16}/>} onClick={() => setModal({ open: true, editing: null })}>
              Nova Pendência
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map(c => (
          <KanbanColumn
            key={c.status}
            status={c.status}
            label={c.label}
            headerDot={c.headerDot}
            items={filtered.filter(p => p.status === c.status)
                           .sort((a,b) => (b.urgente?1:0) - (a.urgente?1:0) || new Date(b.updated_at) - new Date(a.updated_at))}
            onDragOver={setDragOver}
            isOver={dragOver === c.status}
            onDropTo={onDropTo}
            onEdit={(p) => setModal({ open: true, editing: p })}
            onDelete={onDelete}
            canDelete={isGestor}
            onDragStart={setDraggingId}
            onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
            dragging={false}
          />
        ))}
      </div>

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
