-- SAT Sprint clubhouse, part 1: nicknames, coins and prizes kept by the server, rooms, share links and visitors' stickers.
-- Run this once in the Supabase project's SQL editor, after setup.sql and extras.sql (see src/README.md, "Clubhouse").
-- It is safe to run again: it changes no one's coins, prizes or room.
--
-- Until it is run, signed-in students keep their coins and prizes in their own saved progress, as guests do. Once it is run,
-- a signed-in student's device hands what it holds to the server once (club_join), and from then on the server keeps their
-- coins, crates, prizes, stickers and free crates: the page asks it to count a day's coins (club_claim) and to open a
-- crate (club_open), and shows what it answers (club_state). Nothing here can be changed from a page except through these
-- functions, and each one checks who is asking and caps what it gives: the most coins a day is what an honest student can
-- earn, so faking cannot beat honest practice. Guests (no account) keep everything on their own device, as before.
--
-- The prize list comes from the site itself: the page build writes catalog.json beside index.html (src/site/catalog.py),
-- and every 10 minutes the database asks satsprint.org for it (pg_net) and copies it (pg_cron). A prize added to the site
-- is in the database within 20 minutes; nothing is hand-copied.
--
-- Rooms: a student saves a room (club_room_save; only prizes the server has recorded stay in it), switches its link on or
-- off (club_room_link), and anyone with the link sees it (club_room_view). Signed-in visitors leave one sticker a day on
-- its board, from the stickers they own (club_board_add); the owner can take any off (club_board_remove).

-- ---------- the two extensions: a scheduler, and web requests from the database ----------
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
create extension if not exists pg_net with schema extensions;

-- ---------- the prize list and its rules, copied from satsprint.org/catalog.json ----------
create table if not exists public.club_catalog (
  id     text primary key check (id ~ '^(theme|fx|aura|paper|streak):[a-z0-9-]{1,40}$'),
  tier   text not null check (tier ~ '^[a-z]$'),
  series text not null check (series ~ '^[a-z]{1,20}$'),
  active boolean not null default true          -- false once the site no longer lists it; owned copies stay
);
create table if not exists public.club_rules (
  id       int primary key default 1 check (id = 1),
  rules    jsonb,            -- catalog.json without its items: odds, prices, limits, seasons, sticker pages, titles
  asked    bigint,           -- the last request for catalog.json (pg_net)
  taken_at timestamptz,      -- when a list was last copied
  note     text              -- what happened the last time
);
insert into public.club_rules (id) values (1) on conflict (id) do nothing;

-- ---------- each student ----------
create table if not exists public.club_profiles (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  nickname  text check (nickname is null or char_length(nickname) between 3 and 20),
  joined_at timestamptz not null default now(),
  carried   jsonb not null default '{}'::jsonb,  -- how much came over from the device on joining (counts only)
  test_day  date,                                -- the test date given for the Test Day crate
  test_at   date,                                -- the day it was given: a new date at most once in 30 days
  gifted_at timestamptz,                         -- the owner's link was used on this account
  blocked   boolean not null default false,      -- set by the owner: no sharing, and no stickers on others' rooms
  owner     boolean not null default false       -- the site's owner (set by hand, see the end of this file)
);
create unique index if not exists club_profiles_nickname on public.club_profiles (lower(nickname));

-- coins: one row per reason, + earned and - spent; the balance is the sum
create table if not exists public.club_ledger (
  user_id uuid not null references auth.users (id) on delete cascade,
  key     text not null check (key ~ '^[a-z0-9.:-]{1,64}$'),   -- qotd.m.2026-11-16, plan.<day>, rev.<day>, crate.<id>, dupe.<id>, freeze.<id>
  amount  integer not null,
  at      timestamptz not null default now(),
  primary key (user_id, key)
);
-- days practiced, and days a streak freeze covered: the server's own streak, for luck and the free streak crates
create table if not exists public.club_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  frozen  boolean not null default false,
  primary key (user_id, day)
);
-- free crates: welcome, ms7|ms30|ms100.<first day of the streak>, page.<series>, test.<test date>
create table if not exists public.club_grants (
  user_id  uuid not null references auth.users (id) on delete cascade,
  key      text not null check (key ~ '^[a-z0-9.-]{1,40}$'),
  series   text not null default '',     -- '' = the student picks the series
  min_tier text not null default 'c',
  at       timestamptz not null default now(),
  used     text,                         -- the id of the crate it opened
  primary key (user_id, key)
);
-- every prize a student holds: crates opened, free crates, what came over on joining, and the owner's link
create table if not exists public.club_crates (
  user_id uuid not null references auth.users (id) on delete cascade,
  id      text not null check (id ~ '^[a-z0-9.:_-]{1,64}$'),
  series  text not null,
  item    text not null,
  tier    text not null,
  dupe    boolean not null default false,
  sticker text not null default '',
  how     text not null check (how in ('crate', 'grant', 'carried', 'gift')),
  at      timestamptz not null default now(),
  primary key (user_id, id)
);
create table if not exists public.club_stickers (
  user_id uuid not null references auth.users (id) on delete cascade,
  sticker text not null check (sticker ~ '^[a-z]{1,20}-[0-9]{1,2}$'),
  at      timestamptz not null default now(),
  primary key (user_id, sticker)
);
-- a student's room, and its link while it is shared
create table if not exists public.club_rooms (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  layout   jsonb not null,
  saved_at timestamptz not null default now(),
  link     text unique check (link is null or link ~ '^[0-9a-f]{32}$'),
  link_at  timestamptz
);
-- stickers visitors left on a room's board: one per visitor a day, the newest 30 kept
create table if not exists public.club_board (
  id      bigint generated always as identity primary key,
  room_id uuid not null references auth.users (id) on delete cascade,
  from_id uuid not null references auth.users (id) on delete cascade,
  sticker text not null,
  day     date not null,
  at      timestamptz not null default now(),
  unique (room_id, from_id, day)
);
create index if not exists club_board_room on public.club_board (room_id, at desc);
-- words a nickname may not contain (letters only, lowercase); add to it in the Table editor
create table if not exists public.club_words (word text primary key check (word ~ '^[a-z]{3,20}$'));
insert into public.club_words (word) values
  ('fuck'), ('shit'), ('bitch'), ('cunt'), ('dick'), ('cock'), ('pussy'), ('nigg'), ('fag'), ('slut'), ('whore'), ('rape'),
  ('nazi'), ('hitler'), ('porn'), ('penis'), ('vagina'), ('asshole'), ('bastard'), ('retard'), ('wank'), ('twat'), ('kkk')
on conflict (word) do nothing;

-- nothing is read or written directly: only through the functions below
do $$ declare t text; begin
  foreach t in array array['club_catalog', 'club_rules', 'club_profiles', 'club_ledger', 'club_days', 'club_grants', 'club_crates', 'club_stickers', 'club_rooms', 'club_board', 'club_words'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------- small helpers (not callable from a page) ----------
-- the day a reward counts on: US Eastern time
create or replace function public.club_day() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'America/New_York')::date $$;
create or replace function public.club_rule(k text) returns jsonb
language sql stable set search_path = '' as $$ select rules -> k from public.club_rules where id = 1 $$;
create or replace function public.club_ms(t timestamptz) returns bigint
language sql immutable set search_path = '' as $$ select (extract(epoch from t) * 1000)::bigint $$;
create or replace function public.club_tier_at(t text) returns int
language sql stable set search_path = '' as $$
  select coalesce((select (o.n - 1)::int from jsonb_array_elements_text(public.club_rule('tiers')) with ordinality as o(v, n) where o.v = t), -1)
$$;
create or replace function public.club_series_ok(s text) returns boolean
language sql stable set search_path = '' as $$ select coalesce(public.club_rule('series') ? s, false) $$;
create or replace function public.club_balance(u uuid) returns int
language sql stable set search_path = '' as $$ select coalesce(sum(amount), 0)::int from public.club_ledger where user_id = u $$;
create or replace function public.club_freezes_left(u uuid) returns int
language sql stable set search_path = '' as $$
  select greatest(0, (select count(*) from public.club_ledger where user_id = u and key like 'freeze.%')
                   - (select count(*) from public.club_days where user_id = u and frozen))::int
$$;
create or replace function public.club_new_id() returns text
language sql volatile set search_path = '' as $$ select substr(replace(gen_random_uuid()::text, '-', ''), 1, 14) $$;
-- a day written as YYYY-MM-DD, or null (a device's record is not trusted to hold real dates)
create or replace function public.club_date(s text) returns date
language plpgsql immutable set search_path = '' as $$
begin
  if coalesce(s, '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return null; end if;
  return to_date(s, 'YYYY-MM-DD');
exception when others then return null;
end $$;
create or replace function public.club_obj(j jsonb) returns jsonb
language sql immutable set search_path = '' as $$ select case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end $$;
create or replace function public.club_arr(j jsonb) returns jsonb
language sql immutable set search_path = '' as $$ select case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end $$;
-- the last day of the run of days in a row that starts on day a (null if a run does not start there)
create or replace function public.club_run_end(u uuid, a date) returns date
language sql stable set search_path = '' as $$
  with d as (select day, day - (row_number() over (order by day))::int as grp from public.club_days where user_id = u)
  select max(day) from d where grp = (select grp from d where day = a)
    and not exists (select 1 from public.club_days where user_id = u and day = a - 1)
$$;

-- the streak: days in a row practiced or covered by a freeze, ending today or yesterday; and the best run ever
create or replace function public.club_streak(u uuid, out n int, out best int, out start date)
language sql stable set search_path = '' as $$
  with runs as (
    select min(day) as a, max(day) as b, count(*)::int as len
    from (select day, day - (row_number() over (order by day))::int as grp from public.club_days where user_id = u) d
    group by grp
  )
  select coalesce((select len from runs where b >= public.club_day() - 1 order by b desc limit 1), 0),
         coalesce((select max(len) from runs), 0),
         (select a from runs where b >= public.club_day() - 1 order by b desc limit 1)
$$;

-- a missed day (or two) is covered by streak freezes the student bought, when that keeps a streak going (as on the page)
create or replace function public.club_apply_freeze(u uuid) returns void
language plpgsql set search_path = '' as $$
declare today date := public.club_day(); d date := today - 1; gap int := 0; mx int := coalesce((public.club_rule('freezeMax'))::int, 2);
begin
  if exists (select 1 from public.club_days where user_id = u and day = d) then return; end if;
  while not exists (select 1 from public.club_days where user_id = u and day = d) and gap <= mx loop
    gap := gap + 1; d := d - 1;
  end loop;
  if gap > public.club_freezes_left(u) or not exists (select 1 from public.club_days where user_id = u and day = d) then return; end if;
  insert into public.club_days (user_id, day, frozen) select u, g::date, true from generate_series(d + 1, today - 1, interval '1 day') g
  on conflict (user_id, day) do nothing;
end $$;

-- free crates for the first day practiced, and for 7, 30 and 100 days in a row
create or replace function public.club_milestones(u uuid) returns void
language plpgsql set search_path = '' as $$
declare s record; m record;
begin
  if exists (select 1 from public.club_days where user_id = u and not frozen) then
    insert into public.club_grants (user_id, key, series, min_tier) values (u, 'welcome', 'pencil', 'c') on conflict do nothing;
  end if;
  select * into s from public.club_streak(u);
  for m in select * from (values (7, 'r'), (30, 'e'), (100, 'm')) as v(days, tier) loop
    if s.n >= m.days then
      insert into public.club_grants (user_id, key, series, min_tier) values (u, 'ms' || m.days || '.' || to_char(s.start, 'YYYY-MM-DD'), '', m.tier)
      on conflict do nothing;
    end if;
  end loop;
end $$;

-- a finished sticker page earns a free crate from that series
create or replace function public.club_page_check(u uuid, ser text) returns void
language plpgsql set search_path = '' as $$
declare size int := (public.club_rule('stickers') ->> ser)::int;
begin
  if size > 0 and (select count(*) from public.club_stickers where user_id = u and sticker ~ ('^' || ser || '-[0-9]+$')
                     and split_part(sticker, '-', 2)::int < size) >= size then
    insert into public.club_grants (user_id, key, series, min_tier) values (u, 'page.' || ser, ser, 'c') on conflict do nothing;
  end if;
end $$;

-- the stickers on a room's board, newest first, with who left them
create or replace function public.club_board_of(room uuid) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_array(b.id, b.sticker, coalesce(p.nickname, ''), to_char(b.day, 'YYYY-MM-DD')) order by b.at desc), '[]'::jsonb)
  from (select * from public.club_board where room_id = room order by at desc limit 30) b
  left join public.club_profiles p on p.user_id = b.from_id
$$;

-- everything the page shows about a student's coins and prizes, in the shapes the page keeps them (store.s.pz)
create or replace function public.club_state_of(u uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'ready', (select rules is not null from public.club_rules where id = 1),
    'joined', p.user_id is not null,
    'day', to_char(public.club_day(), 'YYYY-MM-DD'),
    'nick', p.nickname,
    'blocked', coalesce(p.blocked, false),
    'test', to_char(p.test_day, 'YYYY-MM-DD'),
    'carried', p.carried,
    'e', coalesce((select jsonb_object_agg(key, amount) from public.club_ledger where user_id = u and amount > 0), '{}'::jsonb),
    'x', coalesce((select jsonb_object_agg(key, -amount) from public.club_ledger where user_id = u and amount < 0), '{}'::jsonb),
    'o', coalesce((select jsonb_object_agg(id, jsonb_build_array(public.club_ms(at), series, item, tier, dupe::int, sticker)) from public.club_crates where user_id = u), '{}'::jsonb)
         || case when p.gifted_at is not null then jsonb_build_object('gift.all', jsonb_build_array(public.club_ms(p.gifted_at), '', '', '', 0, '')) else '{}'::jsonb end,
    'g', coalesce((select jsonb_object_agg(key, jsonb_build_array(public.club_ms(at), series, min_tier, '')) from public.club_grants where user_id = u), '{}'::jsonb),
    'st', coalesce((select jsonb_object_agg(sticker, 1) from public.club_stickers where user_id = u), '{}'::jsonb),
    'fz', coalesce((select jsonb_object_agg(to_char(day, 'YYYY-MM-DD'), 1) from public.club_days where user_id = u and frozen), '{}'::jsonb),
    'streak', (select jsonb_build_object('n', s.n, 'best', s.best) from public.club_streak(u) s),
    'room', (select jsonb_build_object('layout', r.layout, 'link', r.link, 'at', public.club_ms(r.saved_at)) from public.club_rooms r where r.user_id = u),
    'board', public.club_board_of(u)
  )
  from (select u as uid) q left join public.club_profiles p on p.user_id = q.uid
$$;

-- the signed-in student, with their profile row locked so two calls at once cannot both spend the same coins
create or replace function public.club_me(lock boolean) returns public.club_profiles
language plpgsql set search_path = '' as $$
declare u uuid := auth.uid(); p public.club_profiles;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  if (select rules is null from public.club_rules where id = 1) then raise exception 'the clubhouse is not ready yet' using errcode = 'P0001'; end if;
  if lock then select * into p from public.club_profiles where user_id = u for update;
  else select * into p from public.club_profiles where user_id = u; end if;
  if p.user_id is null then raise exception 'join first' using errcode = 'P0001'; end if;
  return p;
end $$;

-- ---------- copying the prize list from the site ----------
create or replace function public.club_catalog_take(c jsonb) returns text
language plpgsql set search_path = '' as $$
declare it jsonb; n int := 0; ids text[] := '{}';
begin
  -- the draw below counts on six tiers in this order (luck lifts the last three, the promise of an Epic stops at Mythic)
  if not coalesce(c ->> 'v' = '1' and c -> 'tiers' = '["c", "r", "e", "l", "m", "z"]'::jsonb
     and jsonb_typeof(c -> 'items') = 'array' and jsonb_array_length(c -> 'items') >= 20
     and jsonb_typeof(c -> 'odds') = 'object' and jsonb_typeof(c -> 'earn') = 'object' and jsonb_typeof(c -> 'series') = 'array'
     and jsonb_typeof(c -> 'stickers') = 'object' and jsonb_typeof(c -> 'seasons') = 'array' and jsonb_typeof(c -> 'titles') = 'array'
     and jsonb_typeof(c -> 'gift') = 'string'
     and (select bool_and(jsonb_typeof(c -> 'odds' -> t) = 'number') from jsonb_array_elements_text(c -> 'tiers') t)
     and (select bool_and(jsonb_typeof(c -> k) = 'number') from unnest(array['price', 'freeze', 'freezeMax', 'dupe', 'pity', 'giftCoins']) k)
     and (select bool_and(jsonb_typeof(c -> 'earn' -> k) = 'number') from unnest(array['qotd', 'plan', 'rev', 'revMax']) k), false) then
    raise exception 'catalog.json is not in the expected shape';
  end if;
  if (c ->> 'price')::numeric < 1 or (c ->> 'freeze')::numeric < 1 or (c ->> 'pity')::numeric < 2 or (c ->> 'dupe')::numeric < 0 then
    raise exception 'catalog.json has prices the clubhouse cannot use';
  end if;
  for it in select * from jsonb_array_elements(c -> 'items') loop
    if jsonb_typeof(it) <> 'array' or not (c -> 'tiers') ? (it ->> 1) or not ((c -> 'series') ? (it ->> 2) or it ->> 2 = 'any') then
      raise exception 'catalog.json has a prize it cannot use: %', it;
    end if;
    insert into public.club_catalog (id, tier, series, active) values (it ->> 0, it ->> 1, it ->> 2, true)
    on conflict (id) do update set tier = excluded.tier, series = excluded.series, active = true;
    ids := ids || (it ->> 0); n := n + 1;
  end loop;
  update public.club_catalog set active = false where active and not (id = any (ids));
  update public.club_rules set rules = c - 'items', taken_at = now(), note = n || ' prizes copied' where id = 1;
  return n || ' prizes copied';
end $$;

-- run every 10 minutes: copy the answer to the last request, if it came, then ask again
create or replace function public.club_catalog_sync() returns text
language plpgsql security definer set search_path = '' as $$
declare r record; asked bigint; msg text := 'asked the site for the prize list';
begin
  select c.asked into asked from public.club_rules c where id = 1;
  if asked is not null then
    select status_code, content into r from net._http_response where id = asked;
    if found then
      if r.status_code = 200 then
        begin
          msg := public.club_catalog_take(r.content::jsonb);
        exception when others then
          msg := 'the prize list was not copied: ' || sqlerrm;
        end;
      else
        msg := 'the site answered ' || coalesce(r.status_code::text, 'nothing');
      end if;
      update public.club_rules set note = msg where id = 1;
    end if;
  end if;
  update public.club_rules set asked = net.http_get('https://satsprint.org/catalog.json', timeout_milliseconds := 15000) where id = 1;
  return msg;
end $$;
revoke all on function public.club_catalog_sync() from public, anon, authenticated;
select cron.schedule('club-catalog', '*/10 * * * *', 'select public.club_catalog_sync()');
select public.club_catalog_sync();

-- ---------- joining: what the device holds comes over once ----------
-- p is the device's record (store.s.pz) plus `days`, the days it has practiced. What comes over is checked the way the page
-- makes it, so a changed record can bring no more than honest practice could have earned:
--   days practiced, from the day the site opened; days a streak freeze covered, no more than the freezes bought;
--   coins for days from the day crates came to the site, each reason once at its usual amount;
--   crates oldest first: one bought with coins only while the coins carried can pay for it, a free one only when the days
--   or the stickers carried earn it (and one Test Day crate at most); each sticker from the crate that gave it, and coins
--   back for a repeat counted again here; then streak freezes, while coins are left.
-- The owner's link is not carried: opening it again once signed in gives everything back (club_gift).
create or replace function public.club_join(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); today date := public.club_day();
  site_from constant date := date '2026-10-07';   -- the site opened on 8 October 2026 (a day early, for time zones)
  coins_from constant date := date '2026-11-14';  -- crates came on 15 November 2026
  earn jsonb := public.club_rule('earn'); price int := (public.club_rule('price'))::int; refund int := (public.club_rule('dupe'))::int;
  fprice int := (public.club_rule('freeze'))::int; rmax int; budget int := 0; amt int; k text; v jsonb; d date; e date; n int;
  c public.club_catalog; g public.club_grants; ser text; stk text; size int; dup boolean; t_at timestamptz;
  got int := 0; left_out int := 0; tdate date;
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  if (select rules is null from public.club_rules where id = 1) then raise exception 'the clubhouse is not ready yet' using errcode = 'P0001'; end if;
  insert into public.club_profiles (user_id) values (u) on conflict do nothing;
  if not found then return public.club_state_of(u); end if;     -- joined already (or on another device a moment ago)
  p := public.club_obj(p);
  rmax := (earn ->> 'rev')::int * (earn ->> 'revMax')::int;
  -- days practiced, and days a freeze covered
  insert into public.club_days (user_id, day)
  select distinct u, x.d from (select public.club_date(t) as d from jsonb_array_elements_text(public.club_arr(p -> 'days')) t limit 1000) x
  where x.d between site_from and today + 1
  on conflict do nothing;
  n := (select count(*) from jsonb_object_keys(public.club_obj(p -> 'x')) x where x ~ '^freeze\.[a-z0-9]{1,40}$');
  insert into public.club_days (user_id, day, frozen)
  select u, f.d, true from (select distinct public.club_date(x) as d from jsonb_object_keys(public.club_obj(p -> 'fz')) x) f
  where f.d between site_from and today order by f.d desc limit least(n, 50)
  on conflict do nothing;
  -- coins earned
  for k, v in select * from jsonb_each(public.club_obj(p -> 'e')) limit 2000 loop
    continue when jsonb_typeof(v) <> 'number' or k !~ '^(qotd\.(m|rw)|plan|rev)\.[0-9]{4}-[0-9]{2}-[0-9]{2}$';
    d := public.club_date(right(k, 10));
    continue when d is null or d < coins_from or d > today + 1;
    amt := case when k like 'qotd.%' then (earn ->> 'qotd')::int when k like 'plan.%' then (earn ->> 'plan')::int
                else least(greatest((v #>> '{}')::numeric, 0), rmax)::int end;
    continue when amt <= 0;
    insert into public.club_ledger (user_id, key, amount) values (u, k, amt);
    budget := budget + amt;
  end loop;
  -- free crates the days earn: the first day, 7, 30 and 100 days in a row, and the latest Test Day (sticker pages come below)
  for k in select x from jsonb_object_keys(public.club_obj(p -> 'g')) x limit 500 loop
    if k = 'welcome' then
      if exists (select 1 from public.club_days where user_id = u and not frozen) then
        insert into public.club_grants (user_id, key, series, min_tier) values (u, k, 'pencil', 'c');
      end if;
    elsif k ~ '^ms(7|30|100)\.[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      n := split_part(substr(k, 3), '.', 1)::int; d := public.club_date(right(k, 10)); e := public.club_run_end(u, d);
      if e - d + 1 >= n and e >= coins_from - 1 then
        insert into public.club_grants (user_id, key, series, min_tier) values (u, k, '', case n when 7 then 'r' when 30 then 'e' else 'm' end);
      end if;
    elsif k ~ '^test\.[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      d := public.club_date(right(k, 10));
      if d between coins_from and today + 7 and (tdate is null or d > tdate) then tdate := d; end if;
    end if;
  end loop;
  if tdate is not null then
    insert into public.club_grants (user_id, key, series, min_tier) values (u, 'test.' || to_char(tdate, 'YYYY-MM-DD'), 'test', 'e');
    update public.club_profiles set test_day = tdate, test_at = greatest(tdate - 7, coins_from) where user_id = u;
  end if;
  -- crates, oldest first
  for k, v in select x.key, x.value from jsonb_each(public.club_obj(p -> 'o')) x
              where jsonb_typeof(x.value) = 'array' and (x.key ~ '^[a-z0-9]{4,40}$' or x.key ~ '^g\.[a-z0-9.-]{1,40}$')
              order by case when jsonb_typeof(x.value -> 0) = 'number' then (x.value ->> 0)::numeric else 0 end, x.key limit 1000 loop
    select * into c from public.club_catalog where id = v ->> 2;
    if c.id is null then left_out := left_out + 1; continue; end if;
    ser := case when public.club_series_ok(v ->> 1) then v ->> 1 when public.club_series_ok(c.series) then c.series else 'pencil' end;
    if k like 'g.%' then
      if k like 'g.page.%' then perform public.club_page_check(u, substr(k, 8)); end if;   -- a page the stickers so far finish
      select * into g from public.club_grants where user_id = u and key = substr(k, 3);
      if g.key is null or g.used is not null or (g.series <> '' and g.series <> ser) or (g.series = '' and ser = 'test')
         or public.club_tier_at(c.tier) < greatest(public.club_tier_at(g.min_tier), case when ser = 'test' then 2 else 0 end) then
        left_out := left_out + 1; continue;
      end if;
      update public.club_grants set used = k where user_id = u and key = g.key;
    else
      if not public.club_obj(p -> 'x') ? ('crate.' || k) or budget < price or (ser = 'test' and public.club_tier_at(c.tier) < 2) then
        left_out := left_out + 1; continue;
      end if;
      insert into public.club_ledger (user_id, key, amount) values (u, 'crate.' || k, -price);
      budget := budget - price;
    end if;
    dup := exists (select 1 from public.club_crates x where x.user_id = u and x.item = c.id);
    if dup then
      insert into public.club_ledger (user_id, key, amount) values (u, 'dupe.' || k, refund);
      budget := budget + refund;
    end if;
    size := coalesce((public.club_rule('stickers') ->> ser)::int, 0);
    stk := case when coalesce(v ->> 5, '') !~ ('^' || ser || '-[0-9]{1,2}$') then '' when split_part(v ->> 5, '-', 2)::int >= size then '' else v ->> 5 end;
    if stk <> '' then insert into public.club_stickers (user_id, sticker) values (u, stk) on conflict do nothing; end if;
    t_at := case when jsonb_typeof(v -> 0) <> 'number' then null when (v ->> 0)::numeric between 1.7e12 and 4e12 then to_timestamp((v ->> 0)::numeric / 1000) end;
    t_at := least(now(), greatest(coalesce(t_at, now()), coins_from::timestamptz));
    insert into public.club_crates (user_id, id, series, item, tier, dupe, sticker, how, at) values (u, k, ser, c.id, c.tier, dup, stk, 'carried', t_at);
    got := got + 1;
  end loop;
  for ser in select jsonb_object_keys(public.club_rule('stickers')) loop perform public.club_page_check(u, ser); end loop;
  -- streak freezes bought, while coins are left
  for k in select x from jsonb_object_keys(public.club_obj(p -> 'x')) x where x ~ '^freeze\.[a-z0-9]{1,40}$' order by x limit 50 loop
    exit when budget < fprice;
    insert into public.club_ledger (user_id, key, amount) values (u, k, -fprice);
    budget := budget - fprice;
  end loop;
  update public.club_profiles set carried = jsonb_build_object('prizes', got, 'left_out', left_out, 'coins', budget,
    'days', (select count(*) from public.club_days where user_id = u)) where user_id = u;
  perform public.club_milestones(u);
  return public.club_state_of(u);
end $$;

-- ---------- the page reads the record ----------
create or replace function public.club_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  return public.club_state_of(u);
end $$;

-- ---------- coins for the day: { "qotd.m.<day>": 10, "plan.<day>": 20, "rev.<day>": 15, "day.<day>": 1, "test.<test date>": 1 } ----------
-- Only days from two days ago to tomorrow count (a device's day can differ from Eastern time), each reason once, at its
-- usual amount: at most 60 coins a day.
create or replace function public.club_claim(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); u uuid := me.user_id; k text; v jsonb; d date; today date := public.club_day(); n int := 0;
  earn jsonb := public.club_rule('earn'); rmax int;
begin
  rmax := (earn ->> 'rev')::int * (earn ->> 'revMax')::int;
  for k, v in select * from jsonb_each(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end) loop
    n := n + 1; exit when n > 20;
    continue when k !~ '^(qotd\.(m|rw)|plan|rev|day|test)\.[0-9]{4}-[0-9]{2}-[0-9]{2}$';
    d := public.club_date(right(k, 10));
    continue when d is null;
    if k like 'test.%' then
      continue when d < today or d > today + 7;
      if me.test_day is distinct from d then
        continue when me.test_at is not null and me.test_at > today - 30;
        update public.club_profiles set test_day = d, test_at = today where user_id = u;
        me.test_day := d; me.test_at := today;
      end if;
      insert into public.club_grants (user_id, key, series, min_tier) values (u, k, 'test', 'e') on conflict do nothing;
      continue;
    end if;
    continue when d < today - 2 or d > today + 1;
    if k like 'day.%' then
      insert into public.club_days (user_id, day) values (u, d) on conflict (user_id, day) do update set frozen = false;
    elsif k like 'qotd.%' then
      insert into public.club_ledger (user_id, key, amount) values (u, k, (earn ->> 'qotd')::int) on conflict do nothing;
    elsif k like 'plan.%' then
      insert into public.club_ledger (user_id, key, amount) values (u, k, (earn ->> 'plan')::int) on conflict do nothing;
    elsif jsonb_typeof(v) = 'number' and v::text ~ '^[0-9]{1,3}$' then
      insert into public.club_ledger (user_id, key, amount) values (u, k, least(v::text::int, rmax))
      on conflict (user_id, key) do update set amount = greatest(public.club_ledger.amount, excluded.amount);
    end if;
  end loop;
  perform public.club_apply_freeze(u);
  perform public.club_milestones(u);
  return public.club_state_of(u);
end $$;

-- ---------- opening a crate (bought with coins), or a free one (p_grant) ----------
-- The same draw as the page (prizes.js, pzOpen): the tier first, then the prize, then a sticker from the crate's series.
create or replace function public.club_open(p_series text, p_grant text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); u uuid := me.user_id; g public.club_grants; ser text := p_series; cid text;
  lo int := 0; hi int; tiers jsonb := public.club_rule('tiers'); odds jsonb := public.club_rule('odds'); luck numeric;
  s record; i int; t text; w numeric; tot numeric := 0; r numeric; acc numeric := 0; pick text; since int; prize text;
  dup boolean; stk text := ''; size int; month0 int; ins text[]; how text := 'crate';
begin
  hi := jsonb_array_length(tiers) - 1;
  if coalesce(p_grant, '') <> '' then
    select * into g from public.club_grants where user_id = u and key = p_grant for update;
    if g.key is null or g.used is not null then raise exception 'that free crate is not waiting' using errcode = 'P0001'; end if;
    ser := coalesce(nullif(g.series, ''), p_series);
    if not public.club_series_ok(ser) or (ser = 'test' and g.series <> 'test') then raise exception 'pick a series' using errcode = 'P0001'; end if;
    lo := greatest(public.club_tier_at(g.min_tier), case when ser = 'test' then 2 else 0 end);
    cid := 'g.' || p_grant; how := 'grant';
  else
    if not public.club_series_ok(ser) then raise exception 'there is no such crate' using errcode = 'P0001'; end if;
    if ser = 'test' then
      if me.test_day is null or me.test_day < public.club_day() or me.test_day > public.club_day() + 7 then
        raise exception 'the Test Day crate opens in the last week before your test' using errcode = 'P0001';
      end if;
      lo := 2;
    end if;
    if public.club_balance(u) < (public.club_rule('price'))::int then raise exception 'not enough coins' using errcode = 'P0001'; end if;
    cid := public.club_new_id();
    insert into public.club_ledger (user_id, key, amount) values (u, 'crate.' || cid, -(public.club_rule('price'))::int);
  end if;
  -- an Epic or better at least once in every `pity` crates; that promise never brings a Radiant
  select count(*) into since from public.club_crates x
   where x.user_id = u and x.at > coalesce((select max(y.at) from public.club_crates y where y.user_id = u and y.tier not in ('c', 'r')), '-infinity');
  if since >= (public.club_rule('pity'))::int - 1 and lo < 2 then lo := 2; hi := least(hi, 4); end if;
  -- luck from the streak lifts Legendary, Mythic and Radiant: 1.5 times at 7 days in a row, twice at 30
  select * into s from public.club_streak(u);
  luck := case when s.n >= 30 then 2 when s.n >= 7 then 1.5 else 1 end;
  -- the tier, among those allowed that have a prize in them
  for i in lo .. hi loop
    t := tiers ->> i;
    continue when not exists (select 1 from public.club_catalog x where x.active and x.tier = t);
    tot := tot + (odds ->> t)::numeric * case when i >= 3 then luck else 1 end;
  end loop;
  if tot <= 0 then raise exception 'no prizes to draw' using errcode = 'P0001'; end if;
  r := random()::numeric * tot;
  for i in lo .. hi loop
    t := tiers ->> i;
    continue when not exists (select 1 from public.club_catalog x where x.active and x.tier = t);
    w := (odds ->> t)::numeric * case when i >= 3 then luck else 1 end;
    pick := t;
    acc := acc + w;
    exit when r < acc;
  end loop;
  -- the prize: a series' own prizes 3 times as likely in its crate, and the Seasons prizes in season 6 times
  month0 := extract(month from (now() at time zone 'America/New_York'))::int - 1;
  select coalesce(array_agg(x), '{}') into ins
  from jsonb_array_elements(public.club_rule('seasons')) se, jsonb_array_elements_text(se -> 1) x
  where (se -> 0) @> to_jsonb(month0);
  select c.id into prize from (
    select x.id, sum(x.wt) over (order by x.id) as cum, sum(x.wt) over () as total
    from (select k.id, case when k.series <> ser then 1 when ser = 'seasons' and k.id = any (ins) then 6 else 3 end as wt
          from public.club_catalog k where k.active and k.tier = pick) x
  ) c, (select random() as q) z
  where c.cum > z.q * c.total order by c.cum limit 1;
  dup := exists (select 1 from public.club_crates x where x.user_id = u and x.item = prize);
  if dup then insert into public.club_ledger (user_id, key, amount) values (u, 'dupe.' || cid, (public.club_rule('dupe'))::int) on conflict do nothing; end if;
  size := coalesce((public.club_rule('stickers') ->> ser)::int, 0);
  if size > 0 then
    stk := ser || '-' || floor(random() * size)::int;
    insert into public.club_stickers (user_id, sticker) values (u, stk) on conflict do nothing;
  end if;
  insert into public.club_crates (user_id, id, series, item, tier, dupe, sticker, how, at) values (u, cid, ser, prize, pick, dup, stk, how, clock_timestamp());
  if how = 'grant' then update public.club_grants set used = cid where user_id = u and key = p_grant; end if;
  if size > 0 then perform public.club_page_check(u, ser); end if;
  return jsonb_build_object('id', cid, 'item', prize, 'tier', pick, 'dupe', dup, 'sticker', stk, 'series', ser, 'state', public.club_state_of(u));
end $$;

-- ---------- a streak freeze, bought ahead ----------
create or replace function public.club_freeze() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); u uuid := me.user_id;
begin
  if public.club_freezes_left(u) >= coalesce((public.club_rule('freezeMax'))::int, 2) then raise exception 'you have all the freezes you can hold' using errcode = 'P0001'; end if;
  if public.club_balance(u) < (public.club_rule('freeze'))::int then raise exception 'not enough coins' using errcode = 'P0001'; end if;
  insert into public.club_ledger (user_id, key, amount) values (u, 'freeze.' || public.club_new_id(), -(public.club_rule('freeze'))::int);
  return public.club_state_of(u);
end $$;

-- ---------- the owner's link: every prize, sticker and title, and coins ----------
create or replace function public.club_gift(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); u uuid := me.user_id; ser text;
begin
  if coalesce(p_code, '') !~ '^[A-Za-z0-9_-]{16,64}$' or encode(sha256(convert_to(p_code, 'UTF8')), 'hex') <> public.club_rule('gift') #>> '{}' then
    raise exception 'that link does not unlock anything' using errcode = 'P0001';
  end if;
  -- lowest tier first, so the last one is a Radiant and the promise of an Epic starts again
  insert into public.club_crates (user_id, id, series, item, tier, how, at)
  select u, 'gift.' || replace(c.id, ':', '.'), c.series, c.id, c.tier, 'gift', now() + (row_number() over (order by public.club_tier_at(c.tier), c.id)) * interval '1 millisecond'
  from public.club_catalog c where c.active
  on conflict do nothing;
  for ser in select jsonb_object_keys(public.club_rule('stickers')) loop
    insert into public.club_stickers (user_id, sticker) select u, ser || '-' || i from generate_series(0, (public.club_rule('stickers') ->> ser)::int - 1) i on conflict do nothing;
    perform public.club_page_check(u, ser);
  end loop;
  insert into public.club_ledger (user_id, key, amount) values (u, 'gift.coins', (public.club_rule('giftCoins'))::int)
  on conflict (user_id, key) do update set amount = greatest(public.club_ledger.amount, excluded.amount);
  update public.club_profiles set gifted_at = coalesce(gifted_at, now()) where user_id = u;
  return public.club_state_of(u);
end $$;

-- ---------- a nickname: what others see on a shared room and on stickers left there ----------
create or replace function public.club_nick(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); n text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  bare text := regexp_replace(lower(n), '[^a-z]', '', 'g');
begin
  if n !~ '^[A-Za-z0-9][A-Za-z0-9 .-]{1,18}[A-Za-z0-9]$' or length(regexp_replace(n, '[^0-9]', '', 'g')) >= 7 then
    return jsonb_build_object('ok', false, 'why', 'form');
  end if;
  if exists (select 1 from public.club_words w where position(w.word in bare) > 0) then return jsonb_build_object('ok', false, 'why', 'words'); end if;
  if exists (select 1 from public.club_profiles where lower(nickname) = lower(n) and user_id <> me.user_id) then return jsonb_build_object('ok', false, 'why', 'taken'); end if;
  begin
    update public.club_profiles set nickname = n where user_id = me.user_id;
  exception when unique_violation then return jsonb_build_object('ok', false, 'why', 'taken');
  end;
  return jsonb_build_object('ok', true, 'nick', n);
end $$;

-- ---------- rooms ----------
-- what a room may hold: only prizes, stickers and titles this student has on the server
create or replace function public.club_room_clean(u uuid, p jsonb) returns jsonb
language plpgsql stable set search_path = '' as $$
declare own text[]; stk text[]; st jsonb := '[]'::jsonb; sh jsonb := '[]'::jsonb; bd jsonb := '[]'::jsonb; x text; i int; tl text := '';
  s record; gifted boolean; av jsonb := '["violet", ""]'::jsonb;
begin
  p := case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end;
  select coalesce(array_agg(distinct cr.item), '{}') into own from public.club_crates cr join public.club_catalog c on c.id = cr.item where cr.user_id = u;
  select coalesce(array_agg(sticker), '{}') into stk from public.club_stickers where user_id = u;
  for i in 0 .. 2 loop
    x := p -> 'st' ->> i;
    st := st || to_jsonb(case when x = any (own) and split_part(x, ':', 1) in ('aura', 'fx') and not st ? x then x else '' end);
  end loop;
  for x in select jsonb_array_elements_text(case when jsonb_typeof(p -> 'sh') = 'array' then p -> 'sh' else '[]'::jsonb end) loop
    if x = any (own) and x like 'streak:%' and not sh ? x and jsonb_array_length(sh) < 3 then sh := sh || to_jsonb(x); end if;
  end loop;
  for x in select jsonb_array_elements_text(case when jsonb_typeof(p -> 'bd') = 'array' then p -> 'bd' else '[]'::jsonb end) loop
    if x = any (stk) and not bd ? x and jsonb_array_length(bd) < 6 then bd := bd || to_jsonb(x); end if;
  end loop;
  -- a title: the ones the server can see are checked (streaks, how many prizes, a Mythic); the owner's link gives them all
  select * into s from public.club_streak(u);
  select gifted_at is not null into gifted from public.club_profiles where user_id = u;
  x := coalesce(p ->> 'tl', '');
  if x <> '' and coalesce(public.club_rule('titles') ? x, false) and (gifted or case x
       when 'week' then s.best >= 7 when 'century' then s.best >= 100
       when 'collector' then cardinality(own) >= 25
       when 'mythic' then exists (select 1 from public.club_catalog where id = any (own) and tier in ('m', 'z'))
       else true end) then tl := x; end if;
  if jsonb_typeof(p -> 'av') = 'array' and coalesce(p -> 'av' ->> 0, '') ~ '^[a-z]{1,12}$' and coalesce(p -> 'av' ->> 1, '') ~ '^[a-z]{0,12}$' then
    av := jsonb_build_array(p -> 'av' ->> 0, coalesce(p -> 'av' ->> 1, ''));
  end if;
  return jsonb_build_object('v', 1, 't', public.club_ms(now()),
    'w', case when p ->> 'w' = any (own) and p ->> 'w' like 'theme:%' then p ->> 'w' else '' end,
    'win', case when p ->> 'win' = any (own) and p ->> 'win' like 'paper:%' then p ->> 'win' else '' end,
    'st', st, 'sh', sh, 'bd', bd, 'tl', tl, 'av', av);
end $$;

create or replace function public.club_room_save(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); lay jsonb := public.club_room_clean(me.user_id, p);
begin
  insert into public.club_rooms (user_id, layout, saved_at) values (me.user_id, lay, now())
  on conflict (user_id) do update set layout = excluded.layout, saved_at = excluded.saved_at;
  return public.club_state_of(me.user_id) -> 'room';
end $$;

-- switch the room's link on (a new one each time) or off; a shared room needs a nickname
create or replace function public.club_room_link(p_on boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true);
begin
  if p_on then
    if me.blocked then raise exception 'sharing is switched off for this account' using errcode = 'P0001'; end if;
    if me.nickname is null then raise exception 'choose a nickname first' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.club_rooms where user_id = me.user_id) then raise exception 'save your room first' using errcode = 'P0001'; end if;
    update public.club_rooms set link = coalesce(link, replace(gen_random_uuid()::text, '-', '')), link_at = coalesce(link_at, now()) where user_id = me.user_id;
  else
    update public.club_rooms set link = null, link_at = null where user_id = me.user_id;
  end if;
  return public.club_state_of(me.user_id) -> 'room';
end $$;

-- anyone with the link: the room, its owner's nickname and streak, and its board; nothing else about them
create or replace function public.club_room_view(p_link text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.club_rooms; p public.club_profiles; s record;
begin
  if coalesce(p_link, '') !~ '^[0-9a-f]{32}$' then return null; end if;
  select * into r from public.club_rooms where link = p_link;
  if r.user_id is null then return null; end if;
  select * into p from public.club_profiles where user_id = r.user_id;
  if p.blocked then return null; end if;
  select * into s from public.club_streak(r.user_id);
  return jsonb_build_object('nick', p.nickname, 'layout', r.layout, 'n', s.n, 'best', s.best, 'gift', p.gifted_at is not null,
    'board', public.club_board_of(r.user_id), 'mine', auth.uid() is not null and auth.uid() = r.user_id);
end $$;

-- a signed-in visitor leaves one of their own stickers, once a day per room (a second one that day replaces the first)
create or replace function public.club_board_add(p_link text, p_sticker text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true); r public.club_rooms;
begin
  if me.blocked then raise exception 'stickers are switched off for this account' using errcode = 'P0001'; end if;
  if me.nickname is null then raise exception 'choose a nickname first' using errcode = 'P0001'; end if;
  select * into r from public.club_rooms where link = p_link and coalesce(p_link, '') ~ '^[0-9a-f]{32}$';
  if r.user_id is null then raise exception 'this room is not shared any more' using errcode = 'P0001'; end if;
  if r.user_id = me.user_id then raise exception 'this is your own room' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.club_stickers where user_id = me.user_id and sticker = p_sticker) then raise exception 'you do not have that sticker' using errcode = 'P0001'; end if;
  insert into public.club_board (room_id, from_id, sticker, day) values (r.user_id, me.user_id, p_sticker, public.club_day())
  on conflict (room_id, from_id, day) do update set sticker = excluded.sticker, at = now();
  delete from public.club_board where room_id = r.user_id and id not in (select id from public.club_board where room_id = r.user_id order by at desc limit 30);
  return public.club_board_of(r.user_id);
end $$;

-- the owner takes a sticker off their board
create or replace function public.club_board_remove(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me public.club_profiles := public.club_me(true);
begin
  delete from public.club_board where id = p_id and room_id = me.user_id;
  return public.club_board_of(me.user_id);
end $$;

-- "Erase my progress everywhere" also empties the clubhouse record; the next sign-in starts it again from the device
create or replace function public.club_erase() returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in first' using errcode = 'P0001'; end if;
  delete from public.club_board where room_id = u or from_id = u;
  delete from public.club_rooms where user_id = u;
  delete from public.club_crates where user_id = u;
  delete from public.club_stickers where user_id = u;
  delete from public.club_grants where user_id = u;
  delete from public.club_ledger where user_id = u;
  delete from public.club_days where user_id = u;
  delete from public.club_profiles where user_id = u;
end $$;

-- ---------- who may call what ----------
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'club\_%' loop
    execute 'revoke all on function ' || f || ' from public, anon, authenticated';
  end loop;
end $$;
grant execute on function public.club_state(), public.club_join(jsonb), public.club_claim(jsonb), public.club_open(text, text),
  public.club_freeze(), public.club_gift(text), public.club_nick(text), public.club_room_save(jsonb), public.club_room_link(boolean),
  public.club_board_add(text, text), public.club_board_remove(bigint), public.club_erase() to authenticated;
grant execute on function public.club_room_view(text) to anon, authenticated;

-- ---------- for the owner (paste into the SQL editor) ----------
-- Is the prize list in?       select taken_at, note, (select count(*) from public.club_catalog where active) as prizes from public.club_rules;
-- Copy it now:                select public.club_catalog_sync();   (run it twice, a few seconds apart)
-- Mark your own account:      update public.club_profiles set owner = true where user_id = (select id from auth.users where email = 'YOUR EMAIL');
-- Shared rooms:               select p.nickname, r.saved_at, r.link is not null as shared from public.club_rooms r join public.club_profiles p using (user_id) order by r.saved_at desc;
-- Rename someone:             update public.club_profiles set nickname = 'New name' where lower(nickname) = lower('Old name');
-- Block someone (and unshare): update public.club_profiles set blocked = true where lower(nickname) = lower('Name');
--                              update public.club_rooms set link = null where user_id = (select user_id from public.club_profiles where lower(nickname) = lower('Name'));
-- Stickers left on a room:    select b.id, v.nickname as visitor, b.sticker, b.day from public.club_board b join public.club_profiles v on v.user_id = b.from_id
--                             where b.room_id = (select user_id from public.club_profiles where lower(nickname) = lower('Name'));
-- Take one off:               delete from public.club_board where id = 123;
