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

  -- Deletar de auth.users (o ON DELETE CASCADE vai apagar public.profiles e tudo atrelado a ele)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
