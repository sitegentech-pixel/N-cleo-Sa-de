-- migration_workspace.sql — Workspace Pessoal
-- Notas, Projetos (kanban), Fluxogramas, Conhecimento e Compartilhamento.
-- Tudo privado por padrão; compartilhamento via ws_shares (view/comment/edit).

-- ========== TABELAS ==========

CREATE TABLE IF NOT EXISTS public.ws_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT '',
  cor TEXT NOT NULL DEFAULT 'amarelo',
  fixada BOOLEAN NOT NULL DEFAULT false,
  favorita BOOLEAN NOT NULL DEFAULT false,
  arquivada BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ws_projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  cor TEXT NOT NULL DEFAULT 'emerald',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ws_tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.ws_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'backlog', -- backlog | andamento | aguardando | concluido
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ws_flows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ws_knowledge (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Geral',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compartilhamento estilo Google Docs: view | comment | edit
CREATE TABLE IF NOT EXISTS public.ws_shares (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'note' | 'project' | 'flow' | 'knowledge'
  recurso_id BIGINT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permissao TEXT NOT NULL DEFAULT 'view', -- 'view' | 'comment' | 'edit'
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, recurso_id, usuario_id)
);

-- ========== ÍNDICES ==========

CREATE INDEX IF NOT EXISTS idx_ws_notes_user      ON public.ws_notes (user_id, arquivada, fixada);
CREATE INDEX IF NOT EXISTS idx_ws_projects_user   ON public.ws_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_ws_tasks_project   ON public.ws_tasks (project_id, status, ordem);
CREATE INDEX IF NOT EXISTS idx_ws_tasks_user      ON public.ws_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_ws_flows_user      ON public.ws_flows (user_id);
CREATE INDEX IF NOT EXISTS idx_ws_knowledge_user  ON public.ws_knowledge (user_id, categoria);
CREATE INDEX IF NOT EXISTS idx_ws_shares_recurso  ON public.ws_shares (tipo, recurso_id);
CREATE INDEX IF NOT EXISTS idx_ws_shares_usuario  ON public.ws_shares (usuario_id);

-- ========== HELPER ==========

-- Acesso compartilhado: true se o usuário logado tem share no recurso
CREATE OR REPLACE FUNCTION public.ws_shared_with_me(p_tipo TEXT, p_recurso BIGINT, p_min TEXT DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ws_shares s
    WHERE s.tipo = p_tipo
      AND s.recurso_id = p_recurso
      AND s.usuario_id = auth.uid()
      AND (
        p_min = 'view'
        OR (p_min = 'comment' AND s.permissao IN ('comment','edit'))
        OR (p_min = 'edit'    AND s.permissao = 'edit')
      )
  );
$$;

-- ========== RLS ==========

ALTER TABLE public.ws_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws_flows     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws_shares    ENABLE ROW LEVEL SECURITY;

-- notes
CREATE POLICY "ws_notes_select" ON public.ws_notes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('note', id, 'view'));
CREATE POLICY "ws_notes_insert" ON public.ws_notes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ws_notes_update" ON public.ws_notes FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('note', id, 'edit'));
CREATE POLICY "ws_notes_delete" ON public.ws_notes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- projects
CREATE POLICY "ws_projects_select" ON public.ws_projects FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('project', id, 'view'));
CREATE POLICY "ws_projects_insert" ON public.ws_projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ws_projects_update" ON public.ws_projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('project', id, 'edit'));
CREATE POLICY "ws_projects_delete" ON public.ws_projects FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- tasks herdam acesso do projeto
CREATE POLICY "ws_tasks_select" ON public.ws_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ws_projects p
    WHERE p.id = project_id
      AND (p.user_id = auth.uid() OR public.ws_shared_with_me('project', p.id, 'view'))
  ));
CREATE POLICY "ws_tasks_insert" ON public.ws_tasks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.ws_projects p
    WHERE p.id = project_id
      AND (p.user_id = auth.uid() OR public.ws_shared_with_me('project', p.id, 'edit'))
  ));
CREATE POLICY "ws_tasks_update" ON public.ws_tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ws_projects p
    WHERE p.id = project_id
      AND (p.user_id = auth.uid() OR public.ws_shared_with_me('project', p.id, 'edit'))
  ));
CREATE POLICY "ws_tasks_delete" ON public.ws_tasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ws_projects p
    WHERE p.id = project_id
      AND (p.user_id = auth.uid() OR public.ws_shared_with_me('project', p.id, 'edit'))
  ));

-- flows
CREATE POLICY "ws_flows_select" ON public.ws_flows FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('flow', id, 'view'));
CREATE POLICY "ws_flows_insert" ON public.ws_flows FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ws_flows_update" ON public.ws_flows FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('flow', id, 'edit'));
CREATE POLICY "ws_flows_delete" ON public.ws_flows FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- knowledge
CREATE POLICY "ws_knowledge_select" ON public.ws_knowledge FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('knowledge', id, 'view'));
CREATE POLICY "ws_knowledge_insert" ON public.ws_knowledge FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ws_knowledge_update" ON public.ws_knowledge FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.ws_shared_with_me('knowledge', id, 'edit'));
CREATE POLICY "ws_knowledge_delete" ON public.ws_knowledge FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- shares: dono gerencia; destinatário enxerga os próprios shares
CREATE POLICY "ws_shares_select" ON public.ws_shares FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR usuario_id = auth.uid());
CREATE POLICY "ws_shares_insert" ON public.ws_shares FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ws_shares_update" ON public.ws_shares FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "ws_shares_delete" ON public.ws_shares FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ========== REALTIME ==========

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_notes;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_projects;  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_tasks;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_flows;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_knowledge; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ws_shares;    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
