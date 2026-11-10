create table public.semanario_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) > 0),
 role text not null check (role in ('teacher','director'))
);
create function public.semanario_author_name() returns text language sql stable security invoker set search_path = '' as $
 select name from public.semanario_profiles where user_id = (select auth.uid())
$;
revoke all on function public.semanario_author_name() from public, anon;
grant execute on function public.semanario_author_name() to authenticated;
create table public.semanario_plans (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.semanario_profiles(user_id),
 professor text not null default public.semanario_author_name(),
 start_date date not null,
 end_date date not null check (end_date >= start_date),
 turma text not null check (length(trim(turma)) > 0),
 disciplina text not null check (length(trim(disciplina)) > 0),
 aulas integer[] not null check (cardinality(aulas) > 0 and aulas <@ array[1,2,3,4,5,6]),
 paginas text not null check (length(trim(paginas)) > 0),
 conteudo text not null check (length(trim(conteudo)) > 0),
 tarefa text not null default '',
 obs text not null default ''
);
create index semanario_plans_owner_idx on public.semanario_plans(owner_id);
create table public.semanario_notes (
 plan_id uuid primary key references public.semanario_plans(id) on delete cascade,
 note text not null default ''
);
alter table public.semanario_profiles enable row level security;
alter table public.semanario_plans enable row level security;
alter table public.semanario_notes enable row level security;
revoke all on public.semanario_profiles, public.semanario_plans, public.semanario_notes from public, anon, authenticated;
grant select on public.semanario_profiles, public.semanario_plans, public.semanario_notes to authenticated;
grant insert (start_date,end_date,turma,disciplina,aulas,paginas,conteudo,tarefa,obs), update (start_date,end_date,turma,disciplina,aulas,paginas,conteudo,tarefa,obs) on public.semanario_plans to authenticated;
grant insert (plan_id,note), update (note) on public.semanario_notes to authenticated;
create policy semanario_profile_self on public.semanario_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy semanario_plans_read on public.semanario_plans for select to authenticated using (
 exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and (p.role = 'director' or owner_id = p.user_id))
);
create policy semanario_plans_create on public.semanario_plans for insert to authenticated with check (
 owner_id = (select auth.uid()) and exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')
);
create policy semanario_plans_edit on public.semanario_plans for update to authenticated
 using (owner_id = (select auth.uid()) and exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher'))
 with check (owner_id = (select auth.uid()) and exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher'));
create policy semanario_notes_read on public.semanario_notes for select to authenticated using (
 exists(select 1 from public.semanario_plans p where p.id = plan_id)
);
create policy semanario_notes_create on public.semanario_notes for insert to authenticated with check (
 exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'director')
);
create policy semanario_notes_edit on public.semanario_notes for update to authenticated
 using (exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'director'))
 with check (exists(select 1 from public.semanario_profiles p where p.user_id = (select auth.uid()) and p.role = 'director'));
