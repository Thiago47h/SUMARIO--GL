grant insert (user_id, name, role) on public.semanario_profiles to authenticated;
create policy semanario_teacher_self_signup on public.semanario_profiles for insert to authenticated
with check (
 user_id = (select auth.uid())
 and role = 'teacher'
 and length(trim(name)) between 2 and 120
);