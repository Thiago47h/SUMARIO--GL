alter table public.semanario_plans add column revision integer not null default 1;
create function public.semanario_bump_revision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.revision := old.revision + 1;
 return new;
end $$;
revoke all on function public.semanario_bump_revision() from public, anon, authenticated;
create trigger semanario_revision_before_update before update on public.semanario_plans
for each row execute function public.semanario_bump_revision();

alter table public.semanario_notes
 add column review_status text not null default 'enviado' check(review_status in ('enviado','ajustes','aprovado')),
 add column reviewed_revision integer,
 add column reviewed_at timestamptz,
 add column reviewed_by uuid references auth.users(id),
 add constraint semanario_review_requires_revision check(review_status='enviado' or reviewed_revision is not null),
 add constraint semanario_adjustment_requires_note check(review_status<>'ajustes' or length(trim(note))>0);
grant insert (review_status,reviewed_revision), update (review_status,reviewed_revision) on public.semanario_notes to authenticated;

create function public.semanario_stamp_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.reviewed_at := clock_timestamp();
 new.reviewed_by := auth.uid();
 return new;
end $$;
revoke all on function public.semanario_stamp_review() from public, anon, authenticated;
create trigger semanario_review_stamp before insert or update on public.semanario_notes
for each row execute function public.semanario_stamp_review();

drop policy semanario_notes_create on public.semanario_notes;
drop policy semanario_notes_edit on public.semanario_notes;
create policy semanario_notes_create on public.semanario_notes for insert to authenticated with check (
 exists(select 1 from public.semanario_profiles p where p.user_id=(select auth.uid()) and p.role='director')
 and exists(select 1 from public.semanario_plans p where p.id=plan_id and p.deleted_at is null and (reviewed_revision is null or reviewed_revision <= p.revision))
);
create policy semanario_notes_edit on public.semanario_notes for update to authenticated
using (exists(select 1 from public.semanario_profiles p where p.user_id=(select auth.uid()) and p.role='director'))
with check (
 exists(select 1 from public.semanario_profiles p where p.user_id=(select auth.uid()) and p.role='director')
 and exists(select 1 from public.semanario_plans p where p.id=plan_id and p.deleted_at is null and (reviewed_revision is null or reviewed_revision <= p.revision))
);