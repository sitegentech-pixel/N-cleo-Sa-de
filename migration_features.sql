-- migration_features.sql
CREATE TABLE IF NOT EXISTS public.demandas_comentarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demanda_id BIGINT NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demandas_anexos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demanda_id BIGINT NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'mencao', 'comentario', 'atribuicao'
  titulo TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  link_id BIGINT,
  link_tipo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipe_metas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gestor_id UUID NOT NULL REFERENCES public.profiles(id),
  qtd_pendencias INT NOT NULL DEFAULT 0,
  qtd_demandas INT NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios_read" ON public.demandas_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_insert" ON public.demandas_comentarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "anexos_read" ON public.demandas_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos_insert" ON public.demandas_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anexos_delete" ON public.demandas_anexos FOR DELETE TO authenticated USING (autor_id = auth.uid() OR public.is_gestor());

CREATE POLICY "notificacoes_read" ON public.notificacoes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_update" ON public.notificacoes FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_insert" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "metas_read" ON public.equipe_metas FOR SELECT TO authenticated USING (true);
CREATE POLICY "metas_all" ON public.equipe_metas FOR ALL TO authenticated USING (public.is_gestor());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('anexos', 'anexos', true, 5242880, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anexos_storage_read" ON storage.objects FOR SELECT USING (bucket_id = 'anexos');
CREATE POLICY "anexos_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anexos');
CREATE POLICY "anexos_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anexos');
