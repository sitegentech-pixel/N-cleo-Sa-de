// Perfil — tela de perfil pessoal do usuário logado.

const Perfil = ({ profile, onBack }) => {
  const store = useStore();

  const [nome, setNome] = React.useState(profile.nome);
  const [saving, setSaving] = React.useState(false);

  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmSenha, setConfirmSenha] = React.useState('');
  const [savingPwd, setSavingPwd] = React.useState(false);

  const roleLabel = profile.role === 'gestor' ? 'Gestor' : 'Colaborador';
  const roleTone  = profile.role === 'gestor' ? 'violet' : 'green';

  const handleSaveNome = async () => {
    if (!nome.trim()) { toast('Nome não pode estar vazio.', 'error'); return; }
    setSaving(true);
    try {
      await api.upsertProfile({ id: profile.id, nome: nome.trim() });
      toast('Nome atualizado.');
    } catch (_) {}
    setSaving(false);
  };

  const handleChangePwd = async () => {
    if (novaSenha.length < 6) { toast('Senha deve ter mínimo 6 caracteres.', 'error'); return; }
    if (novaSenha !== confirmSenha) { toast('Senhas não coincidem.', 'error'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) { toast('Erro ao alterar senha: ' + error.message, 'error'); }
    else { toast('Senha alterada com sucesso.'); setNovaSenha(''); setConfirmSenha(''); }
    setSavingPwd(false);
  };

  const myPend = store.pendencias.filter(p =>
    p.responsavel_id === profile.id || p.responsavel === profile.nome
  );
  const pendCounts = {
    nao: myPend.filter(p => p.status === 'nao-concluido').length,
    and: myPend.filter(p => p.status === 'em-andamento').length,
    ok:  myPend.filter(p => p.status === 'concluido').length,
  };

  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const myDem30 = store.demandas.filter(d =>
    (d.responsavel_id === profile.id || d.responsavel === profile.nome) &&
    new Date(d.created_at) >= thirtyAgo
  );
  const demCounts = {
    abertas:    myDem30.filter(d => d.status === 'aberta' || d.status === 'em-andamento').length,
    concluidas: myDem30.filter(d => d.status === 'concluida').length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <Icon size={16}><path d="m15 18-6-6 6-6"/></Icon>
        Voltar
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4 flex items-center gap-5">
        <Avatar name={profile.nome} src={profile.avatar} size={80} />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{profile.nome}</h1>
          <div className="mt-1.5">
            <Badge tone={roleTone}>{roleLabel}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 truncate">{profile.email}</p>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Dados Pessoais</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="pf-nome">Nome</Label>
            <Input
              id="pf-nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              onKeyDown={e => e.key === 'Enter' && handleSaveNome()}
            />
          </div>
          <div>
            <Label htmlFor="pf-email">E-mail</Label>
            <Input
              id="pf-email"
              value={profile.email || ''}
              readOnly
              disabled
            />
          </div>
          <div className="pt-1">
            <Btn onClick={handleSaveNome} disabled={saving} isLoading={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Btn>
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Avatar</h2>
        {window.AvatarUpload ? (
          <AvatarUpload profile={profile} size={72} />
        ) : (
          <div className="flex items-center gap-4">
            <Avatar name={profile.nome} src={profile.avatar} size={72} />
            <div>
              <div className="text-sm font-medium text-gray-900">Foto de perfil</div>
              <div className="text-xs text-gray-500 mt-0.5">PNG ou JPG, até 1,5 MB.</div>
              <input
                type="file"
                accept="image/*"
                className="mt-2 text-xs text-gray-600"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1.5 * 1024 * 1024) { toast('Imagem muito grande (máx 1.5MB).', 'error'); return; }
                  const reader = new FileReader();
                  reader.onload = () => { api.setProfileAvatar(profile.id, reader.result); toast('Foto atualizada.'); };
                  reader.readAsDataURL(file);
                  e.target.value = null;
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Segurança</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="pf-pwd">Nova senha</Label>
            <Input
              id="pf-pwd"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <Label htmlFor="pf-pwd2">Confirmar senha</Label>
            <Input
              id="pf-pwd2"
              type="password"
              value={confirmSenha}
              onChange={e => setConfirmSenha(e.target.value)}
              placeholder="Repita a nova senha"
              onKeyDown={e => e.key === 'Enter' && handleChangePwd()}
            />
          </div>
          <div className="pt-1">
            <Btn onClick={handleChangePwd} disabled={savingPwd} isLoading={savingPwd}>
              {savingPwd ? 'Alterando...' : 'Alterar Senha'}
            </Btn>
          </div>
        </div>
      </div>

      {/* Minha Atividade */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Minha Atividade</h2>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pendências</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Não concluído', count: pendCounts.nao, color: 'text-rose-600',    bg: 'bg-rose-50'    },
                { label: 'Em andamento',  count: pendCounts.and, color: 'text-amber-600',   bg: 'bg-amber-50'   },
                { label: 'Concluído',     count: pendCounts.ok,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className={`${bg} rounded-lg px-3 py-3 text-center`}>
                  <div className={`text-2xl font-bold tabular-nums ${color}`}>{count}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Demandas — últimos 30 dias</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Abertas',    count: demCounts.abertas,    color: 'text-sky-600',     bg: 'bg-sky-50'     },
                { label: 'Concluídas', count: demCounts.concluidas, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className={`${bg} rounded-lg px-3 py-3 text-center`}>
                  <div className={`text-2xl font-bold tabular-nums ${color}`}>{count}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Perfil });
