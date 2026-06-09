// Real Supabase Backend — logic for data persistence, auth states, and real-time.

const SUPABASE_URL      = 'https://fmxgsqkxhcbydvaqzefs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wDyj0YBxO4fUl0ZfSfSWFg_T8x4wtgI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- helpers (globals) ----------
const formatDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';

const formatDateLong = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const isOverdue = (prazo, status, statusConcluido) =>
  !!prazo && new Date(prazo) < new Date() && status !== statusConcluido;

const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} dias`;
  return formatDate(iso);
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(s => s[0] || '').join('').toUpperCase();

const avatarPalette = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
};

// ---------- local cache ----------
const CACHE_KEY    = 'ns-data-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const saveCache = () => {
  try {
    const payload = {
      ts: Date.now(),
      profiles:        _state.profiles,
      pendencias:      _state.pendencias,
      demandas:        _state.demandas,
      historico:       _state.historico.slice(0, 50),
      comentarios:     _state.comentarios,
      anexos:          _state.anexos,
      notificacoes:    _state.notificacoes,
      metas:            _state.metas,
      checklistItems:   _state.checklistItems,
      labels:           _state.labels,
      pendenciasLabels: _state.pendenciasLabels,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
};

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw);
    if (!payload?.ts || Date.now() - payload.ts > CACHE_TTL_MS) return false;
    _state.profiles        = payload.profiles        || [];
    _state.pendencias      = payload.pendencias      || [];
    _state.demandas        = payload.demandas        || [];
    _state.historico       = payload.historico       || [];
    _state.comentarios     = payload.comentarios     || [];
    _state.anexos          = payload.anexos          || [];
    _state.notificacoes    = payload.notificacoes    || [];
    _state.metas             = payload.metas             || [];
    _state.checklistItems    = payload.checklistItems    || [];
    _state.labels            = payload.labels            || [];
    _state.pendenciasLabels  = payload.pendenciasLabels  || [];
    _state.loaded            = true;
    return true;
  } catch (_) { return false; }
};

const clearCache = () => localStorage.removeItem(CACHE_KEY);

// ---------- global state (Store) ----------
const _state = {
  profiles:  [],
  pendencias: [],
  demandas:  [],
  historico: [],
  comentarios: [],
  anexos: [],
  notificacoes: [],
  metas: [],
  checklistItems: [],
  labels: [],
  pendenciasLabels: [],
  loaded:    false,
  loadError: null,
};

const _subs = new Set();
const _emit = () => { _subs.forEach(fn => { try { fn(); } catch (_) {} }); };
const subscribe = (fn) => { _subs.add(fn); return () => _subs.delete(fn); };

const useStore = () => {
  const [, setTick] = React.useState(0);
  React.useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  return _state;
};

// ---------- loaders ----------
let _realtimeSubscribed = false;

const loadAll = async () => {
  const hadCache = loadCache();
  if (hadCache) _emit();

  try {
    const [
      { data: profiles },
      { data: pendencias },
      { data: demandas },
      { data: historico },
      { data: comentarios },
      { data: anexos },
      { data: notificacoes },
      { data: metas },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('pendencias').select('*').order('ordem', { ascending: true }).order('updated_at', { ascending: false }),
      supabase.from('demandas').select('*').order('updated_at', { ascending: false }),
      supabase.from('demandas_historico').select('*').order('criado_em', { ascending: false }),
      supabase.from('demandas_comentarios').select('*').order('criado_em', { ascending: false }),
      supabase.from('demandas_anexos').select('*').order('criado_em', { ascending: false }),
      supabase.from('notificacoes').select('*').order('criado_em', { ascending: false }),
      supabase.from('equipe_metas').select('*').order('criado_em', { ascending: false }),
    ]);
    _state.profiles     = (profiles   || []).map(p => ({ ...p, avatar: p.avatar_url || null }));
    _state.pendencias   = pendencias  || [];
    _state.demandas     = demandas    || [];
    _state.historico    = historico   || [];
    _state.comentarios  = comentarios || [];
    _state.anexos       = anexos      || [];
    _state.notificacoes = notificacoes || [];
    _state.metas        = metas       || [];
    _state.loaded       = true;

    try {
      const { data: cl } = await supabase.from('pendencias_checklist').select('*').order('ordem').order('criado_em');
      _state.checklistItems = cl || [];
    } catch (_) { _state.checklistItems = []; }

    try {
      const [{ data: lblData }, { data: plData }] = await Promise.all([
        supabase.from('labels').select('*').order('nome'),
        supabase.from('pendencias_labels').select('*'),
      ]);
      _state.labels            = lblData || [];
      _state.pendenciasLabels  = plData  || [];
    } catch (_) {
      _state.labels           = [];
      _state.pendenciasLabels = [];
    }
    _emit();
    saveCache();

    if (!_realtimeSubscribed) {
      _realtimeSubscribed = true;
      supabase.channel('ns-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pendencias' }, () => api.loadPendencias())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas'   }, () => api.loadDemandas())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles'   }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_historico' }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_comentarios' }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_anexos' }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'equipe_metas' }, () => loadAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pendencias_checklist' }, () => api.loadChecklistItems())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'labels' }, () => api.loadLabels())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pendencias_labels' }, () => api.loadLabels())
        .subscribe();
    }
  } catch (err) {
    if (!_state.loaded) {
      _state.loadError = 'Offline — exibindo dados em cache.';
      _emit();
    }
  }
};

// ---------- api (Real Supabase Backend) ----------
const api = {
  // Persistence Helpers
  loadPendencias: async () => {
    const { data } = await supabase.from('pendencias').select('*').order('ordem', { ascending: true }).order('updated_at', { ascending: false });
    if (data) { _state.pendencias = data; _emit(); }
  },
  loadDemandas: async () => {
    const { data } = await supabase.from('demandas').select('*').order('updated_at', { ascending: false });
    if (data) { _state.demandas = data; _emit(); }
  },

  // profiles
  listProfiles: () => [..._state.profiles],
  listActiveProfiles: () => _state.profiles.filter(p => p.ativo),

  upsertProfile: async (p) => {
    const { data, error } = await supabase.from('profiles').upsert(p).select().single();
    if (error) { toast('Erro ao salvar usuário.', 'error'); throw error; }
    await loadAll();
    return data;
  },

  toggleProfileActive: async (id) => {
    const u = _state.profiles.find(x => x.id === id);
    if (!u) return;
    const { error } = await supabase.from('profiles').update({ ativo: !u.ativo }).eq('id', id);
    if (error) { toast('Erro ao atualizar status.', 'error'); throw error; }
    await loadAll();
  },

  deleteProfile: async (id) => {
    const { error } = await supabase.rpc('hard_delete_user', { target_user_id: id });
    if (error) {
      toast('Erro ao excluir usuário: ' + error.message, 'error');
      throw error;
    }
    await loadAll();
  },

  setProfileAvatar: async (id, dataUrl) => {
    try {
      if (!dataUrl) {
        await supabase.from('profiles').update({ avatar_url: null }).eq('id', id);
        await loadAll();
        return;
      }
      
      // Convert image to WebP using Canvas to bypass AVIF mime-type issues and reduce size
      const webpBlob = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Max size 256x256 for avatars
          const size = Math.min(img.width, img.height, 256);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          // Crop center
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
          canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error("Falha ao processar imagem"));
        img.src = dataUrl;
      });

      const path = `avatars/${id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('public').upload(path, webpBlob, { 
        upsert: true,
        contentType: 'image/jpeg'
      });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(path);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', id);
      if (updateError) throw updateError;
      
      await loadAll();
    } catch (e) {
      console.error('Erro no setProfileAvatar:', e);
      toast('Erro ao alterar foto: ' + (e.message || 'Desconhecido'), 'error');
    }
  },

  // pendencias (Optimistic)
  createPendencia: async (data, profile) => {
    const payload = { 
      status: 'nao-concluido', 
      criado_por: profile.nome, 
      criado_por_id: profile.id,
      urgente: false, 
      ...data 
    };
    // Optimistic push
    const tmpId = 'temp-' + Date.now();
    _state.pendencias = [{ id: tmpId, created_at: new Date().toISOString(), ...payload }, ..._state.pendencias];
    _emit();

    const { data: row, error } = await supabase.from('pendencias').insert(payload).select().single();
    if (error) {
      await api.loadPendencias(); // Rollback
      toast('Erro ao criar pendência.', 'error');
      return null;
    }
    await api.loadPendencias();
    return row;
  },

  reorderPendencia: async (id, novaOrdem) => {
    _state.pendencias = _state.pendencias.map(p => p.id === id ? { ...p, ordem: novaOrdem } : p);
    _emit();
    const { error } = await supabase.from('pendencias').update({ ordem: novaOrdem }).eq('id', id);
    if (error) { await api.loadPendencias(); toast('Erro ao reordenar.', 'error'); }
  },

  updatePendencia: async (id, patch) => {
    // Optimistic patch
    _state.pendencias = _state.pendencias.map(p => p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p);
    _emit();

    const { error } = await supabase.from('pendencias').update(patch).eq('id', id);
    if (error) {
      await api.loadPendencias(); // Rollback
      toast('Erro ao atualizar pendência.', 'error');
      return null;
    }
    return patch;
  },

  deletePendencia: async (id) => {
    _state.pendencias = _state.pendencias.filter(p => p.id !== id);
    _emit();
    const { error } = await supabase.from('pendencias').delete().eq('id', id);
    if (error) { await api.loadPendencias(); toast('Erro ao excluir.', 'error'); }
  },

  archivarPendencia: async (id) => {
    await api.updatePendencia(id, { arquivado: true });
  },

  restaurarPendencia: async (id) => {
    await api.updatePendencia(id, { arquivado: false });
  },

  // demandas
  createDemanda: async (data, profile) => {
    const payload = { 
      status: 'aberta', 
      criado_por: profile.nome, 
      criado_por_id: profile.id,
      urgente: false, 
      ...data 
    };
    const { data: row, error } = await supabase.from('demandas').insert(payload).select().single();
    if (error) { toast('Erro ao criar demanda.', 'error'); return null; }
    
    // Notificar responsavel se for diferente de quem criou
    if (row.responsavel_id !== profile.id) {
      await supabase.from('notificacoes').insert({
        usuario_id: row.responsavel_id,
        tipo: 'atribuicao',
        titulo: `${profile.nome} atribuiu a demanda "${row.titulo}" a você.`,
        link_id: row.id,
        link_tipo: 'demanda'
      });
    }

    await loadAll();
    return row;
  },

  updateDemanda: async (id, patch, profile) => {
    const row = _state.demandas.find(x => x.id === id);
    if (!row) return null;

    const fields = {
      titulo: 'Título', descricao: 'Descrição', status: 'Status',
      responsavel: 'Responsável', urgente: 'Urgente', prazo: 'Prazo',
    };
    const histRows = [];
    for (const k of Object.keys(fields)) {
      if (!(k in patch)) continue;
      const before = row[k], after = patch[k];
      if ((before ?? '') === (after ?? '')) continue;
      const fmt = (v) =>
        k === 'prazo'   ? (v ? formatDate(v) : '—') :
        k === 'urgente' ? (v ? 'Sim' : 'Não') :
        (v == null || v === '' ? '—' : String(v));
      histRows.push({
        demanda_id: id, 
        editado_por: profile.nome,
        editado_por_id: profile.id,
        campo: fields[k], valor_antigo: fmt(before), valor_novo: fmt(after),
        criado_em: new Date().toISOString(),
      });
    }

    const { error: errDem } = await supabase.from('demandas').update(patch).eq('id', id);
    if (errDem) { toast('Erro ao salvar demanda.', 'error'); return null; }

    if (histRows.length) {
      await supabase.from('demandas_historico').insert(histRows);
    }
    
    await loadAll();
    return { ...row, ...patch };
  },

  deleteDemanda: async (id) => {
    const { error } = await supabase.from('demandas').delete().eq('id', id);
    if (error) { toast('Erro ao excluir demanda.', 'error'); return; }
    await loadAll();
  },

  listHistorico: (demandaId) =>
    _state.historico
      .filter(h => h.demanda_id === demandaId)
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)),

  listComentarios: (demandaId) =>
    _state.comentarios
      .filter(c => c.demanda_id === demandaId)
      .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em)),

  listAnexos: (demandaId) =>
    _state.anexos
      .filter(a => a.demanda_id === demandaId)
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)),

  createComentario: async (demandaId, texto, profile) => {
    const { data, error } = await supabase.from('demandas_comentarios').insert({
      demanda_id: demandaId,
      autor_id: profile.id,
      texto
    }).select().single();
    if (error) { toast('Erro ao enviar comentário', 'error'); return null; }

    const demanda = _state.demandas.find(d => d.id === demandaId);
    if (demanda && demanda.responsavel_id !== profile.id && demanda.criado_por_id !== profile.id) {
      // Notifica o responsável se o autor do comentário não é o responsável nem o criador
      await supabase.from('notificacoes').insert({
        usuario_id: demanda.responsavel_id,
        tipo: 'comentario',
        titulo: `${profile.nome} comentou na demanda "${demanda.titulo}".`,
        link_id: demanda.id,
        link_tipo: 'demanda'
      });
    }

    // Processa menções: procura por @Palavra (primeira palavra do nome)
    const mentions = [...new Set(texto.match(/@([\w]+)/g) || [])];
    if (mentions.length) {
      for (const m of mentions) {
        const nomeMencionado = m.slice(1).toLowerCase();
        const user = _state.profiles.find(p => p.nome.toLowerCase().split(' ').some(w => w.startsWith(nomeMencionado)));
        if (user && user.id !== profile.id) {
          await supabase.from('notificacoes').insert({
            usuario_id: user.id,
            tipo: 'mencao',
            titulo: `${profile.nome} mencionou você em "${demanda.titulo}".`,
            link_id: demanda.id,
            link_tipo: 'demanda'
          });
        }
      }
    }

    await loadAll();
    return data;
  },

  createAnexo: async (demandaId, file, profile) => {
    const ext = file.name.split('.').pop();
    const path = `demandas/${demandaId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('anexos').upload(path, file);
    if (uploadError) { toast('Erro no upload', 'error'); return; }
    
    const { data: { publicUrl } } = supabase.storage.from('anexos').getPublicUrl(path);
    await supabase.from('demandas_anexos').insert({
      demanda_id: demandaId,
      autor_id: profile.id,
      nome_arquivo: file.name,
      url: publicUrl
    });
    await loadAll();
  },

  deleteAnexo: async (anexo) => {
    const { error } = await supabase.from('demandas_anexos').delete().eq('id', anexo.id);
    if (error) toast('Erro ao excluir anexo', 'error');
    else await loadAll();
  },

  markNotificacaoLida: async (id) => {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    await loadAll();
  },

  createMeta: async (gestor_id, qtd_pendencias, qtd_demandas) => {
    try {
      const now = new Date();
      const inicio = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().slice(0, 10);
      const fim = new Date(now.setDate(now.getDate() - now.getDay() + 6)).toISOString().slice(0, 10);
      const { error } = await supabase.from('equipe_metas').insert({
        gestor_id, qtd_pendencias, qtd_demandas, data_inicio: inicio, data_fim: fim
      });
      if (error) throw error;
      toast('Meta da semana definida com sucesso!');
      await loadAll();
    } catch (e) {
      console.error('Erro no createMeta:', e);
      toast('Erro ao criar meta: ' + e.message, 'error');
    }
  },

  updateMeta: async (id, qtd_pendencias, qtd_demandas) => {
    try {
      const { error } = await supabase.from('equipe_metas').update({
        qtd_pendencias, qtd_demandas
      }).eq('id', id);
      if (error) throw error;
      toast('Meta atualizada com sucesso!');
      await loadAll();
    } catch (e) {
      console.error('Erro no updateMeta:', e);
      toast('Erro ao atualizar meta: ' + e.message, 'error');
    }
  },

  // pendencias_checklist
  loadChecklistItems: async () => {
    const { data } = await supabase.from('pendencias_checklist').select('*').order('ordem').order('criado_em');
    if (data) { _state.checklistItems = data; _emit(); saveCache(); }
  },

  listChecklistItems: (pendenciaId) =>
    (_state.checklistItems || [])
      .filter(c => c.pendencia_id === pendenciaId)
      .sort((a, b) => a.ordem - b.ordem || new Date(a.criado_em) - new Date(b.criado_em)),

  addChecklistItem: async (pendencia_id, texto) => {
    const ordem = (_state.checklistItems || []).filter(c => c.pendencia_id === pendencia_id).length;
    const { data, error } = await supabase.from('pendencias_checklist')
      .insert({ pendencia_id, texto, ordem }).select().single();
    if (error) { toast('Erro ao adicionar item.', 'error'); return null; }
    await api.loadChecklistItems();
    return data;
  },

  toggleChecklistItem: async (id) => {
    const item = (_state.checklistItems || []).find(c => c.id === id);
    if (!item) return;
    _state.checklistItems = _state.checklistItems.map(c =>
      c.id === id ? { ...c, concluido: !c.concluido } : c
    );
    _emit();
    const { error } = await supabase.from('pendencias_checklist')
      .update({ concluido: !item.concluido }).eq('id', id);
    if (error) { await api.loadChecklistItems(); toast('Erro ao atualizar item.', 'error'); }
  },

  deleteChecklistItem: async (id) => {
    _state.checklistItems = (_state.checklistItems || []).filter(c => c.id !== id);
    _emit();
    const { error } = await supabase.from('pendencias_checklist').delete().eq('id', id);
    if (error) { await api.loadChecklistItems(); toast('Erro ao excluir item.', 'error'); }
  },

  // labels
  loadLabels: async () => {
    const [{ data: lblData }, { data: plData }] = await Promise.all([
      supabase.from('labels').select('*').order('nome'),
      supabase.from('pendencias_labels').select('*'),
    ]);
    _state.labels           = lblData || [];
    _state.pendenciasLabels = plData  || [];
    _emit();
    saveCache();
  },

  listLabels: () => [...(_state.labels || [])],

  listPendenciaLabels: (pendenciaId) =>
    (_state.pendenciasLabels || [])
      .filter(pl => pl.pendencia_id === pendenciaId)
      .map(pl => (_state.labels || []).find(l => l.id === pl.label_id))
      .filter(Boolean),

  createLabel: async (nome, cor, profile) => {
    const { data, error } = await supabase.from('labels')
      .insert({ nome, cor, criado_por: profile.id }).select().single();
    if (error) { toast('Erro ao criar etiqueta.', 'error'); return null; }
    await api.loadLabels();
    return data;
  },

  deleteLabel: async (id) => {
    _state.labels           = (_state.labels           || []).filter(l  => l.id !== id);
    _state.pendenciasLabels = (_state.pendenciasLabels || []).filter(pl => pl.label_id !== id);
    _emit();
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) { await api.loadLabels(); toast('Erro ao excluir etiqueta.', 'error'); }
  },

  togglePendenciaLabel: async (pendencia_id, label_id) => {
    const existing = (_state.pendenciasLabels || []).find(
      pl => pl.pendencia_id === pendencia_id && pl.label_id === label_id
    );
    if (existing) {
      _state.pendenciasLabels = _state.pendenciasLabels.filter(
        pl => !(pl.pendencia_id === pendencia_id && pl.label_id === label_id)
      );
      _emit();
      const { error } = await supabase.from('pendencias_labels')
        .delete().eq('pendencia_id', pendencia_id).eq('label_id', label_id);
      if (error) { await api.loadLabels(); toast('Erro ao remover etiqueta.', 'error'); }
    } else {
      _state.pendenciasLabels = [...(_state.pendenciasLabels || []), { pendencia_id, label_id }];
      _emit();
      const { error } = await supabase.from('pendencias_labels').insert({ pendencia_id, label_id });
      if (error) { await api.loadLabels(); toast('Erro ao adicionar etiqueta.', 'error'); }
    }
  },

  // system
  resetSeed: async () => {
    await loadAll();
    toast('Dados sincronizados com o servidor.');
  },

  clearCache: () => {
    clearCache();
    toast('Cache local removido.');
  },

  // Notifications (Derived Logic)
  notificationsFor: (profile) => {
    if (!profile) return [];
    const items = [];
    const now  = Date.now();
    const soon = 1000 * 60 * 60 * 48;
    
    for (const d of _state.demandas) {
      if (d.responsavel_id !== profile.id) continue;
      const created = new Date(d.created_at).getTime();
      if (now - created < 1000 * 60 * 60 * 72 && d.criado_por_id !== profile.id) {
        items.push({
          id: `dn-${d.id}`, kind: 'nova-demanda',
          title: 'Nova demanda atribuída a você',
          desc: d.titulo, sub: `de ${d.criado_por}`,
          time: d.created_at, href: { page: 'demandas', id: d.id },
        });
      }
      if (d.prazo && d.status !== 'concluida' && d.status !== 'cancelada') {
        const dt   = new Date(d.prazo).getTime();
        const diff = dt - now;
        if (diff < 0) {
          items.push({ id: `dv-${d.id}`, kind: 'demanda-vencida',
            title: 'Demanda vencida', desc: d.titulo,
            sub: `prazo era ${formatDate(d.prazo)}`,
            time: d.prazo, href: { page: 'demandas', id: d.id } });
        } else if (diff < soon) {
          items.push({ id: `dp-${d.id}`, kind: 'demanda-prazo',
            title: 'Prazo de demanda se aproxima', desc: d.titulo,
            sub: `vence em ${formatDate(d.prazo)}`,
            time: d.prazo, href: { page: 'demandas', id: d.id } });
        }
      }
    }
    for (const p of _state.pendencias) {
      if (p.responsavel_id !== profile.id) continue;
      if (!p.prazo || p.status === 'concluido') continue;
      const dt   = new Date(p.prazo).getTime();
      const diff = dt - now;
      if (diff < 0) {
        items.push({ id: `pv-${p.id}`, kind: 'pendencia-vencida', lida: false,
          title: 'Pendência vencida', desc: p.titulo,
          sub: `prazo era ${formatDate(p.prazo)}`,
          time: p.prazo, href: { page: 'pendencias' } });
      } else if (diff < soon) {
        items.push({ id: `pp-${p.id}`, kind: 'pendencia-prazo', lida: false,
          title: 'Prazo de pendência se aproxima', desc: p.titulo,
          sub: `vence em ${formatDate(p.prazo)}`,
          time: p.prazo, href: { page: 'pendencias' } });
      }
    }

    // Add DB notifications
    const dbNotifs = _state.notificacoes.filter(n => n.usuario_id === profile.id && !n.lida).map(n => ({
      id: n.id,
      kind: n.tipo,
      lida: n.lida,
      title: n.titulo,
      desc: '',
      sub: timeAgo(n.criado_em),
      time: n.criado_em,
      href: { page: n.link_tipo === 'demanda' ? 'demandas' : 'pendencias', id: n.link_id },
      isDb: true
    }));

    return [...items, ...dbNotifs].sort((a, b) => new Date(b.time) - new Date(a.time));
  },
};

// Exposed Globals
Object.assign(window, {
  supabase, loadAll,
  api, useStore, subscribe,
  formatDate, formatDateLong, isOverdue, timeAgo, initials, avatarColor,
});
