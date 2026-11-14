-- SAT Sprint accounts: run this once in the Supabase project's SQL editor (see README, "Accounts").
-- One row per person holds their saved progress. Row rules let a signed-in person see and change only their own row.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  rev        bigint not null default 1,          -- goes up by one with every save; a save names the version it replaces
  data       jsonb not null default '{}'::jsonb, -- the same shape as a backup file's "data"
  updated_at timestamptz not null default now(),
  constraint progress_size check (pg_column_size(data) < 4000000)
);

alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
drop policy if exists "add own progress" on public.progress;
drop policy if exists "change own progress" on public.progress;
drop policy if exists "remove own progress" on public.progress;
create policy "read own progress"   on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own progress"    on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "change own progress" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "remove own progress" on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- "Delete my account": removes the signed-in person and, through the cascade above, their progress.
create or replace function public.delete_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
