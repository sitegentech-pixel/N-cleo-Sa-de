-- migration_eventos.sql — eventos do calendário (pessoais, cooperativa, lembretes)
CREATE TABLE IF NOT EXISTS public.eventos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pessoal', -- 'pessoal' | 'cooperativa' | 'lembrete'
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  criado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eventos_data_idx ON public.eventos (data);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- pessoais/lembretes: só o dono vê; cooperativa: todos veem
CREATE POLICY "eventos_read" ON public.eventos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tipo = 'cooperativa');
CREATE POLICY "eventos_insert" ON public.eventos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "eventos_delete" ON public.eventos FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_gestor());
CREATE POLICY "eventos_update" ON public.eventos FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
