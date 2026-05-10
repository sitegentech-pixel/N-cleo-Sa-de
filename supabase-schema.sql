-- ============================================================
-- Núcleo Saúde Gestão — Supabase Schema
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/fmxgsqkxhcbydvaqzefs/sql
-- ============================================================

-- ---- profiles (espelha auth.users) ----
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  nome       text not null,
  role       text not null default 'funcionario' check (role in ('gestor', 'funcionario')),
  ativo      boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- qualquer autenticado lê todos os perfis
create policy "profiles: leitura autenticados"
  on public.profiles for select
  to authenticated
  using (true);

-- usuário atualiza próprio perfil; gestor atualiza qualquer um
create policy "profiles: update próprio"
  on public.profiles for update
  to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'gestor'
    )
  );

-- insert via trigger de novo usuário (ou gestor)
create policy "profiles: insert gestor"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'gestor'
    )
  );


-- ---- pendencias ----
create table if not exists public.pendencias (
  id          bigserial primary key,
  titulo      text not null,
  descricao   text,
  status      text not null default 'nao-concluido',
  responsavel text,
  criado_por  text not null,
  urgente     boolean not null default false,
  prazo       date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pendencias enable row level security;

create policy "pendencias: autenticados full"
  on public.pendencias for all
  to authenticated
  using (true)
  with check (true);

-- trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger pendencias_updated_at
  before update on public.pendencias
  for each row execute function public.set_updated_at();


-- ---- demandas ----
create table if not exists public.demandas (
  id          bigserial primary key,
  titulo      text not null,
  descricao   text,
  status      text not null default 'aberta',
  responsavel text,
  criado_por  text not null,
  urgente     boolean not null default false,
  prazo       date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.demandas enable row level security;

create policy "demandas: autenticados full"
  on public.demandas for all
  to authenticated
  using (true)
  with check (true);

create trigger demandas_updated_at
  before update on public.demandas
  for each row execute function public.set_updated_at();


-- ---- demandas_historico ----
create table if not exists public.demandas_historico (
  id          bigserial primary key,
  demanda_id  bigint not null references public.demandas(id) on delete cascade,
  editado_por text not null,
  campo       text not null,
  valor_antigo text,
  valor_novo   text,
  criado_em   timestamptz not null default now()
);

alter table public.demandas_historico enable row level security;

create policy "historico: autenticados read"
  on public.demandas_historico for select
  to authenticated
  using (true);

create policy "historico: autenticados insert"
  on public.demandas_historico for insert
  to authenticated
  with check (true);


-- ---- storage bucket avatares ----
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares: leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "avatares: upload autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatares');

create policy "avatares: update autenticado"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatares');

create policy "avatares: delete autenticado"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatares');


-- ---- trigger: cria profile automaticamente no signup ----
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nome, role, ativo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'funcionario',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---- realtime ----
alter publication supabase_realtime add table public.pendencias;
alter publication supabase_realtime add table public.demandas;
