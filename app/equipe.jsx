// Equipe — list of users with pendência counters per person.

const Equipe = ({ profile, onOpenPendenciasFor }) => {
  const store = useStore();
  const isGestor = profile.role === 'gestor';

  const team = store.profiles.filter(u => u.ativo);

  const countsFor = (id) => {
    const list = store.pendencias.filter(p => p.responsavel_id === id);
    return {
      naoConcluido: list.filter(p => p.status === 'nao-concluido').length,
      emAndamento:  list.filter(p => p.status === 'em-andamento').length,
      concluido:    list.filter(p => p.status === 'concluido').length,
      total: list.length,
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PageHeader
        title="Equipe"
        subtitle={`${team.length} cooperados ativos · acompanhamento de pendências por pessoa.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(u => {
          const c = countsFor(u.id);
          const totalAtivas = c.naoConcluido + c.emAndamento;
          const progress = c.total === 0 ? 0 : Math.round((c.concluido / c.total) * 100);
          return (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 shadow-card p-5 hover:border-gray-300 transition">
              <div className="flex items-start gap-3">
                <Avatar name={u.nome} size={44}/>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900 truncate">{u.nome}</div>
                    <Badge tone={u.role === 'gestor' ? 'green' : 'gray'}>
                      {u.role === 'gestor' ? 'Gestor' : 'Funcionário'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
              </div>

              {/* Counts */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-rose-50/70 p-2.5">
                  <div className="text-[10px] font-medium text-rose-700 uppercase tracking-wide">Não concl.</div>
                  <div className="text-lg font-semibold text-rose-700 tabular-nums mt-0.5">{c.naoConcluido}</div>
                </div>
                <div className="rounded-lg bg-amber-50/70 p-2.5">
                  <div className="text-[10px] font-medium text-amber-800 uppercase tracking-wide">Em andam.</div>
                  <div className="text-lg font-semibold text-amber-800 tabular-nums mt-0.5">{c.emAndamento}</div>
                </div>
                <div className="rounded-lg bg-emerald-50/70 p-2.5">
                  <div className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide">Concluídas</div>
                  <div className="text-lg font-semibold text-emerald-700 tabular-nums mt-0.5">{c.concluido}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>Progresso</span>
                  <span className="tabular-nums font-medium text-gray-700">{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all"
                       style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">{totalAtivas} {totalAtivas === 1 ? 'tarefa ativa' : 'tarefas ativas'}</span>
                {isGestor && (
                  <button
                    onClick={() => onOpenPendenciasFor(u.id)}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
                    Ver pendências <IconChevRight size={12}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


Object.assign(window, { Equipe });
