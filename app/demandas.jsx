// Demandas — table view + modal with edit history.

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
             <div className="flex items-center justify-between">
               {editing ? (
                 <SegTabs value={tab} onChange={setTab} items={[
                   { value: 'detalhes', label: 'Detalhes' },
                   { value: 'anexos', label: 'Anexos', count: anexos.length },
                   { value: 'comentarios', label: 'Comentários', count: comentarios.length }
                 ]} />
               ) : <div/>}
               <div className="flex items-center gap-2">
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
                <span className="text-gray-400"><IconHistory size={14}/></span>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Histórico</h4>
                <span className="text-[11px] text-gray-400">{historico.length} {historico.length === 1 ? 'alteração' : 'alterações'}</span>
              </div>
              {historico.length === 0 ? (
                <div className="text-xs text-gray-500 italic px-3 py-4 bg-gray-50 rounded-lg border border-gray-100">
                  Nenhuma alteração registrada ainda.
                </div>
              ) : (
                <ol className="relative border-l border-gray-200 ml-2 pl-5 space-y-3 max-h-56 overflow-y-auto pr-2">
                  {historico.map(h => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-500" />
                      <div className="text-xs text-gray-700">
                        <span className="font-medium text-gray-900">{h.campo}</span> alterado de{' '}
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-mono text-[11px]">{h.valor_antigo || '—'}</span>{' '}
                        para{' '}
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-mono text-[11px]">{h.valor_novo || '—'}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">por {h.editado_por} · {timeAgo(h.criado_em)}</div>
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
            <h4 className="text-sm font-semibold text-gray-900">Anexos ({anexos.length})</h4>
            <Btn size="sm" icon={<IconPlus size={14}/>} onClick={() => uploadRef.current?.click()}>Enviar Arquivo</Btn>
            <input type="file" className="hidden" ref={uploadRef} onChange={handleUpload} />
          </div>
          {anexos.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 border border-gray-100 border-dashed rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 mx-auto shadow-sm mb-3">
                <IconInbox size={20}/>
              </div>
              <p className="text-sm text-gray-600 font-medium">Nenhum arquivo anexado</p>
              <p className="text-xs text-gray-400 mt-1">Envie PDFs, imagens ou documentos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anexos.map(a => {
                const u = store.profiles.find(p => p.id === a.autor_id);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1 hover:text-brand-600">
                      <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center shrink-0">
                        <IconMenu size={14} className="text-gray-400"/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600">{a.nome_arquivo}</p>
                        <p className="text-[11px] text-gray-500">Enviado por {u?.nome || 'Desconhecido'} · {timeAgo(a.criado_em)}</p>
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
                <p className="text-sm text-gray-500 italic">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
              </div>
            ) : (
              comentarios.map(c => {
                const u = store.profiles.find(p => p.id === c.autor_id);
                const isMe = c.autor_id === profile.id;
                return (
                  <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar name={u?.nome || '?'} src={u?.avatar} size={28}/>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className="text-[11px] text-gray-500 mb-1">{u?.nome?.split(' ')[0]} · {timeAgo(c.criado_em)}</span>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
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
                    <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                      {mentionSuggestions.map(u => (
                        <button
                          key={u.id}
                          onMouseDown={e => { e.preventDefault(); insertMention(u.nome); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-brand-50 text-left transition-colors"
                        >
                          <Avatar name={u.nome} src={u.avatar} size={24}/>
                          <span className="font-medium text-gray-800">{u.nome}</span>
                          <span className="text-xs text-gray-400 ml-auto">{u.role === 'gestor' ? 'Gestor' : 'Funcionário'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none pr-12"
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

  const [tab, setTab] = React.useState('todas');
  const [q, setQ] = React.useState('');
  const [dq, setDq] = React.useState('');
  const [page, setPage] = React.useState(1);
  const PER = 10;
  const [modal, setModal] = React.useState({ open: false, editing: null });

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDq(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);
  React.useEffect(() => { setPage(1); }, [tab, dq]);

  const visible = isGestor ? store.demandas : store.demandas.filter(d => d.responsavel_id === profile.id);
  const counts = {
    todas:          visible.length,
    'aberta':       visible.filter(d => d.status === 'aberta').length,
    'em-andamento': visible.filter(d => d.status === 'em-andamento').length,
    'concluida':    visible.filter(d => d.status === 'concluida').length,
    'cancelada':    visible.filter(d => d.status === 'cancelada').length,
  };
  const filtered = visible
    .filter(d => tab === 'todas' || d.status === tab)
    .filter(d => !dq || d.titulo.toLowerCase().includes(dq) || (d.responsavel || '').toLowerCase().includes(dq))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageItems = filtered.slice((page - 1) * PER, page * PER);

  const onDelete = (d) => {
    if (!confirmAction(`Excluir a demanda "${d.titulo}"?`)) return;
    api.deleteDemanda(d.id);
    toast('Demanda excluída.', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Demandas"
        subtitle={isGestor ? 'Acompanhe todas as demandas atribuídas à equipe.' : 'Demandas atribuídas a você.'}
        right={isGestor && (
          <Btn icon={<IconPlus size={16}/>} onClick={() => setModal({ open: true, editing: null })}>
            Nova Demanda
          </Btn>
        )}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <SegTabs value={tab} onChange={setTab} items={[
            { value: 'todas',        label: 'Todas',        count: counts.todas },
            { value: 'aberta',       label: 'Abertas',      count: counts['aberta'] },
            { value: 'em-andamento', label: 'Em andamento', count: counts['em-andamento'] },
            { value: 'concluida',    label: 'Concluídas',   count: counts['concluida'] },
            { value: 'cancelada',    label: 'Canceladas',   count: counts['cancelada'] },
          ]}/>
          <div className="ml-auto relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch size={14}/></span>
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou responsável..."
              className="bg-white border border-gray-300 rounded-lg pl-9 pr-3 h-9 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState title="Nenhuma demanda encontrada." subtitle="Ajuste os filtros ou crie uma nova demanda."
                      action={isGestor ? <Btn icon={<IconPlus size={14}/>} onClick={() => setModal({ open: true, editing: null })}>Nova demanda</Btn> : null}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/60">
                  <th className="px-5 py-2.5 w-[40%]">Título</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Responsável</th>
                  <th className="px-3 py-2.5">Criado por</th>
                  <th className="px-3 py-2.5">Prazo</th>
                  <th className="px-3 py-2.5 text-right pr-5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map(d => {
                  const overdue = isOverdue(d.prazo, d.status, 'concluida') && d.status !== 'cancelada';
                  const user = store.profiles.find(x => x.id === d.responsavel_id);
                  const respName = user ? user.nome : d.responsavel;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/70 cursor-pointer transition-colors group"
                        onClick={() => setModal({ open: true, editing: d })}>
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">{d.titulo}</span>
                              {d.urgente && <Badge tone="red" icon={<IconBolt size={10}/>}>Urgente</Badge>}
                            </div>
                            {d.descricao && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{d.descricao}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadgeDem status={d.status}/></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={respName} src={user?.avatar} size={22}/>
                          <span className="text-gray-700">{respName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{d.criado_por}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : 'text-gray-700'}`}>
                          {overdue && <IconAlert size={12}/>}
                          {formatDate(d.prazo)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right pr-5">
                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, editing: d }); }}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Editar">
                            <IconPencil size={14}/>
                          </button>
                          {isGestor && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(d); }}
                                    className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50" title="Excluir">
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
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Mostrando {(page - 1) * PER + 1}–{Math.min(page * PER, filtered.length)} de {filtered.length}</span>
            <div className="flex items-center gap-1.5">
              <Btn kind="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Btn>
              <span className="px-2 tabular-nums">Página {page} de {totalPages}</span>
              <Btn kind="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Btn>
            </div>
          </div>
        )}
      </div>

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
