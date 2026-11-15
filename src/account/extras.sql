-- SAT Sprint suggestions, visit counts and the daily keepalive: run this once in the Supabase project's SQL editor, after
-- setup.sql (see src/README.md, "Accounts"). It is safe to run again.
-- Visitors can only add: a message from the Ask or suggest page, or one to a day's count for a page. Nobody but the owner
-- (in the Supabase dashboard: Table editor, or the SQL editor) can read either.

-- ---------- messages from the Ask or suggest page ----------
-- No account, email or address is asked for or kept; the name is optional and can be a nickname.
create table if not exists public.suggestions (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('ask', 'add', 'change', 'wrong', 'tip')),
  part       text not null default '' check (char_length(part) <= 120),   -- the part of the site it is about
  body       text not null check (char_length(body) between 3 and 2000),
  name       text not null default '' check (char_length(name) <= 60)
);
alter table public.suggestions enable row level security;
drop policy if exists "anyone can send a message" on public.suggestions;
create policy "anyone can send a message" on public.suggestions for insert to anon, authenticated with check (true);
revoke all on public.suggestions from anon, authenticated;
grant insert (kind, part, body, name) on public.suggestions to anon, authenticated;

-- a flood guard: at most 30 messages from everyone together in 10 minutes
create or replace function public.suggestions_flood_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.suggestions where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'too many messages just now' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.suggestions_flood_guard() from public, anon, authenticated;
drop trigger if exists suggestions_flood_guard on public.suggestions;
create trigger suggestions_flood_guard before insert on public.suggestions for each row execute function public.suggestions_flood_guard();

-- ---------- visit counts: one row per day and page, nothing about who ----------
-- "visit" counts page loads; every other row counts the times that page was shown. Days are in UTC.
create table if not exists public.visits (
  day  date   not null default current_date,
  page text   not null check (page ~ '^[a-z0-9-]{1,40}$'),
  n    bigint not null default 0,
  primary key (day, page)
);
alter table public.visits enable row level security;
revoke all on public.visits from anon, authenticated;

create or replace function public.count_visit(p text) returns void
language sql security definer set search_path = '' as $$
  insert into public.visits as v (day, page, n) values (current_date, p, 1)
  on conflict (day, page) do update set n = v.n + 1;
$$;
revoke all on function public.count_visit(text) from public;
grant execute on function public.count_visit(text) to anon, authenticated;

-- ---------- the daily keepalive (.github/workflows/keepalive.yml) ----------
-- A Free project with too little database activity in a week is paused; this one small question each day prevents that.
create or replace function public.ping() returns text
language sql stable set search_path = '' as $$ select 'ok'::text $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

-- ---------- reading them (paste into the SQL editor) ----------
-- New messages:  select created_at, kind, part, name, body from public.suggestions order by created_at desc limit 50;
-- Each day:      select day, sum(n) filter (where page = 'visit') as visits, sum(n) filter (where page <> 'visit') as pages_shown
--                from public.visits group by day order by day desc limit 60;
-- Top pages:     select page, sum(n) as shown from public.visits where page <> 'visit' and day > current_date - 30
--                group by page order by shown desc limit 30;
