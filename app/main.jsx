// App entry — auth state, routing, sidebar shell, role tweaks panel.

const OfflineBanner = () => {
  const [online, setOnline] = React.useState(navigator.onLine);
  React.useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online',  on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-1.5">
      📡 Você está offline — exibindo dados em cache.
    </div>
  );
};

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  pendencias: 'Minhas Pendências',
  demandas:   'Demandas',
  equipe:     'Equipe',
  feedback:   'Feedback',
  usuarios:   'Usuários',
};

const App = () => {
  const store = useStore();

  // ----- auth -----
  const [profileId, setProfileId] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const profile = profileId ? store.profiles.find(p => p.id === profileId) : null;

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setAuthLoading(false); return; }
      let { data: prof } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (prof && prof.ativo) {
        prof.avatar = prof.avatar_url || null;
        await loadAll();
        setProfileId(prof.id);
      } else {
        await supabase.auth.signOut();
      }
      setAuthLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileId(null);
  };

  // ----- routing -----
  const [page, setPage] = React.useState('dashboard');
  const [pendFilter, setPendFilter] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Counts for sidebar badges (role-aware)
  const sidebarCounts = React.useMemo(() => {
    if (!profile) return {};
    const isGestor = profile.role === 'gestor';
    const pendList = isGestor ? store.pendencias : store.pendencias.filter(p => p.responsavel === profile.nome);
    const demList  = isGestor ? store.demandas    : store.demandas.filter(d => d.responsavel === profile.nome);
    return {
      pendOpen: pendList.filter(p => p.status !== 'concluido').length,
      demOpen:  demList.filter(d => d.status === 'aberta' || d.status === 'em-andamento').length,
    };
  }, [store, profile]);

  // ----- tweaks (TweaksPanel manages open/close + host protocol) -----
  const tweakDefaults = /*EDITMODE-BEGIN*/{
    "showAvatarColors": true
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(tweakDefaults);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30">
            <IconLogo size={22} />
          </span>
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <Login onLogin={(p) => { setProfileId(p.id); setPage('dashboard'); }} />
        <ToastHost />
      </>
    );
  }

  const handleNavigate = (id) => {
    if (id !== 'pendencias') setPendFilter(null);
    setPage(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard profile={profile} onNavigate={handleNavigate} />;
      case 'pendencias': return <Pendencias profile={profile} filterByResponsavel={pendFilter} />;
      case 'demandas':   return <Demandas profile={profile} />;
      case 'equipe':     return <Equipe profile={profile} onOpenPendenciasFor={(nome) => { setPendFilter(nome); setPage('pendencias'); }} />;
      case 'feedback':   return <Feedback profile={profile} />;
      case 'usuarios':
        if (profile.role !== 'gestor') return <Dashboard profile={profile} onNavigate={handleNavigate}/>;
        return <Usuarios profile={profile} />;
      default: return null;
    }
  };

  return (
    <>
    <OfflineBanner />
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <Sidebar
        profile={profile}
        page={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        counts={sidebarCounts}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onOpenMobile={() => setMobileOpen(true)}
          title={PAGE_TITLES[page]}
          profile={profile}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 min-w-0">
          {renderPage()}
        </main>
      </div>

      <ToastHost />
      <GlobalSearch onNavigate={handleNavigate} />
      <KeyboardShortcuts onNavigate={handleNavigate} />
      <OnboardingTour />

      <TweaksPanel title="Configurações">
          <TweakSection title="Dados do Sistema">
            <TweakButton onClick={() => api.resetSeed()}>Recarregar App</TweakButton>
            <p className="text-[11px] text-gray-500 mt-2">Sincroniza os dados com o Supabase.</p>
          </TweakSection>
      </TweaksPanel>
    </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
