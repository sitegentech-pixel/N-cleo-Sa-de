// Sidebar + top mobile bar. Tracks active page; emits role-aware items.

const NavItem = ({ active, icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors
      ${active
        ? 'bg-brand-700/90 text-white shadow-inner shadow-black/10'
        : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
  >
    <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{icon}</span>
    <span className="flex-1 text-left font-medium">{label}</span>
    {badge != null && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold
        ${active ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-300 group-hover:bg-gray-700'}`}>{badge}</span>
    )}
  </button>
);

const Sidebar = ({ profile, page, onNavigate, onLogout, mobileOpen, onCloseMobile, counts }) => {
  const isGestor = profile.role === 'gestor';
  const items = [
    { id: 'dashboard',   label: 'Dashboard',         icon: <IconHome size={18} /> },
    { id: 'pendencias',  label: 'Minhas Pendências', icon: <IconCheckSq size={18} />, badge: counts?.pendOpen },
    { id: 'demandas',    label: 'Demandas',          icon: <IconInbox size={18} />,    badge: counts?.demOpen },
    { id: 'equipe',      label: 'Equipe',            icon: <IconUsers size={18} /> },
    ...(isGestor ? [{ id: 'usuarios', label: 'Usuários', icon: <IconShield size={18} /> }] : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm" onClick={onCloseMobile} />}

      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen z-40 inset-y-0 left-0 w-64 bg-gray-900 text-gray-100 flex flex-col transition-transform duration-200
                         ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <IconLogo size={18} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold tracking-tight">Núcleo Saúde</div>
            <div className="text-[10px] text-gray-400 -mt-0.5">Cooperativa · João Pessoa</div>
          </div>
        </div>

        {/* Workspace switcher (decorative) */}
        <div className="mx-3 mb-2 px-2.5 h-9 rounded-lg bg-gray-800/70 border border-gray-700/60 flex items-center gap-2 text-xs text-gray-300">
          <span className="w-5 h-5 rounded-md bg-brand-600/30 text-brand-300 flex items-center justify-center"><IconSpark size={12} /></span>
          <span className="flex-1 truncate">Workspace · Maio 2026</span>
          <IconChevDown size={14} className="text-gray-500" />
        </div>

        {/* Nav */}
        <nav className="px-3 py-2 space-y-0.5 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 px-3 pt-3 pb-1.5">Trabalho</div>
          {items.map(it => (
            <NavItem
              key={it.id}
              active={page === it.id}
              icon={it.icon}
              label={it.label}
              badge={it.badge}
              onClick={() => { onNavigate(it.id); onCloseMobile?.(); }}
            />
          ))}
        </nav>

        {/* User card */}
        <div className="m-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/60">
          <div className="flex items-center gap-3">
            <Avatar name={profile.nome} src={profile.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{profile.nome}</div>
              <div className="text-[11px] text-gray-400 capitalize">
                {profile.role === 'gestor' ? 'Gestor' : 'Funcionário'}
              </div>
            </div>
            <button onClick={onLogout}
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                    title="Sair">
              <IconLogout size={16} />
            </button>
          </div>
        </div>

        {/* Developer credit */}
        <div className="px-4 pb-4 -mt-1">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span className="tracking-wide uppercase">Desenvolvido por</span>
            <div className="flex items-center gap-1.5">
              <a href="https://sitegentch.vercel.app/" target="_blank" rel="noopener noreferrer"
                 className="font-semibold text-gray-300 hover:text-white transition-colors"
                 title="Portfólio">
                Thiago
              </a>
              <span className="text-gray-700">·</span>
              <a href="https://github.com/thiago536" target="_blank" rel="noopener noreferrer"
                 className="text-gray-500 hover:text-white transition-colors"
                 title="GitHub @thiago536">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const TopBar = ({ onOpenMobile, title, profile, onNavigate }) => (
  <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 h-14 px-3 sm:px-5 flex items-center gap-3">
    <button onClick={onOpenMobile} className="lg:hidden p-2 -ml-1 rounded-lg text-gray-700 hover:bg-gray-100">
      <IconMenu size={20} />
    </button>
    <div className="font-semibold text-gray-900 truncate text-[15px]">{title}</div>
    <div className="ml-auto flex items-center gap-2">
      <button onClick={() => window.dispatchEvent(new CustomEvent('ns-open-search'))} className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-xs border border-gray-200">
        <IconSearch size={14}/>
        <span>Buscar...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] bg-white rounded border border-gray-300 shadow-sm">/</kbd>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
      {profile && <NotificationBell profile={profile} onNavigate={onNavigate}/>}
      {profile && (
        <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-gray-200 h-8">
          <Avatar name={profile.nome} src={profile.avatar} size={28}/>
          <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{profile.nome.split(' ')[0]}</span>
        </div>
      )}
    </div>
  </header>
);

Object.assign(window, { Sidebar, TopBar });
