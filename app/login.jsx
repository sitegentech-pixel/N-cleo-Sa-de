// Login screen — gradient bg, brand mark, card with email/password.

const Login = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [info, setInfo] = React.useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null); setInfo(null);
    if (!email.trim()) { setError('Informe um e-mail.'); return; }
    if (!password) { setError('Informe sua senha.'); return; }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError('E-mail ou senha incorretos.');
      return;
    }

    let { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();

    if (!profile) {
      await supabase.from('profiles').upsert({
        id:    data.user.id,
        email: data.user.email,
        nome:  data.user.user_metadata?.nome || data.user.email.split('@')[0],
        role:  'funcionario',
        ativo: true,
      });
      profile = {
        id:    data.user.id,
        email: data.user.email,
        nome:  data.user.email.split('@')[0],
        role:  'funcionario',
        ativo: true,
        avatar: null,
      };
    }

    if (!profile.ativo) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Usuário desativado. Procure um gestor.');
      return;
    }

    profile.avatar = profile.avatar_url || null;
    await loadAll();
    setLoading(false);
    onLogin(profile);
  };

  const reset = async () => {
    setError(null);
    if (!email.trim()) { setError('Informe seu e-mail para redefinir a senha.'); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/reset`,
    });
    if (resetError) setError('Não foi possível enviar o e-mail.');
    else setInfo(`Enviamos um link de redefinição para ${email}.`);
  };

  return (
    <div className="min-h-screen ns-login-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30">
            <IconLogo size={20} />
          </span>
          <span className="text-[22px] font-semibold tracking-tight text-gray-900">Núcleo Saúde</span>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/60 shadow-pop p-7">
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse o painel da cooperativa.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoFocus placeholder="voce@nucleosaude.coop.br"
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">Senha</label>
                <button type="button" onClick={reset} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                  Esqueci minha senha
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••"
                     value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Btn type="submit" className="w-full" isLoading={loading} kind="primary" size="lg">
              {loading ? 'Entrando...' : 'Entrar'}
            </Btn>

            {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
            {info && <p className="text-xs text-emerald-700 text-center">{info}</p>}
          </form>
        </div>


        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <span>Desenvolvido por</span>
          <a href="https://sitegentch.vercel.app/" target="_blank" rel="noopener noreferrer"
             className="font-semibold text-gray-600 hover:text-brand-700 transition-colors">
            Thiago
          </a>
          <span className="text-gray-300">·</span>
          <a href="https://github.com/thiago536" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 text-gray-500 hover:text-brand-700 transition-colors"
             title="GitHub @thiago536">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
            </svg>
            @thiago536
          </a>
        </div>
      </div>
    </div>
  );
};

window.Login = Login;
