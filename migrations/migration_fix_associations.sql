-- ============================================================
-- MIGRATION: Fix association by Name -> Association by UUID
-- ============================================================

-- 1. Add ID columns to pendencias
alter table public.pendencias add column if not exists responsavel_id uuid references public.profiles(id);
alter table public.pendencias add column if not exists criado_por_id uuid references public.profiles(id);

-- 2. Add ID columns to demandas
alter table public.demandas add column if not exists responsavel_id uuid references public.profiles(id);
alter table public.demandas add column if not exists criado_por_id uuid references public.profiles(id);

-- 3. Add ID column to demandas_historico
alter table public.demandas_historico add column if not exists editado_por_id uuid references public.profiles(id);

-- 4. Backfill existing data based on names
update public.pendencias p
set responsavel_id = (select id from public.profiles pr where pr.nome = p.responsavel limit 1),
    criado_por_id = (select id from public.profiles pr where pr.nome = p.criado_por limit 1);

update public.demandas d
set responsavel_id = (select id from public.profiles pr where pr.nome = d.responsavel limit 1),
    criado_por_id = (select id from public.profiles pr where pr.nome = d.criado_por limit 1);

update public.demandas_historico h
set editado_por_id = (select id from public.profiles pr where pr.nome = h.editado_por limit 1);

-- 5. Improve RLS (Security Audit)
-- Pendencias: Update only if manager or owner
drop policy if exists "pendencias: autenticados full" on public.pendencias;

create policy "pendencias: select" on public.pendencias for select to authenticated using (true);
create policy "pendencias: insert" on public.pendencias for insert to authenticated with check (true);
create policy "pendencias: update" on public.pendencias for update to authenticated 
  using (
    auth.uid() = responsavel_id 
    or auth.uid() = criado_por_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'gestor')
  );
create policy "pendencias: delete" on public.pendencias for delete to authenticated 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'gestor'));

-- Demandas: Update only if manager or owner
drop policy if exists "demandas: autenticados full" on public.demandas;

create policy "demandas: select" on public.demandas for select to authenticated using (true);
create policy "demandas: insert" on public.demandas for insert to authenticated with check (true);
create policy "demandas: update" on public.demandas for update to authenticated 
  using (
    auth.uid() = responsavel_id 
    or auth.uid() = criado_por_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'gestor')
  );
create policy "demandas: delete" on public.demandas for delete to authenticated 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'gestor'));

-- 6. Enable Realtime for Profiles and Historico
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.demandas_historico;
