CREATE TABLE IF NOT EXISTS public.feedback (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  autor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('bug', 'ideia', 'outros')),
  texto       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'resolvido')),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler (gestor vê tudo, funcionario filtra no frontend)
CREATE POLICY "feedback_read"   ON public.feedback FOR SELECT TO authenticated USING (true);
-- Qualquer autenticado pode inserir o próprio
CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());
-- Só gestor pode atualizar (marcar resolvido) ou deletar
CREATE POLICY "feedback_update" ON public.feedback FOR UPDATE TO authenticated USING (public.is_gestor());
CREATE POLICY "feedback_delete" ON public.feedback FOR DELETE TO authenticated USING (public.is_gestor());
