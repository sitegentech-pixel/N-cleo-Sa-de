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
  dashboard:   'Dashboard',
  pendencias:  'Minhas Pendências',
  demandas:    'Demandas',
  equipe:      'Equipe',
  calendario:  'Calendário',
  workspace:   'Meu Workspace',
  feedback:    'Feedback',
  usuarios:    'Usuários',
  perfil:      'Meu Perfil',
};

// ----- hash routing (#/dashboard, #/calendario, ...) -----
const VALID_PAGES = Object.keys(PAGE_TITLES);
const pageFromHash = () => {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return VALID_PAGES.includes(h) ? h : 'dashboard';
};
const navigateHash = (id) => {
  if (pageFromHash() === id) return;
  window.location.hash = '/' + id;
};

const App = () => {
  const store = useStore();

  // ----- auth -----
  const [profileId, setProfileId] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const profile = profileId ? store.profiles.find(p => p.id === profileId) : null;
  // Ref mirror so the auth listener (registered once) can read the current value.
  const profileIdRef = React.useRef(null);
  React.useEffect(() => { profileIdRef.current = profileId; }, [profileId]);

  React.useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (active) setAuthLoading(false);
          return;
        }

        const user = session.user;
        let { data: profile } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();

        if (!profile) {
          const newProfile = {
            id:    user.id,
            email: user.email,
            nome:  user.user_metadata?.nome || user.email.split('@')[0],
            role:  'funcionario',
            ativo: true,
          };
          const { data: createdProfile } = await supabase.from('profiles').upsert(newProfile).select().single();
          profile = createdProfile;
        }

        if (profile && !profile.ativo) {
          await supabase.auth.signOut();
          if (active) {
            setProfileId(null);
            setAuthLoading(false);
          }
          return;
        }

        if (profile) {
          profile.avatar = profile.avatar_url || null;
          await loadAll();
          if (active) {
            setProfileId(profile.id);
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar sessão:", err);
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (active) {
          setProfileId(null);
          setAuthLoading(false);
        }
      } else if (event === 'SIGNED_IN' && session) {
        // Supabase re-emite SIGNED_IN ao refocar a aba / revalidar o token.
        // Se já é o mesmo usuário logado, não recarregar nem navegar —
        // era isso que causava o retorno inesperado ao Dashboard.
        if (profileIdRef.current === session.user.id) return;

        const user = session.user;
        let { data: profile } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();

        if (profile && !profile.ativo) {
          await supabase.auth.signOut();
          if (active) {
            setProfileId(null);
          }
          return;
        }

        if (profile) {
          profile.avatar = profile.avatar_url || null;
          await loadAll();
          if (active) {
            setProfileId(profile.id);
            navigateHash('dashboard');
          }
        }
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileId(null);
  };

  // ----- routing (hash-based: URLs compartilháveis + histórico do navegador) -----
  const [page, setPage] = React.useState(pageFromHash);
  const [pendFilter, setPendFilter] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [transitioning, setTransitioning] = React.useState(false);

  React.useEffect(() => {
    // Normalize URL on first load (so "/" shows "#/dashboard").
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/' + pageFromHash());
    }
    const onHash = () => {
      const next = pageFromHash();
      setTransitioning(true);
      setTimeout(() => {
        if (next !== 'pendencias') setPendFilter(null);
        setPage(next);
        setMobileOpen(false);
        setTransitioning(false);
      }, 120);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] dark:bg-gray-900">
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
        <Login onLogin={(p) => { setProfileId(p.id); navigateHash('dashboard'); }} />
        <ToastHost />
      </>
    );
  }

  const handleNavigate = (id) => {
    if (id !== 'pendencias') setPendFilter(null);
    navigateHash(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard profile={profile} onNavigate={handleNavigate} />;
      case 'pendencias': return <Pendencias profile={profile} filterByResponsavel={pendFilter} />;
      case 'demandas':   return <Demandas profile={profile} />;
      case 'equipe':      return <Equipe profile={profile} onOpenPendenciasFor={(nome) => { setPendFilter(nome); navigateHash('pendencias'); }} />;
      case 'calendario':  return <CalendarioView profile={profile} />;
      case 'workspace':   return <Workspace profile={profile} />;
      case 'feedback':   return <Feedback profile={profile} />;
      case 'usuarios':
        if (profile.role !== 'gestor') return <Dashboard profile={profile} onNavigate={handleNavigate}/>;
        return <Usuarios profile={profile} />;
      case 'perfil': return <Perfil profile={profile} onBack={() => navigateHash('dashboard')} />;
      default: return null;
    }
  };

  return (
    <>
    <OfflineBanner />
    <div className="flex min-h-screen bg-[#f7f8fa] dark:bg-gray-900">
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
        <main className={`flex-1 min-w-0 transition-opacity duration-150 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
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
            <TweakButton onClick={() => { api.clearCache(); window.location.reload(); }}>Limpar Cache Local</TweakButton>
            <p className="text-[11px] text-gray-500 mt-2">Remove dados em cache (offline). Recarrega a página.</p>
          </TweakSection>
          <TweakSection title="Onboarding">
            <TweakButton label="Iniciar Tour" onClick={() => window.dispatchEvent(new CustomEvent('ns-start-tour'))} />
          </TweakSection>
      </TweaksPanel>
    </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
