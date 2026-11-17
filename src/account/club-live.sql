-- SAT Sprint clubhouse, part 2: live rooms. Run this in the Supabase project's SQL editor after club.sql (see src/README.md,
-- "Clubhouse"); it is safe to run again. Then turn off Realtime > Settings > "Allow public access to channels", so that only
-- the students in a room can hear it and no page can send anything on a channel by itself.
--
-- A signed-in student who opens a shared room's link can join it live: up to 8 in a room and 20 across the site. Each one
-- is a figure in the room (the color and hat from their own room, with their nickname) that walks where they tap, and can
-- send a reaction or a quick phrase from a fixed list: nobody types. Anyone can mute someone on their own screen, block them
-- (they cannot come into your room, and neither of you sees the other in any room) or report them (kept here for the site's
-- owner, with what they did last). A room's owner can ask someone to leave (they cannot come back that day), and stopping
-- sharing ends every live visit.
--
-- How it works: each room has a private Realtime channel (its topic) that the pages in it listen to and never send on. Every
-- move, reaction and phrase goes through club_live_say, which checks it, counts it and sends it with realtime.send. Only a
-- student with a place in the room (a lease, kept while their page pings every 30 seconds) may listen to its topic: that is
-- the policy on realtime.messages near the end. Realtime checks it when a page starts listening, so asking someone to leave
-- moves the room to a new topic, which they cannot listen to.
--
-- The Free plan allows 2 million Realtime messages a month, and a message sent to a room counts once plus once for each page
-- in it. club_live_say counts the same way and stops at 1,000,000 in any 30 days (club_live_config.month_cap); each student
-- has 400 joins, moves, reactions and phrases a day. When either runs out, live rooms rest and saved rooms still show.

do $$ begin
  if to_regclass('public.club_profiles') is null then raise exception 'run club.sql first'; end if;
  if to_regprocedure('realtime.send(jsonb, text, text, boolean)') is null or to_regprocedure('realtime.topic()') is null then
    raise exception 'this project cannot send Realtime messages from the database (realtime.send is missing)';
  end if;
end $$;

-- ---------- settings (change them in the Table editor, or with the queries at the end) ----------
create table if not exists public.club_live_config (
  id        int primary key default 1 check (id = 1),
  live_on   boolean not null default true,    -- false closes every live room, and no one can join
  month_cap int not null default 1000000,     -- messages in any 30 days (the Free plan allows 2 million a month)
  room_cap  int not null default 8,           -- students in one room
  site_cap  int not null default 20,          -- students in live rooms across the site
  day_cap   int not null default 400          -- joins, moves, reactions and phrases per student per day
);
insert into public.club_live_config (id) values (1) on conflict (id) do nothing;

-- ---------- rooms, and who is in them ----------
-- every room that has been live: the topic its pages listen to now, and the salt that gives each student in it a short id
create table if not exists public.club_live_rooms (
  room_id uuid primary key references auth.users (id) on delete cascade,   -- the room's owner
  topic   text not null unique,
  salt    text not null
);
-- a place in a room: one room at a time, kept while the page pings
create table if not exists public.club_live_leases (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  room_id   uuid not null references auth.users (id) on delete cascade,
  pid       text not null,                       -- the id the others' pages see (never the account's id)
  x         int not null,                        -- where the figure stands, in % of the room's width
  y         int not null,                        -- and of its height (the floor is 78 to 98)
  joined_at timestamptz not null default now(),
  seen_at   timestamptz not null default now(),  -- the page's last ping
  acted_at  timestamptz not null default now(),  -- the last time the student did anything on the page
  walk_at   timestamptz,                         -- the last move
  say_at    timestamptz                          -- the last reaction or phrase
);
create index if not exists club_live_leases_room on public.club_live_leases (room_id);
-- why a place ended, for the page's next ping: removed, closed, off, rest, locked, idle, expired
create table if not exists public.club_live_gone (
  user_id uuid primary key references auth.users (id) on delete cascade,
  why     text not null,
  at      timestamptz not null default now()
);
-- messages sent each day (for the 30-day limit), and each student's actions each day
create table if not exists public.club_live_budget (day date primary key, sent bigint not null default 0);
create table if not exists public.club_live_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  n       int not null default 0,
  primary key (user_id, day)
);
-- asked to leave a room: not back in it until `until`
create table if not exists public.club_live_bans (
  room_id uuid not null references auth.users (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  until   timestamptz not null,
  primary key (room_id, user_id)
);
-- user_id blocked blocked_id
create table if not exists public.club_blocks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  at         timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);
create index if not exists club_blocks_other on public.club_blocks (blocked_id);
-- reports, for the site's owner (see the end of this file)
create table if not exists public.club_reports (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  from_id    uuid references auth.users (id) on delete set null,
  about_id   uuid references auth.users (id) on delete set null,
  room_id    uuid references auth.users (id) on delete set null,
  reason     text not null check (reason in ('spam', 'unkind', 'other')),
  from_nick  text,                                -- the nicknames when it was sent
  about_nick text,
  room_nick  text,
  recent     jsonb not null default '[]'::jsonb,  -- what the reported student did in the room in the 30 minutes before
  done       boolean not null default false       -- set it once you have dealt with it
);
-- the last 7 days of joins, leaves, reactions, phrases, removals and blocks in each room (moves are not kept), for reports
create table if not exists public.club_live_log (
  id      bigint generated always as identity primary key,
  room_id uuid not null,
  user_id uuid not null,
  kind    text not null,
  value   text not null default '',
  at      timestamptz not null default now()
);
create index if not exists club_live_log_at on public.club_live_log (at);

-- nothing is read or written directly: only through the functions below
do $$ declare t text; begin
  foreach t in array array['club_live_config', 'club_live_rooms', 'club_live_leases', 'club_live_gone', 'club_live_budget',
                           'club_live_usage', 'club_live_bans', 'club_blocks', 'club_reports', 'club_live_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------- small helpers (not callable from a page) ----------
-- the reactions and quick phrases a page may send (the page has the same lists, with the words: src/site/live.js)
create or replace function public.club_live_words() returns jsonb
language sql immutable set search_path = '' as $$
  select '{"react": ["clap", "fire", "party", "laugh", "heart", "wow"],
           "say": ["hi", "nice", "study", "luck", "gotthis", "great", "thanks", "practice", "brb", "bye"]}'::jsonb
$$;
create or replace function public.club_live_new_topic() returns text
language sql volatile set search_path = '' as $$ select 'live-' || replace(gen_random_uuid()::text, '-', '') $$;
-- a block between two students, either way
create or replace function public.club_live_blocked(a uuid, b uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.club_blocks where (user_id = a and blocked_id = b) or (user_id = b and blocked_id = a))
$$;
-- messages sent in the last 30 days
create or replace function public.club_live_spent() returns bigint
language sql stable set search_path = '' as $$
  select coalesce(sum(sent), 0)::bigint from public.club_live_budget where day > public.club_day() - 30
$$;
-- one more action for a student today; false once the day's allowance is used
create or replace function public.club_live_use(u uuid) returns boolean
language plpgsql set search_path = '' as $$
declare used int;
begin
  insert into public.club_live_usage as g (user_id, day, n) values (u, public.club_day(), 1)
  on conflict (user_id, day) do update set n = g.n + 1 returning g.n into used;
  return used <= (select day_cap from public.club_live_config where id = 1);
end $$;

-- send to a room's pages, counted as 1 plus each page in the room; refused (false) when that would pass the 30-day limit,
-- unless `always` (saying that someone left, or that the room closed)
create or replace function public.club_live_send(room uuid, ev text, body jsonb, always boolean default false) returns boolean
language plpgsql set search_path = '' as $$
declare t text := (select topic from public.club_live_rooms where room_id = room);
  cost int := 1 + (select count(*) from public.club_live_leases where room_id = room);
begin
  if t is null then return false; end if;
  if not always and public.club_live_spent() + cost > (select month_cap from public.club_live_config where id = 1) then return false; end if;
  insert into public.club_live_budget as b (day, sent) values (public.club_day(), cost)
  on conflict (day) do update set sent = b.sent + excluded.sent;
  perform realtime.send(body, ev, t, true);
  return true;
end $$;

-- a place ends; `why` is kept for the student's page (null when they left themselves), and the room is told when `tell`
create or replace function public.club_live_drop(u uuid, why text, tell boolean) returns void
language plpgsql set search_path = '' as $$
declare l public.club_live_leases;
begin
  delete from public.club_live_leases where user_id = u returning * into l;
  if l.user_id is null then return; end if;
  if why is not null then
    insert into public.club_live_gone (user_id, why) values (u, why) on conflict (user_id) do update set why = excluded.why, at = now();
  end if;
  insert into public.club_live_log (room_id, user_id, kind, value) values (l.room_id, u, 'leave', coalesce(why, ''));
  if tell and exists (select 1 from public.club_live_leases where room_id = l.room_id) then
    perform public.club_live_send(l.room_id, 'bye', jsonb_build_object('p', l.pid), true);
  end if;
end $$;

-- someone has to leave a room: the room is told, and moves to a new topic that they cannot listen to
create or replace function public.club_live_kick(room uuid, u uuid, why text) returns void
language plpgsql set search_path = '' as $$
declare l public.club_live_leases;
begin
  perform 1 from public.club_live_rooms where room_id = room for update;
  select * into l from public.club_live_leases where user_id = u and room_id = room;
  if l.user_id is null then return; end if;
  perform public.club_live_send(room, 'moved', jsonb_build_object('p', l.pid), true);
  perform public.club_live_drop(u, why, false);
  update public.club_live_rooms set topic = public.club_live_new_topic() where room_id = room;
end $$;

-- every live visit to a room ends (sharing stopped, its owner blocked, live rooms switched off)
create or replace function public.club_live_close(room uuid, why text) returns void
language plpgsql set search_path = '' as $$
begin
  perform 1 from public.club_live_rooms where room_id = room for update;
  if not found then return; end if;
  if exists (select 1 from public.club_live_leases where room_id = room) then
    perform public.club_live_send(room, 'closed', jsonb_build_object('why', why), true);
    insert into public.club_live_gone (user_id, why) select user_id, why from public.club_live_leases where room_id = room
    on conflict (user_id) do update set why = excluded.why, at = now();
    insert into public.club_live_log (room_id, user_id, kind, value) select room, user_id, 'leave', why from public.club_live_leases where room_id = room;
    delete from public.club_live_leases where room_id = room;
  end if;
  update public.club_live_rooms set topic = public.club_live_new_topic() where room_id = room;
end $$;

-- places whose page stopped pinging (75 seconds), or whose student did nothing for 6 minutes (the page leaves at 5)
create or replace function public.club_live_clean() returns void
language plpgsql set search_path = '' as $$
begin
  with d as (
    delete from public.club_live_leases where seen_at < now() - interval '75 seconds' or acted_at < now() - interval '6 minutes'
    returning user_id, room_id, case when seen_at < now() - interval '75 seconds' then 'expired' else 'idle' end as why
  ), g as (
    insert into public.club_live_gone (user_id, why) select user_id, why from d
    on conflict (user_id) do update set why = excluded.why, at = now()
  )
  insert into public.club_live_log (room_id, user_id, kind, value) select room_id, user_id, 'leave', why from d;
end $$;

-- what a page in a room shows: its topic, its own id, who is there (each [id, nickname, color, hat, x, y, 1 for the room's
-- owner, the whole character from the saved room: color, hat, skin, boy or girl, skin tone, hair]), the ids not to show (a
-- block either way), and how many actions the student has left today. A page from before character skins reads the first
-- seven and draws the color and hat.
create or replace function public.club_live_view(u uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('ok', true, 'topic', r.topic, 'me', l.pid, 'mine', l.room_id = u,
    'members', coalesce((
      select jsonb_agg(jsonb_build_array(m.pid, coalesce(p.nickname, ''), coalesce(a.layout -> 'av' ->> 0, 'violet'),
                                         coalesce(a.layout -> 'av' ->> 1, ''), m.x, m.y, (m.user_id = m.room_id)::int,
                                         case when jsonb_typeof(a.layout -> 'av') = 'array' then a.layout -> 'av' else '[]'::jsonb end)
                        order by m.joined_at)
      from public.club_live_leases m
      left join public.club_profiles p on p.user_id = m.user_id
      left join public.club_rooms a on a.user_id = m.user_id
      where m.room_id = l.room_id and not public.club_live_blocked(u, m.user_id)), '[]'::jsonb),
    'hide', coalesce((select jsonb_agg(m.pid) from public.club_live_leases m
                      where m.room_id = l.room_id and m.user_id <> u and public.club_live_blocked(u, m.user_id)), '[]'::jsonb),
    'left', greatest(0, c.day_cap - coalesce((select n from public.club_live_usage where user_id = u and day = public.club_day()), 0)))
  from public.club_live_leases l join public.club_live_rooms r on r.room_id = l.room_id, public.club_live_config c
  where l.user_id = u and c.id = 1
$$;

-- ---------- joining a room live (p_link: the room's share link) ----------
-- Answers the view above, or { ok: false, why } with why one of: off (live rooms are switched off), join (not in the
-- clubhouse yet), locked (the site's owner blocked this account), nick (no nickname yet), closed (the room is not shared),
-- removed (asked to leave it today), blocked (a block between this student and the room's owner), rest (the 30-day
-- allowance is used), full (8 in the room), busy (20 live across the site), day (the day's actions are used).
create or replace function public.club_live_join(p_link text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c public.club_live_config; me public.club_profiles; r public.club_rooms; o public.club_profiles;
  lr public.club_live_rooms; l public.club_live_leases; pid text;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select * into c from public.club_live_config where id = 1;
  if not c.live_on or coalesce((select rules is null from public.club_rules where id = 1), true) then return jsonb_build_object('ok', false, 'why', 'off'); end if;
  select * into me from public.club_profiles where user_id = u;
  if me.user_id is null then return jsonb_build_object('ok', false, 'why', 'join'); end if;
  if me.blocked then return jsonb_build_object('ok', false, 'why', 'locked'); end if;
  if me.nickname is null then return jsonb_build_object('ok', false, 'why', 'nick'); end if;
  select * into r from public.club_rooms where link = p_link and coalesce(p_link, '') ~ '^[0-9a-f]{32}$';
  select * into o from public.club_profiles where user_id = r.user_id;
  if r.user_id is null or coalesce(o.blocked, true) then return jsonb_build_object('ok', false, 'why', 'closed'); end if;
  if exists (select 1 from public.club_live_bans where room_id = r.user_id and user_id = u and until > now()) then
    return jsonb_build_object('ok', false, 'why', 'removed');
  end if;
  if public.club_live_blocked(u, r.user_id) then return jsonb_build_object('ok', false, 'why', 'blocked'); end if;
  -- one join at a time, so that the room and site limits hold exactly
  perform pg_advisory_xact_lock(hashtext('club_live_join'));
  perform public.club_live_clean();
  if public.club_live_spent() >= c.month_cap then return jsonb_build_object('ok', false, 'why', 'rest'); end if;
  insert into public.club_live_rooms (room_id, topic, salt) values (r.user_id, public.club_live_new_topic(), md5(gen_random_uuid()::text))
  on conflict (room_id) do nothing;
  select * into lr from public.club_live_rooms where room_id = r.user_id;
  select * into l from public.club_live_leases where user_id = u;
  if l.room_id = r.user_id then   -- back after a dropped connection: the same place
    update public.club_live_leases set seen_at = now(), acted_at = now() where user_id = u;
    delete from public.club_live_gone where user_id = u;
    return public.club_live_view(u);
  end if;
  if (select count(*) from public.club_live_leases where room_id = r.user_id) >= c.room_cap then return jsonb_build_object('ok', false, 'why', 'full'); end if;
  if (select count(*) from public.club_live_leases where user_id <> u) >= c.site_cap then return jsonb_build_object('ok', false, 'why', 'busy'); end if;
  if not public.club_live_use(u) then return jsonb_build_object('ok', false, 'why', 'day'); end if;
  if l.user_id is not null then perform public.club_live_drop(u, null, true); end if;   -- leaving another room
  delete from public.club_live_gone where user_id = u;
  pid := left(md5(lr.salt || u::text), 10);
  insert into public.club_live_leases (user_id, room_id, pid, x, y)
  values (u, r.user_id, pid, 40 + floor(random() * 50)::int, 86 + floor(random() * 10)::int);
  insert into public.club_live_log (room_id, user_id, kind) values (r.user_id, u, 'join');
  if (select count(*) from public.club_live_leases where room_id = r.user_id) > 1 then
    perform public.club_live_send(r.user_id, 'hi', jsonb_build_object('p', pid), true);
  end if;
  -- tidy up
  delete from public.club_live_log where at < now() - interval '7 days';
  delete from public.club_live_usage where day < public.club_day() - 2;
  delete from public.club_live_budget where day < public.club_day() - 40;
  delete from public.club_live_bans where until < now();
  delete from public.club_live_gone where at < now() - interval '1 day';
  return public.club_live_view(u);
end $$;

-- ---------- every 30 seconds while a page is in a room (p_active: the student did something on it since the last one) ----------
-- Answers the view, or { ok: false, why } with why the place ended (see club_live_gone; expired when the page was away).
create or replace function public.club_live_ping(p_active boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.club_live_leases;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  perform public.club_live_clean();
  update public.club_live_leases set seen_at = now(), acted_at = case when p_active then now() else acted_at end
  where user_id = u returning * into l;
  if l.user_id is null then
    return jsonb_build_object('ok', false, 'why', coalesce((select why from public.club_live_gone where user_id = u), 'expired'));
  end if;
  if public.club_live_spent() >= (select month_cap from public.club_live_config where id = 1) then
    perform public.club_live_drop(u, 'rest', false);
    return jsonb_build_object('ok', false, 'why', 'rest');
  end if;
  return public.club_live_view(u);
end $$;

-- ---------- leaving (the Leave button, closing the page, or 5 quiet minutes) ----------
create or replace function public.club_live_leave() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  perform public.club_live_drop(u, null, true);
  delete from public.club_live_gone where user_id = u;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- a move (p_kind 'walk', with p_x and p_y in % of the room), a reaction ('react', p_key) or a phrase ('say') ----------
-- At most one move every 2 seconds and one reaction or phrase every 3, so that even a full site stays under the Free
-- plan's 100 messages a second. Answers { ok: true, left } or { ok: false, why }: wait (with ms), day, rest, off, form,
-- or why the place ended.
create or replace function public.club_live_say(p_kind text, p_key text default null, p_x int default null, p_y int default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.club_live_leases; c public.club_live_config; ev text; body jsonb; wait_ms int;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select * into l from public.club_live_leases where user_id = u for update;
  if l.user_id is null or l.seen_at < now() - interval '75 seconds' then
    return jsonb_build_object('ok', false, 'why', coalesce((select why from public.club_live_gone where user_id = u), 'expired'));
  end if;
  select * into c from public.club_live_config where id = 1;
  if not c.live_on then return jsonb_build_object('ok', false, 'why', 'off'); end if;
  if p_kind = 'walk' and p_x is not null and p_y is not null then
    ev := 'w';
    body := jsonb_build_object('p', l.pid, 'x', least(greatest(p_x, 5), 95), 'y', least(greatest(p_y, 78), 98));
    wait_ms := ceil(extract(epoch from (l.walk_at + interval '2 seconds' - now())) * 1000);
  elsif p_kind in ('react', 'say') and coalesce(public.club_live_words() -> p_kind ? p_key, false) then
    ev := case p_kind when 'react' then 'r' else 's' end;
    body := jsonb_build_object('p', l.pid, 'k', p_key);
    wait_ms := ceil(extract(epoch from (l.say_at + interval '3 seconds' - now())) * 1000);
  else
    return jsonb_build_object('ok', false, 'why', 'form');
  end if;
  if wait_ms > 0 then return jsonb_build_object('ok', false, 'why', 'wait', 'ms', wait_ms); end if;
  if not public.club_live_use(u) then return jsonb_build_object('ok', false, 'why', 'day'); end if;
  if not public.club_live_send(l.room_id, ev, body) then
    perform public.club_live_drop(u, 'rest', false);
    return jsonb_build_object('ok', false, 'why', 'rest');
  end if;
  if ev = 'w' then
    update public.club_live_leases set x = (body ->> 'x')::int, y = (body ->> 'y')::int, walk_at = now(), acted_at = now(), seen_at = now() where user_id = u;
  else
    update public.club_live_leases set say_at = now(), acted_at = now(), seen_at = now() where user_id = u;
    insert into public.club_live_log (room_id, user_id, kind, value) values (l.room_id, u, p_kind, p_key);
  end if;
  return jsonb_build_object('ok', true, 'left', greatest(0, c.day_cap - (select n from public.club_live_usage where user_id = u and day = public.club_day())));
end $$;

-- ---------- a room's owner asks someone to leave (p_pid: the id their page shows); they cannot come back for a day ----------
create or replace function public.club_live_remove(p_pid text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); t public.club_live_leases;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select * into t from public.club_live_leases where room_id = u and pid = p_pid and user_id <> u;
  if t.user_id is null then return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  insert into public.club_live_bans (room_id, user_id, until) values (u, t.user_id, now() + interval '1 day')
  on conflict (room_id, user_id) do update set until = excluded.until;
  insert into public.club_live_log (room_id, user_id, kind) values (u, t.user_id, 'removed');
  perform public.club_live_kick(u, t.user_id, 'removed');
  return coalesce(public.club_live_view(u), jsonb_build_object('ok', true));
end $$;

-- ---------- block someone in the room: they cannot come into your room, and neither of you sees the other in any room ----------
-- In your own room they leave it; if they own the room you are in, you leave it ({ ok: true, out: true }).
create or replace function public.club_live_block(p_pid text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.club_live_leases; t public.club_live_leases;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  select * into l from public.club_live_leases where user_id = u;
  select * into t from public.club_live_leases where room_id = l.room_id and pid = p_pid and user_id <> u;
  if l.user_id is null or t.user_id is null then return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  insert into public.club_blocks (user_id, blocked_id) values (u, t.user_id) on conflict do nothing;
  insert into public.club_live_log (room_id, user_id, kind) values (l.room_id, t.user_id, 'blocked');
  if l.room_id = u then
    perform public.club_live_kick(u, t.user_id, 'removed');
  elsif t.user_id = l.room_id then
    perform public.club_live_drop(u, null, true);
    return jsonb_build_object('ok', true, 'out', true);
  end if;
  return public.club_live_view(u);
end $$;

-- the nicknames a student has blocked, newest first; and unblocking one
create or replace function public.club_live_blocks() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(p.nickname order by b.at desc) from public.club_blocks b
                   join public.club_profiles p on p.user_id = b.blocked_id where b.user_id = u and p.nickname is not null), '[]'::jsonb);
end $$;
create or replace function public.club_live_unblock(p_nick text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  delete from public.club_blocks where user_id = u and blocked_id in (select user_id from public.club_profiles where lower(nickname) = lower(p_nick));
  return public.club_live_blocks();
end $$;

-- ---------- report someone in the room to the site's owner (p_why: spam, unkind or other); 10 a day ----------
create or replace function public.club_live_report(p_pid text, p_why text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.club_live_leases; t public.club_live_leases;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  if coalesce(p_why, '') not in ('spam', 'unkind', 'other') then return jsonb_build_object('ok', false, 'why', 'form'); end if;
  select * into l from public.club_live_leases where user_id = u;
  select * into t from public.club_live_leases where room_id = l.room_id and pid = p_pid and user_id <> u;
  if l.user_id is null or t.user_id is null then return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  if (select count(*) from public.club_reports where from_id = u and at > now() - interval '1 day') >= 10 then
    return jsonb_build_object('ok', false, 'why', 'day');
  end if;
  insert into public.club_reports (from_id, about_id, room_id, reason, from_nick, about_nick, room_nick, recent)
  values (u, t.user_id, l.room_id, p_why,
    (select nickname from public.club_profiles where user_id = u),
    (select nickname from public.club_profiles where user_id = t.user_id),
    (select nickname from public.club_profiles where user_id = l.room_id),
    coalesce((select jsonb_agg(jsonb_build_array(to_char(g.at at time zone 'America/New_York', 'YYYY-MM-DD HH24:MI:SS'), g.kind, g.value) order by g.at)
              from (select * from public.club_live_log where room_id = l.room_id and user_id = t.user_id and at > now() - interval '30 minutes'
                    order by at desc limit 30) g), '[]'::jsonb));
  return jsonb_build_object('ok', true);
end $$;

-- ---------- how many are live in a shared room now, for its page (anyone with the link, signed in or not) ----------
create or replace function public.club_live_count(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r public.club_rooms; c public.club_live_config;
begin
  select * into c from public.club_live_config where id = 1;
  select * into r from public.club_rooms where link = p_link and coalesce(p_link, '') ~ '^[0-9a-f]{32}$';
  return jsonb_build_object('on', c.live_on and public.club_live_spent() < c.month_cap,
    'n', case when r.user_id is null then 0 else (select count(*) from public.club_live_leases where room_id = r.user_id and seen_at > now() - interval '75 seconds') end);
end $$;

-- ---------- who may listen to a room's topic: the students with a place in it ----------
create or replace function public.club_live_can_listen(p_topic text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.club_live_leases l join public.club_live_rooms r on r.room_id = l.room_id
                 where l.user_id = auth.uid() and r.topic = p_topic and l.seen_at > now() - interval '75 seconds')
$$;
drop policy if exists "club live: the students in a room listen to it" on realtime.messages;
create policy "club live: the students in a room listen to it" on realtime.messages for select to authenticated
  using (realtime.messages.extension = 'broadcast' and public.club_live_can_listen(realtime.topic()));

-- ---------- what ends live visits by itself ----------
-- the room's link switched off or changed (or the room deleted)
create or replace function public.club_live_room_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or new.link is distinct from old.link then perform public.club_live_close(old.user_id, 'closed'); end if;
  return null;
end $$;
drop trigger if exists club_live_room_changed on public.club_rooms;
create trigger club_live_room_changed after update of link or delete on public.club_rooms
  for each row execute function public.club_live_room_changed();
-- a student blocked by the site's owner, or their clubhouse record erased
create or replace function public.club_live_profile_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.club_live_close(old.user_id, 'closed');
    perform public.club_live_drop(old.user_id, null, true);
  elsif new.blocked and not old.blocked then
    perform public.club_live_close(new.user_id, 'closed');
    perform public.club_live_drop(new.user_id, 'locked', true);
  end if;
  return null;
end $$;
drop trigger if exists club_live_profile_changed on public.club_profiles;
create trigger club_live_profile_changed after update of blocked or delete on public.club_profiles
  for each row execute function public.club_live_profile_changed();
-- live rooms switched off
create or replace function public.club_live_config_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r uuid;
begin
  if old.live_on and not new.live_on then
    for r in select room_id from public.club_live_rooms loop perform public.club_live_close(r, 'off'); end loop;
  end if;
  return null;
end $$;
drop trigger if exists club_live_config_changed on public.club_live_config;
create trigger club_live_config_changed after update on public.club_live_config
  for each row execute function public.club_live_config_changed();

-- ---------- who may call what ----------
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'club\_live\_%' loop
    execute 'revoke all on function ' || f || ' from public, anon, authenticated';
  end loop;
end $$;
grant execute on function public.club_live_join(text), public.club_live_ping(boolean), public.club_live_leave(),
  public.club_live_say(text, text, int, int), public.club_live_remove(text), public.club_live_block(text),
  public.club_live_blocks(), public.club_live_unblock(text), public.club_live_report(text, text),
  public.club_live_can_listen(text) to authenticated;
grant execute on function public.club_live_count(text) to anon, authenticated;

-- ---------- for the owner (paste into the SQL editor) ----------
-- Who is live now:          select p.nickname, o.nickname as in_room, l.joined_at, l.seen_at from public.club_live_leases l
--                           join public.club_profiles p on p.user_id = l.user_id join public.club_profiles o on o.user_id = l.room_id order by 2, 3;
-- Reports, newest first:    select id, at, from_nick, about_nick, room_nick, reason, recent from public.club_reports where not done order by at desc;
-- Mark one dealt with:      update public.club_reports set done = true where id = 1;
-- Messages, last 30 days:   select public.club_live_spent() as used, month_cap from public.club_live_config;
-- Switch live rooms off:    update public.club_live_config set live_on = false;    (and on again: set live_on = true)
-- Blocks students made:     select p.nickname as student, q.nickname as blocked, b.at from public.club_blocks b
--                           join public.club_profiles p on p.user_id = b.user_id join public.club_profiles q on q.user_id = b.blocked_id order by b.at desc;
-- Block someone everywhere: the "Block someone" lines in club.sql also take them out of any live room and close theirs.

select case
  when not has_table_privilege('realtime.messages', 'insert') then 'Live rooms are set up, but this database cannot send to them: tell Claude "no insert on realtime.messages"'
  else 'Live rooms are ready. Last step: Realtime > Settings > turn off "Allow public access to channels"' end as result;
