CREATE OR REPLACE FUNCTION public.hard_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas gestor pode deletar
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gestor') THEN
    RAISE EXCEPTION 'Apenas gestores podem excluir usuários';
  END IF;

  -- Nullar referências em pendencias
  UPDATE public.pendencias SET responsavel_id = NULL WHERE responsavel_id = target_user_id;
  UPDATE public.pendencias SET criado_por_id  = NULL WHERE criado_por_id  = target_user_id;

  -- Nullar referências em demandas
  UPDATE public.demandas SET responsavel_id = NULL WHERE responsavel_id = target_user_id;
  UPDATE public.demandas SET criado_por_id  = NULL WHERE criado_por_id  = target_user_id;

  -- Nullar referências em demandas_historico
  UPDATE public.demandas_historico SET autor_id = NULL WHERE autor_id = target_user_id;

  -- Nullar referências em equipe_metas (gestor_id NOT NULL — deletar a meta em vez de nullar)
  DELETE FROM public.equipe_metas WHERE gestor_id = target_user_id;

  -- Deletar de auth.users (CASCADE apaga public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
