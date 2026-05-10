// Usuarios (gestor only) — table, create, edit, toggle ativo.

const UsuarioModal = ({ open, onClose, editing, profile }) => {
  const store = useStore();
  const isSelf = editing && editing.id === profile.id;

  const blank = { nome: '', email: '', senha: '', role: 'funcionario', ativo: true };
  const [form, setForm] = React.useState(blank);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setErrors({});
      setLoading(false);
      setForm(editing ? {
        nome: editing.nome, email: editing.email, senha: '',
        role: editing.role, ativo: editing.ativo,
      } : blank);
    }
  }, [open, editing]);

  const submit = async () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome.';
    if (!form.email.trim()) e.email = 'Informe o e-mail.';
    if (!editing) {
      if (!form.senha || form.senha.length < 6) e.senha = 'Mínimo 6 caracteres.';
      if (store.profiles.some(p => p.email.toLowerCase() === form.email.trim().toLowerCase()))
        e.email = 'E-mail já cadastrado.';
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);

    if (editing) {
      await api.upsertProfile({
        id:   editing.id,
        nome: form.nome,
        role: isSelf ? editing.role : form.role,
        ativo: form.ativo,
        email: editing.email,
      });
      toast('Usuário atualizado.');
      setLoading(false);
      onClose();
    } else {
      // Save current gestor session before signUp (signUp auto-logs into new account)
      const { data: { session: gestorSession } } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.senha,
        options:  { data: { nome: form.nome.trim() } },
      });

      // Always restore gestor session first, regardless of error
      if (gestorSession) {
        await supabase.auth.setSession({
          access_token:  gestorSession.access_token,
          refresh_token: gestorSession.refresh_token,
        });
      }

      if (authError) {
        let msg = authError.message;
        if (msg.includes('rate limit')) msg = 'Limite de envios atingido. Desative "Confirm Email" no Dashboard do Supabase (Auth -> Providers -> Email).';
        if (msg.includes('already registered')) msg = 'Este e-mail já está cadastrado no sistema.';
        if (msg.includes('signups are disabled')) msg = 'O cadastro por e-mail está desativado no Dashboard do Supabase. Ative "Enable Email Provider".';
        setErrors({ email: msg });
        setLoading(false);
        return;
      }

      // Wait for trigger to create profile row before updating role/nome
      if (authData.user) {
        await new Promise(r => setTimeout(r, 1500));
        await supabase.from('profiles')
          .update({ role: form.role, nome: form.nome.trim() })
          .eq('id', authData.user.id);
      }

      await loadAll();
      toast('Usuário cadastrado com sucesso.');
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}
           title={editing ? 'Editar usuário' : 'Novo usuário'}
           subtitle={editing ? 'Atualize cargo e status.' : 'Cadastre um novo cooperado no sistema.'}
           footer={
             <div className="flex items-center justify-end gap-2">
               <Btn kind="secondary" onClick={onClose} disabled={loading}>Cancelar</Btn>
               <Btn kind="primary" onClick={submit} isLoading={loading}>
                 {editing ? 'Salvar' : 'Cadastrar'}
               </Btn>
             </div>
           }>
      <div className="space-y-4">
        {editing && <AvatarUpload profile={editing}/>}
        <div>
          <Label required>Nome</Label>
          <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                 error={errors.nome} placeholder="Nome completo"/>
          <FieldError>{errors.nome}</FieldError>
        </div>
        <div>
          <Label required>E-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                 error={errors.email} placeholder="usuario@nucleosaude.coop.br" disabled={!!editing}/>
          <FieldError>{errors.email}</FieldError>
        </div>
        {!editing && (
          <div>
            <Label required>Senha provisória</Label>
            <Input type="password" value={form.senha} onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
                   error={errors.senha} placeholder="mín. 6 caracteres"/>
            <FieldError>{errors.senha}</FieldError>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cargo</Label>
            {isSelf ? (
              <Input value={editing.role === 'gestor' ? 'Gestor' : 'Funcionário'} disabled />
            ) : (
              <Select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="funcionario">Funcionário</option>
                <option value="gestor">Gestor</option>
              </Select>
            )}
            {isSelf && <p className="text-[11px] text-gray-500 mt-1">Você não pode alterar seu próprio cargo.</p>}
          </div>
          {editing && (
            <div className="flex items-end pb-1">
              <Checkbox checked={form.ativo} onChange={(v) => setForm(f => ({ ...f, ativo: v }))}
                        label="Usuário ativo" hint="Desativar bloqueia o login."/>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const Usuarios = ({ profile }) => {
  const store = useStore();
  const [modal, setModal] = React.useState({ open: false, editing: null });
  const [q, setQ] = React.useState('');

  const filtered = store.profiles
    .filter(u => !q || u.nome.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const toggleActive = (u) => {
    if (u.id === profile.id && u.ativo) {
      toast('Você não pode desativar a si mesmo.', 'error');
      return;
    }
    if (!confirmAction(`${u.ativo ? 'Desativar' : 'Ativar'} o usuário ${u.nome}?`)) return;
    api.toggleProfileActive(u.id);
    toast(u.ativo ? 'Usuário desativado.' : 'Usuário ativado.');
  };

  const deleteUser = (u) => {
    if (u.id === profile.id) {
      toast('Você não pode excluir a si mesmo.', 'error');
      return;
    }
    if (!confirmAction(`Deseja realmente EXCLUIR permanentemente o usuário ${u.nome}? Esta ação não pode ser desfeita.`)) return;
    api.deleteProfile(u.id);
    toast('Usuário excluído da lista.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PageHeader
        title="Usuários"
        subtitle="Gerencie cooperados, cargos e acessos do sistema."
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch size={14}/></span>
              <input value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="Buscar por nome ou e-mail..."
                     className="bg-white border border-gray-300 rounded-lg pl-9 pr-3 h-10 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500" />
            </div>
            <Btn icon={<IconPlus size={16}/>} onClick={() => setModal({ open: true, editing: null })}>
              Novo usuário
            </Btn>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/60">
              <th className="px-5 py-2.5">Nome</th>
              <th className="px-3 py-2.5">E-mail</th>
              <th className="px-3 py-2.5">Cargo</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right pr-5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/70 transition-colors group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.nome} src={u.avatar} size={28}/>
                    <span className="font-medium text-gray-900">{u.nome}</span>
                    {u.id === profile.id && <Badge tone="blue">Você</Badge>}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-600">{u.email}</td>
                <td className="px-3 py-3">
                  <Badge tone={u.role === 'gestor' ? 'green' : 'gray'}>
                    {u.role === 'gestor' ? 'Gestor' : 'Funcionário'}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.ativo ? 'text-emerald-700' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right pr-5">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => setModal({ open: true, editing: u })}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Editar">
                      <IconPencil size={14}/>
                    </button>
                    <button onClick={() => toggleActive(u)}
                            className={`px-2 h-7 rounded-md text-[11px] font-medium transition-colors
                              ${u.ativo
                                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                : 'text-emerald-700 hover:bg-emerald-50'}`}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    {u.id !== profile.id && (
                      <button onClick={() => deleteUser(u)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" title="Excluir">
                        <IconTrash size={14}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Nenhum usuário encontrado." />}
      </div>

      <UsuarioModal
        open={modal.open}
        editing={modal.editing}
        profile={profile}
        onClose={() => setModal({ open: false, editing: null })}
      />
    </div>
  );
};

Object.assign(window, { Usuarios });
