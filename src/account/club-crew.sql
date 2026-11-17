-- SAT Sprint clubhouse, part 3: crews. Run this in the Supabase project's SQL editor after club.sql and club-live.sql (see
-- src/README.md, "Clubhouse"); it is safe to run again.
--
-- A crew is 2 to 8 students who build a room together. One student makes it (and owns it) and shares its invite link
-- (#c-<32 hex digits>); a signed-in student with a nickname who opens the link can join, one crew at a time. Each practice
-- set a member finishes with 5 or more questions they have not counted for a crew before adds one study session to the
-- crew's project: 2 a day for each member, once the crew has 2 members. 20 sessions build a study corner, 30 more an aquarium
-- corner, and 40 more turn the whole room Deep Sea. The room keeps a line for each ("Our aquarium corner opened after 30
-- study sessions"), and each member sees it revealed the next time they open the crew. The crew's board shows who helped,
-- never scores.
--
-- How it works: a crew's row is locked while a session is added, so two members finishing at the same moment add two
-- sessions, and an upgrade is built once (club_crew_built has one row for each crew and upgrade); a session past an
-- upgrade's goal counts toward the next one. The owner can make a new link (the old one stops working) or switch it off,
-- rename the crew, hand it to another member, or remove someone (they cannot join that crew again). When the owner goes,
-- the member who joined first owns the crew; when the last member goes, the crew is deleted.

do $$ begin
  if to_regclass('public.club_profiles') is null then raise exception 'run club.sql first'; end if;
  if to_regprocedure('public.club_live_check(text)') is null then raise exception 'run club-live.sql first (the one with typed chat)'; end if;
end $$;

-- ---------- settings (change them in the Table editor, or with the queries at the end) ----------
create table if not exists public.club_crew_config (
  id          int primary key default 1 check (id = 1),
  crews_on    boolean not null default true,        -- false: no crew can be made or joined, and no sessions are added
  goals       int[] not null default '{20, 30, 40}' check (array_length(goals, 1) = 3),  -- sessions for each upgrade, in order
  day_cap     int not null default 2,               -- sessions each member can add a day
  min_qs      int not null default 5,               -- questions in a set that the student has not counted for a crew before
  max_members int not null default 8
);
insert into public.club_crew_config (id) values (1) on conflict (id) do nothing;

-- ---------- crews, and who is in them ----------
create table if not exists public.club_crews (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  owner   uuid references auth.users (id) on delete set null,
  link    text unique,                                     -- the invite link's 32 hex digits; null while it is off
  step    int not null default 0 check (step between 0 and 3),   -- upgrades built
  n       int not null default 0,                          -- sessions toward the next upgrade
  total   int not null default 0,                          -- every session
  made_by uuid references auth.users (id) on delete set null,
  made_at timestamptz not null default now()
);
create table if not exists public.club_crew_members (
  user_id   uuid primary key references auth.users (id) on delete cascade,   -- one crew for each student
  crew_id   uuid not null references public.club_crews (id) on delete cascade,
  joined_at timestamptz not null default now(),
  seen      int not null default 0                                         -- upgrades whose reveal this member has seen
);
create index if not exists club_crew_members_crew on public.club_crew_members (crew_id);
-- each upgrade, once
create table if not exists public.club_crew_built (
  crew_id  uuid not null references public.club_crews (id) on delete cascade,
  step     int not null check (step between 1 and 3),     -- 1 the study corner, 2 the aquarium corner, 3 Deep Sea
  sessions int not null,
  at       timestamptz not null default now(),
  primary key (crew_id, step)
);
-- each session: who added it (no one, once their account is gone), and the upgrade it went toward (3: after all three)
create table if not exists public.club_crew_adds (
  id      bigint generated always as identity primary key,
  crew_id uuid not null references public.club_crews (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  step    int not null,
  day     date not null,
  at      timestamptz not null default now()
);
create index if not exists club_crew_adds_user on public.club_crew_adds (user_id, day);
create index if not exists club_crew_adds_crew on public.club_crew_adds (crew_id, step);
-- the questions each student has counted for a crew (each counts once)
create table if not exists public.club_crew_qs (
  user_id uuid not null references auth.users (id) on delete cascade,
  qid     text not null,
  primary key (user_id, qid)
);
-- removed by a crew's owner: they cannot join that crew again
create table if not exists public.club_crew_bans (
  crew_id uuid not null references public.club_crews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (crew_id, user_id)
);

-- nothing is read or written directly: only through the functions below
do $$ declare t text; begin
  foreach t in array array['club_crew_config', 'club_crews', 'club_crew_members', 'club_crew_built', 'club_crew_adds', 'club_crew_qs',
                           'club_crew_bans'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------- small helpers (not callable from a page) ----------
-- the sessions an upgrade needs (s: upgrades built so far); null after the last
create or replace function public.club_crew_goal(s int) returns int
language sql stable set search_path = '' as $$ select (select goals from public.club_crew_config where id = 1)[s + 1] $$;
create or replace function public.club_crew_new_link() returns text
language sql volatile set search_path = '' as $$ select replace(gen_random_uuid()::text, '-', '') $$;
-- a crew's name as it is kept (spaces tidied), or null when it cannot be one: 3 to 24 letters, numbers, spaces, dots,
-- apostrophes or dashes, starting and ending with a letter or number, and nothing a nickname or a chat line could not say
create or replace function public.club_crew_name(p text) returns text
language plpgsql stable set search_path = '' as $$
declare n text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'); bare text := regexp_replace(lower(n), '[^a-z]', '', 'g');
begin
  if n !~ '^[A-Za-z0-9][A-Za-z0-9 .''-]{1,22}[A-Za-z0-9]$' or length(regexp_replace(n, '[^0-9]', '', 'g')) >= 7 then return null; end if;
  if exists (select 1 from public.club_words w where position(w.word in bare) > 0) then return null; end if;
  if public.club_live_check(n) is not null then return null; end if;
  return n;
end $$;
-- who added a session toward an upgrade (s: upgrades built before it), by nickname, in the order they first did
create or replace function public.club_crew_helpers(c uuid, s int) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(h.nickname order by h.first), '[]'::jsonb)
  from (select p.nickname, min(a.id) as first from public.club_crew_adds a join public.club_profiles p on p.user_id = a.user_id
        where a.crew_id = c and a.step = s and p.nickname is not null group by p.nickname) h
$$;
-- what the crew page shows the student: the settings it needs, the sessions they added today, and their crew (null when
-- they have none): its name, whether they own it (and then its link), upgrades built, sessions toward the next and in all,
-- the upgrades they have seen revealed, the members (each [nickname, character, 1 for the owner, 1 for them]), who helped
-- toward the next upgrade, and each upgrade built ([upgrade, day, sessions, who helped])
create or replace function public.club_crew_view(u uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('ok', true, 'on', g.crews_on, 'goals', to_jsonb(g.goals), 'cap', g.day_cap, 'min', g.min_qs, 'max', g.max_members,
    'today', (select count(*) from public.club_crew_adds where user_id = u and day = public.club_day()),
    'crew', (select jsonb_build_object('name', c.name, 'mine', c.owner is not distinct from u, 'link', case when c.owner = u then c.link end,
               'step', c.step, 'n', c.n, 'total', c.total, 'seen', m.seen,
               'members', (select jsonb_agg(jsonb_build_array(coalesce(p.nickname, ''),
                                    case when jsonb_typeof(a.layout -> 'av') = 'array' then a.layout -> 'av' else '[]'::jsonb end,
                                    (x.user_id = c.owner)::int, (x.user_id = u)::int) order by x.joined_at, x.user_id)
                           from public.club_crew_members x left join public.club_profiles p on p.user_id = x.user_id
                           left join public.club_rooms a on a.user_id = x.user_id where x.crew_id = c.id),
               'helpers', public.club_crew_helpers(c.id, c.step),
               'built', coalesce((select jsonb_agg(jsonb_build_array(b.step, to_char(b.at at time zone 'America/New_York', 'YYYY-MM-DD'), b.sessions,
                                                                    public.club_crew_helpers(c.id, b.step - 1)) order by b.step)
                                  from public.club_crew_built b where b.crew_id = c.id), '[]'::jsonb))
             from public.club_crew_members m join public.club_crews c on c.id = m.crew_id where m.user_id = u))
  from public.club_crew_config g where g.id = 1
$$;
-- the checks every call that changes something makes first: null when the student may go on, or why not (off, join,
-- locked, nick)
create or replace function public.club_crew_may(u uuid) returns text
language sql stable set search_path = '' as $$
  select case when not (select crews_on from public.club_crew_config where id = 1) then 'off'
              when p.user_id is null then 'join' when p.blocked then 'locked' when p.nickname is null then 'nick' end
  from (select 1) one left join public.club_profiles p on p.user_id = u
$$;
-- a student leaves their crew (the crew's row is locked first, as when a session is added)
create or replace function public.club_crew_drop(u uuid) returns void
language plpgsql set search_path = '' as $$
declare cid uuid := (select crew_id from public.club_crew_members where user_id = u);
begin
  if cid is null then return; end if;
  perform 1 from public.club_crews where id = cid for update;
  delete from public.club_crew_members where user_id = u;
end $$;
-- after a member goes (by leaving, being removed, or their account or clubhouse record going): the member who joined first
-- owns the crew if its owner went, and a crew with no one left is deleted
create or replace function public.club_crew_member_gone() returns trigger
language plpgsql security definer set search_path = '' as $$
declare nxt uuid;
begin
  select user_id into nxt from public.club_crew_members where crew_id = old.crew_id order by joined_at, user_id limit 1;
  if nxt is null then delete from public.club_crews where id = old.crew_id;
  else update public.club_crews set owner = nxt where id = old.crew_id and (owner is null or owner = old.user_id); end if;
  return null;
end $$;
drop trigger if exists club_crew_member_gone on public.club_crew_members;
create trigger club_crew_member_gone after delete on public.club_crew_members for each row execute function public.club_crew_member_gone();
-- a student blocked by the site's owner leaves their crew; erasing a clubhouse record leaves it too, and forgets which
-- questions they counted and that the sessions were theirs
create or replace function public.club_crew_profile_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.club_crew_drop(old.user_id);
    delete from public.club_crew_qs where user_id = old.user_id;
    update public.club_crew_adds set user_id = null where user_id = old.user_id;
  elsif new.blocked and not old.blocked then
    perform public.club_crew_drop(new.user_id);
  end if;
  return null;
end $$;
drop trigger if exists club_crew_profile_changed on public.club_profiles;
create trigger club_crew_profile_changed after update of blocked or delete on public.club_profiles
  for each row execute function public.club_crew_profile_changed();

-- ---------- the crew page: what to show ----------
create or replace function public.club_crew_state() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  return public.club_crew_view(u);
end $$;

-- ---------- making a crew (p_name): the student owns it, and its invite link is on ----------
-- Answers the view, or { ok: false, why }: off, join, locked, nick, crew (they are in one), name.
create or replace function public.club_crew_make(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); why text; nm text; cid uuid;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  why := public.club_crew_may(u);
  if why is not null then return jsonb_build_object('ok', false, 'why', why); end if;
  if exists (select 1 from public.club_crew_members where user_id = u) then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  nm := public.club_crew_name(p_name);
  if nm is null then return jsonb_build_object('ok', false, 'why', 'name'); end if;
  insert into public.club_crews (name, owner, link, made_by) values (nm, u, public.club_crew_new_link(), u) returning id into cid;
  begin
    insert into public.club_crew_members (user_id, crew_id) values (u, cid);
  exception when unique_violation then
    delete from public.club_crews where id = cid;
    return jsonb_build_object('ok', false, 'why', 'crew');
  end;
  return public.club_crew_view(u);
end $$;

-- ---------- an invite link (p_link): the crew it is for, before joining ----------
-- Answers { ok: true, name, members (nicknames), full, mine (already in it), other (in another crew), removed (the owner
-- removed them), blocked (a block between them and a member) } or { ok: false, why: closed }.
create or replace function public.club_crew_peek(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_crews; mine uuid := (select crew_id from public.club_crew_members where user_id = auth.uid());
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select * into c from public.club_crews where link = p_link and coalesce(p_link, '') ~ '^[0-9a-f]{32}$';
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'closed'); end if;
  return jsonb_build_object('ok', true, 'name', c.name,
    'members', coalesce((select jsonb_agg(coalesce(p.nickname, '') order by x.joined_at, x.user_id) from public.club_crew_members x
                         left join public.club_profiles p on p.user_id = x.user_id where x.crew_id = c.id), '[]'::jsonb),
    'full', (select count(*) from public.club_crew_members where crew_id = c.id) >= (select max_members from public.club_crew_config where id = 1),
    'mine', mine is not distinct from c.id, 'other', mine is not null and mine <> c.id,
    'removed', exists (select 1 from public.club_crew_bans where crew_id = c.id and user_id = u),
    'blocked', exists (select 1 from public.club_crew_members x where x.crew_id = c.id and public.club_live_blocked(u, x.user_id)));
end $$;

-- ---------- joining with an invite link (p_link) ----------
-- Answers the view, or { ok: false, why }: off, join, locked, nick, closed, removed, blocked, crew (in another one), full.
create or replace function public.club_crew_join(p_link text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); why text; c public.club_crews; mine uuid;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  why := public.club_crew_may(u);
  if why is not null then return jsonb_build_object('ok', false, 'why', why); end if;
  select * into c from public.club_crews where link = p_link and coalesce(p_link, '') ~ '^[0-9a-f]{32}$' for update;
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'closed'); end if;
  mine := (select crew_id from public.club_crew_members where user_id = u);
  if mine = c.id then return public.club_crew_view(u); end if;
  if exists (select 1 from public.club_crew_bans where crew_id = c.id and user_id = u) then return jsonb_build_object('ok', false, 'why', 'removed'); end if;
  if exists (select 1 from public.club_crew_members x where x.crew_id = c.id and public.club_live_blocked(u, x.user_id)) then
    return jsonb_build_object('ok', false, 'why', 'blocked');
  end if;
  if mine is not null then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  if (select count(*) from public.club_crew_members where crew_id = c.id) >= (select max_members from public.club_crew_config where id = 1) then
    return jsonb_build_object('ok', false, 'why', 'full');
  end if;
  begin
    -- upgrades built before they joined are not revealed to them
    insert into public.club_crew_members (user_id, crew_id, seen) values (u, c.id, c.step);
  exception when unique_violation then return jsonb_build_object('ok', false, 'why', 'crew');
  end;
  return public.club_crew_view(u);
end $$;

-- ---------- leaving ----------
create or replace function public.club_crew_leave() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  perform public.club_crew_drop(u);
  return public.club_crew_view(u);
end $$;

-- ---------- the owner: the invite link (p_on: a new link, or none), the name, handing over, removing someone ----------
-- Each answers the view, or { ok: false, why }: crew (not in one), owner (not its owner), name, gone (not in the crew).
create or replace function public.club_crew_link(p_on boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_crews;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select c2.* into c from public.club_crews c2 join public.club_crew_members m on m.crew_id = c2.id where m.user_id = u;
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  if c.owner is distinct from u then return jsonb_build_object('ok', false, 'why', 'owner'); end if;
  update public.club_crews set link = case when p_on then public.club_crew_new_link() end where id = c.id;
  return public.club_crew_view(u);
end $$;
create or replace function public.club_crew_rename(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_crews; nm text := public.club_crew_name(p_name);
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select c2.* into c from public.club_crews c2 join public.club_crew_members m on m.crew_id = c2.id where m.user_id = u;
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  if c.owner is distinct from u then return jsonb_build_object('ok', false, 'why', 'owner'); end if;
  if nm is null then return jsonb_build_object('ok', false, 'why', 'name'); end if;
  update public.club_crews set name = nm where id = c.id;
  return public.club_crew_view(u);
end $$;
create or replace function public.club_crew_hand(p_nick text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_crews; t uuid;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select c2.* into c from public.club_crews c2 join public.club_crew_members m on m.crew_id = c2.id where m.user_id = u;
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  if c.owner is distinct from u then return jsonb_build_object('ok', false, 'why', 'owner'); end if;
  select x.user_id into t from public.club_crew_members x join public.club_profiles p on p.user_id = x.user_id
  where x.crew_id = c.id and x.user_id <> u and lower(p.nickname) = lower(p_nick);
  if t is null then return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  update public.club_crews set owner = t where id = c.id;
  return public.club_crew_view(u);
end $$;
create or replace function public.club_crew_remove(p_nick text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_crews; t uuid;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select c2.* into c from public.club_crews c2 join public.club_crew_members m on m.crew_id = c2.id where m.user_id = u;
  if c.id is null then return jsonb_build_object('ok', false, 'why', 'crew'); end if;
  if c.owner is distinct from u then return jsonb_build_object('ok', false, 'why', 'owner'); end if;
  select x.user_id into t from public.club_crew_members x join public.club_profiles p on p.user_id = x.user_id
  where x.crew_id = c.id and x.user_id <> u and lower(p.nickname) = lower(p_nick);
  if t is null then return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  insert into public.club_crew_bans (crew_id, user_id) values (c.id, t) on conflict do nothing;
  perform public.club_crew_drop(t);
  return public.club_crew_view(u);
end $$;

-- ---------- a finished practice set (p: { s: 'm' or 'rw', q: [the ids of the questions answered] }) ----------
-- Adds a session when the set has 5 or more questions the student has not counted for a crew before, they have added
-- fewer than 2 today, and their crew has 2 members or more; those questions are then counted. Answers { ok: true, step
-- (upgrades built), n, goal, built (the upgrade this session built, or null), today } or { ok: false, why }: off, join,
-- locked, nick, crew (not in one), solo (the only member), day (2 today already, with today), few (with fresh).
create or replace function public.club_crew_add(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); why text; g public.club_crew_config; c public.club_crews; ids text[]; fresh int; today int; goal int; built int;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  why := public.club_crew_may(u);
  if why is not null then return jsonb_build_object('ok', false, 'why', why); end if;
  select * into g from public.club_crew_config where id = 1;
  select array(select distinct x from jsonb_array_elements_text(case when jsonb_typeof(p -> 'q') = 'array' then p -> 'q' else '[]'::jsonb end) x
               where x ~ '^[A-Za-z0-9_.:#/-]{1,40}$' limit 100) into ids;
  -- the crew's row is locked from here on, so the members' sessions are added one at a time
  select c2.* into c from public.club_crews c2 where c2.id = (select crew_id from public.club_crew_members where user_id = u) for update;
  if c.id is null or not exists (select 1 from public.club_crew_members where user_id = u and crew_id = c.id) then
    return jsonb_build_object('ok', false, 'why', 'crew');
  end if;
  if (select count(*) from public.club_crew_members where crew_id = c.id) < 2 then return jsonb_build_object('ok', false, 'why', 'solo'); end if;
  today := (select count(*) from public.club_crew_adds where user_id = u and day = public.club_day());
  if today >= g.day_cap then return jsonb_build_object('ok', false, 'why', 'day', 'today', today); end if;
  fresh := (select count(*) from unnest(ids) x where not exists (select 1 from public.club_crew_qs q where q.user_id = u and q.qid = x));
  if fresh < g.min_qs then return jsonb_build_object('ok', false, 'why', 'few', 'fresh', fresh); end if;
  insert into public.club_crew_qs (user_id, qid) select u, x from unnest(ids) x on conflict do nothing;
  insert into public.club_crew_adds (crew_id, user_id, step, day) values (c.id, u, c.step, public.club_day());
  c.n := c.n + 1; c.total := c.total + 1;
  goal := public.club_crew_goal(c.step);
  if goal is not null and c.n >= goal then
    insert into public.club_crew_built (crew_id, step, sessions) values (c.id, c.step + 1, goal) on conflict do nothing;
    c.step := c.step + 1; c.n := c.n - goal; built := c.step;
  end if;
  update public.club_crews set step = c.step, n = c.n, total = c.total where id = c.id;
  return jsonb_build_object('ok', true, 'step', c.step, 'n', c.n, 'goal', public.club_crew_goal(c.step), 'built', built, 'today', today + 1);
end $$;

-- ---------- a member has seen the reveal of the upgrades up to p_step ----------
create or replace function public.club_crew_seen(p_step int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  update public.club_crew_members m set seen = least(greatest(m.seen, coalesce(p_step, 0)), c.step)
  from public.club_crews c where c.id = m.crew_id and m.user_id = u;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- who may call what ----------
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'club\_crew\_%' loop
    execute 'revoke all on function ' || f || ' from public, anon, authenticated';
  end loop;
end $$;
grant execute on function public.club_crew_state(), public.club_crew_make(text), public.club_crew_peek(text), public.club_crew_join(text),
  public.club_crew_leave(), public.club_crew_link(boolean), public.club_crew_rename(text), public.club_crew_hand(text),
  public.club_crew_remove(text), public.club_crew_add(jsonb), public.club_crew_seen(int) to authenticated;

-- ---------- for the owner (paste into the SQL editor) ----------
-- Crews:                    select c.name, c.step as upgrades, c.n, c.total, (select count(*) from public.club_crew_members m where m.crew_id = c.id) as members,
--                           o.nickname as owner, c.made_at from public.club_crews c left join public.club_profiles o on o.user_id = c.owner order by c.made_at desc;
-- Who is in a crew:         select p.nickname, m.joined_at from public.club_crew_members m join public.club_profiles p on p.user_id = m.user_id
--                           where m.crew_id = (select id from public.club_crews where name = 'Crew name') order by m.joined_at;
-- Rename a crew:            update public.club_crews set name = 'New name' where name = 'Old name';
-- Delete a crew:            delete from public.club_crews where name = 'Crew name';
-- Switch crews off:         update public.club_crew_config set crews_on = false;   (and on again: set crews_on = true)
-- Change the goals:         update public.club_crew_config set goals = '{20, 30, 40}';   (the study corner, the aquarium corner, Deep Sea)
-- Someone out of crews:     the "Block someone" lines in club.sql also take them out of their crew.

select 'Crews are ready' as result;
