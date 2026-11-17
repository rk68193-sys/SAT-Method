-- Tests for src/account/club.sql, run by src/check/club-db.sh once club-shim.sql, setup.sql, club.sql and the prize list
-- (psql variable `catalog`, the text of catalog.json) are in. Each check that fails stops the run with "FAILED: <what>".
\set ON_ERROR_STOP 1
\o /dev/null

create schema t;
create function t.ok(cond boolean, what text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAILED: %', what; end if; end $$;
-- q must fail with an error that contains msg (its changes are undone)
create function t.fails(q text, msg text) returns void language plpgsql as $$
begin
  execute q;
  raise exception 'FAILED: % should have failed with "%"', q, msg;
exception when others then
  if sqlerrm like 'FAILED:%' then raise; end if;
  if position(msg in sqlerrm) = 0 then raise exception 'FAILED: % failed with "%", not "%"', q, sqlerrm, msg; end if;
end $$;
-- go on as a signed-in student, or as a visitor with no account (null); `reset role` goes back to the database's owner
create function t.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), false);
  execute 'set role ' || case when u is null then 'anon' else 'authenticated' end;
end $$;
-- the same items, in any order
create function t.same(a text[], b text[]) returns boolean language sql as $$
  select coalesce((select array_agg(x order by x) from unnest(a) x), '{}') = coalesce((select array_agg(x order by x) from unnest(b) x), '{}')
$$;
grant usage on schema t to anon, authenticated;
grant execute on all functions in schema t to anon, authenticated;

\set A '00000000-0000-0000-0000-00000000000a'
\set B '00000000-0000-0000-0000-00000000000b'
\set C '00000000-0000-0000-0000-00000000000c'
\set D '00000000-0000-0000-0000-00000000000d'
\set E '00000000-0000-0000-0000-00000000000e'
\set F '00000000-0000-0000-0000-00000000000f'
\set G '00000000-0000-0000-0000-000000000010'
\set H '00000000-0000-0000-0000-000000000011'
\set L '00000000-0000-0000-0000-000000000012'
insert into auth.users (id) values (:'A'), (:'B'), (:'C'), (:'D'), (:'E'), (:'F'), (:'G'), (:'H'), (:'L');

-- days around today (Eastern time, as the server counts them), and a time yesterday for crates on a device
select to_char(d, 'YYYY-MM-DD') as d0, to_char(d - 1, 'YYYY-MM-DD') as d1, to_char(d - 2, 'YYYY-MM-DD') as d2,
       to_char(d - 3, 'YYYY-MM-DD') as d3, to_char(d - 6, 'YYYY-MM-DD') as d6, to_char(d - 19, 'YYYY-MM-DD') as d19,
       to_char(d - 20, 'YYYY-MM-DD') as d20, to_char(d - 32, 'YYYY-MM-DD') as d32, to_char(d - 35, 'YYYY-MM-DD') as d35,
       to_char(d - 50, 'YYYY-MM-DD') as d50, to_char(d + 1, 'YYYY-MM-DD') as p1, to_char(d + 2, 'YYYY-MM-DD') as p2,
       to_char(d + 3, 'YYYY-MM-DD') as p3, to_char(d + 5, 'YYYY-MM-DD') as p5, to_char(d + 7, 'YYYY-MM-DD') as p7,
       to_char(d + 8, 'YYYY-MM-DD') as p8, to_char(d + 30, 'YYYY-MM-DD') as p30,
       (extract(epoch from (d - 1)::timestamptz) * 1000)::bigint as t0
from (select public.club_day() as d) x \gset
-- prizes to build records with
select (select id from public.club_catalog where series = 'pencil' and tier = 'c' order by id limit 1) as pc1,
       (select id from public.club_catalog where series = 'pencil' and tier = 'c' order by id offset 1 limit 1) as pc2,
       (select id from public.club_catalog where tier = 'r' order by id limit 1) as r1,
       (select id from public.club_catalog where tier = 'e' order by id limit 1) as e1,
       (select id from public.club_catalog where tier = 'z' order by id limit 1) as z1,
       (select id from public.club_catalog where id like 'aura:%' and tier in ('l', 'm') order by id limit 1) as aura9,
       (select id from public.club_catalog where id like 'fx:%' order by id limit 1) as fx1,
       (select id from public.club_catalog where id like 'theme:%' order by id limit 1) as th1,
       (select id from public.club_catalog where id like 'paper:%' order by id limit 1) as pp1,
       (select string_agg(id, ',' order by id) from (select id from public.club_catalog where id like 'streak:%' order by id limit 4) s) as sks,
       (select id from public.club_catalog where id like 'skin:%' order by id limit 1) as sk1,
       jsonb_array_length((:'catalog')::jsonb -> 'items') as n_items,
       (select sum(value::int) from jsonb_each_text((:'catalog')::jsonb -> 'stickers')) as n_stickers,
       (select count(*) from jsonb_object_keys((:'catalog')::jsonb -> 'stickers')) as n_pages \gset
select t.ok(:'pc1' like 'aura:%' and :'pc2' like 'aura:%', 'the first two pencil commons are auras (the room checks count on it)');

\echo '    the prize list'
select t.ok((select count(*) from public.club_catalog where active) = :n_items, 'every prize in catalog.json is copied');
select t.ok((select rules ->> 'price' from public.club_rules) = '50' and not (select rules ? 'items' from public.club_rules), 'the rules are kept without the list');
select t.ok((select count(*) from cron.job where jobname = 'club-catalog' and schedule = '*/10 * * * *') = 1, 'the copy runs every 10 minutes');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 500, 'oops');
select public.club_catalog_sync();
select t.ok((select note from public.club_rules) = 'the site answered 500' and (select count(*) from public.club_catalog where active) = :n_items, 'a failed request is noted and the list kept');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 200, '<html>');
select public.club_catalog_sync();
select t.ok((select note like 'the prize list was not copied:%' from public.club_rules), 'an answer that is not the list is noted');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 200, jsonb_set((:'catalog')::jsonb, '{tiers}', '["c","r","e","l","m","z","x"]')::text);
select public.club_catalog_sync();
select t.ok((select note like '%not in the expected shape%' from public.club_rules), 'a list with a new tier is not copied');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 200, jsonb_set((:'catalog')::jsonb, '{price}', '0')::text);
select public.club_catalog_sync();
select t.ok((select note like '%prices the clubhouse cannot use%' from public.club_rules) and (select rules ->> 'price' from public.club_rules) = '50', 'nor one with free crates');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 200, jsonb_set((:'catalog')::jsonb, '{items}', ((:'catalog')::jsonb -> 'items') - 0)::text);
select public.club_catalog_sync();
select t.ok((select count(*) from public.club_catalog where not active) = 1, 'a prize no longer listed is switched off');
select asked from public.club_rules \gset
insert into net._http_response (id, status_code, content) values (:asked, 200, :'catalog');
select public.club_catalog_sync();
select t.ok((select count(*) from public.club_catalog where active) = :n_items, 'and on again when it is back');
select public.club_catalog_sync();
select t.ok((select note from public.club_rules) = :n_items || ' prizes copied', 'no answer yet changes nothing');

\echo '    who may call what'
select t.ok(not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname like 'club\_%' and c.relkind = 'r'
    and (has_table_privilege('anon', c.oid, 'select, insert, update, delete') or has_table_privilege('authenticated', c.oid, 'select, insert, update, delete'))),
  'no clubhouse table can be read or written from a page');
select t.ok((select array_agg(p.proname::text order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'club\_%' and p.proname not like 'club\_live\_%' and has_function_privilege('authenticated', p.oid, 'execute'))
  = array['club_board_add', 'club_board_remove', 'club_claim', 'club_erase', 'club_freeze', 'club_gift', 'club_join', 'club_nick',
          'club_open', 'club_room_link', 'club_room_save', 'club_room_view', 'club_state'], 'a signed-in student can call only the page''s functions');
select t.ok((select array_agg(p.proname::text) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'club\_%' and p.proname not like 'club\_live\_%' and has_function_privilege('anon', p.oid, 'execute')) = array['club_room_view'],
  'a visitor with no account can only look at a shared room');
select t.as_user(null);
select t.fails('select * from public.club_profiles', 'permission denied');
select t.fails('select public.club_state()', 'permission denied');
select t.ok(public.club_room_view('0123456789abcdef0123456789abcdef') is null, 'an unknown room link shows nothing');
select t.as_user(:'A');
select t.fails('select * from public.club_ledger', 'permission denied');
select t.fails('insert into public.club_ledger (user_id, key, amount) values (auth.uid(), ''x'', 1000)', 'permission denied');
select t.fails('select public.club_balance(auth.uid())', 'permission denied');
select t.fails('select public.club_catalog_sync()', 'permission denied');
select t.ok(public.club_state() ->> 'joined' = 'false' and public.club_state() ->> 'ready' = 'true', 'a student who has not joined is told so');
select t.fails('select public.club_claim(''{}'')', 'join first');
select t.fails('select public.club_open(''pencil'')', 'join first');
select t.fails('select public.club_room_save(''{}'')', 'join first');
reset role;

\echo '    joining: an honest record comes over'
select jsonb_build_object(
  'days', (select jsonb_agg(to_char(x, 'YYYY-MM-DD')) from generate_series(public.club_day() - 35, public.club_day(), interval '1 day') x where x::date <> public.club_day() - 19),
  'fz', jsonb_build_object(:'d19', 1, :'d50', 1),
  'e', jsonb_build_object('qotd.m.' || :'d0', 10, 'qotd.rw.' || :'d0', 10, 'plan.' || :'d0', 20, 'rev.' || :'d0', 20,
         'qotd.m.' || :'d1', 10, 'plan.' || :'d1', 20, 'rev.' || :'d1', 999, 'qotd.m.2026-11-01', 10, 'qotd.m.' || :'p5', 10,
         'gift.coins', 10000, 'dupe.zzzz', 20, 'qotd.m.2026-02-30', 10, 'plan.x', 20, 'qotd.rw.' || :'d1', 'ten'),
  'x', jsonb_build_object('crate.aaaa1', 50, 'crate.aaaa2', 50, 'crate.aaaa3', 50, 'freeze.ff1', 30),
  'o', jsonb_build_object(
         'aaaa1', jsonb_build_array(:t0 + 1000, 'pencil', :'pc1', 'c', 0, 'pencil-3'),
         'aaaa2', jsonb_build_array(:t0 + 2000, 'pencil', :'pc1', 'c', 1, 'pencil-3'),
         'aaaa3', jsonb_build_array(:t0 + 3000, 'night', :'z1', 'z', 0, 'night-1'),
         'g.welcome', jsonb_build_array(:t0 + 4000, 'pencil', :'pc2', 'c', 0, 'pencil-9'),
         'g.ms7.' || :'d35', jsonb_build_array(:t0 + 5000, 'arcade', :'r1', 'r', 0, 'arcade-2'),
         'g.ms30.' || :'d35', jsonb_build_array(:t0 + 6000, 'night', :'pc1', 'c', 1, 'night-4'),
         'g.ms100.' || :'d35', jsonb_build_array(:t0 + 7000, 'night', :'z1', 'z', 0, ''),
         'zzzz9', jsonb_build_array(:t0 + 8000, 'pencil', 'theme:nope', 'c', 0, ''),
         'gift.' || replace(:'pc1', ':', '.'), jsonb_build_array(:t0, 'pencil', :'pc1', 'c', 0, ''),
         'gift.all', jsonb_build_array(:t0, '', '', '', 0, ''),
         'BAD KEY', jsonb_build_array(:t0, 'pencil', :'pc1', 'c', 0, '')),
  'g', jsonb_build_object('welcome', '[1, "pencil", "c", "x"]'::jsonb, 'ms7.' || :'d35', '[1, "", "r", "x"]'::jsonb,
         'ms30.' || :'d35', '[1, "", "e", "x"]'::jsonb, 'ms100.' || :'d35', '[1, "", "m", "x"]'::jsonb,
         'ms7.' || :'d20', '[1, "", "r", "x"]'::jsonb, 'test.' || :'p3', '[1, "test", "e", "x"]'::jsonb,
         'test.' || :'p30', '[1, "test", "e", "x"]'::jsonb, 'page.pencil', '[1, "pencil", "c", "x"]'::jsonb)
)::text as a_rec \gset
select t.as_user(:'A');
select public.club_join(:'a_rec') as a_state \gset
reset role;
select t.ok((select carried from public.club_profiles where user_id = :'A') = '{"prizes": 4, "left_out": 4, "coins": 0, "days": 36}', 'what came over: 4 prizes (4 left out), 0 coins, 36 days');
select t.ok(public.club_balance(:'A') = 0, 'coins: 110 earned since crates came, 2 crates bought, 20 back for a repeat, a freeze');
select t.ok(t.same((select array_agg(key) from public.club_ledger where user_id = :'A'), array['crate.aaaa1', 'crate.aaaa2', 'dupe.aaaa2', 'freeze.ff1',
  'plan.' || :'d0', 'plan.' || :'d1', 'qotd.m.' || :'d0', 'qotd.m.' || :'d1', 'qotd.rw.' || :'d0', 'rev.' || :'d0', 'rev.' || :'d1']),
  'only real reasons from days since crates came, at the usual amounts');
select t.ok((select amount from public.club_ledger where user_id = :'A' and key = 'rev.' || :'d1') = 20, 'reviews: 20 coins a day at most');
select t.ok((select array_agg(id || '/' || item || '/' || tier || '/' || dupe || '/' || sticker || '/' || how order by at) from public.club_crates where user_id = :'A')
  = array['aaaa1/' || :'pc1' || '/c/false/pencil-3/carried', 'aaaa2/' || :'pc1' || '/c/true/pencil-3/carried',
          'g.welcome/' || :'pc2' || '/c/false//carried', 'g.ms7.' || :'d35' || '/' || :'r1' || '/r/false/arcade-2/carried'],
  'crates: the two paid for, and the free crates the days earned, with their stickers; not the gift ones');
select t.ok(t.same((select array_agg(key || '/' || series || '/' || min_tier || '/' || coalesce(used, '-')) from public.club_grants where user_id = :'A'),
  array['ms30.' || :'d35' || '//e/-', 'ms7.' || :'d35' || '//r/g.ms7.' || :'d35', 'test.' || :'p3' || '/test/e/-', 'welcome/pencil/c/g.welcome']),
  'free crates: the welcome one, 7 and 30 days in a row (the 30-day one still waiting), the Test Day one');
select t.ok((select test_day from public.club_profiles where user_id = :'A') = public.club_day() + 3, 'the test date comes over');
select t.ok(t.same((select array_agg(sticker) from public.club_stickers where user_id = :'A'), array['arcade-2', 'pencil-3']), 'stickers from the crates that came over');
select t.ok((select array_agg(day) from public.club_days where user_id = :'A' and frozen) = array[public.club_day() - 19], 'the day a freeze covered');
select t.ok((select n from public.club_streak(:'A')) = 36 and public.club_freezes_left(:'A') = 0, 'a 36-day streak, the freeze used');
select t.ok((:'a_state')::jsonb -> 'fz' = jsonb_build_object(:'d19', 1) and (:'a_state')::jsonb -> 'streak' = '{"n": 36, "best": 36}'
  and not ((:'a_state')::jsonb -> 'o') ? 'gift.all' and (:'a_state')::jsonb ->> 'test' = :'p3'
  and (:'a_state')::jsonb -> 'g' -> ('ms30.' || :'d35') ->> 2 = 'e' and (:'a_state')::jsonb -> 'x' ->> 'crate.aaaa1' = '50',
  'the page gets it all back in the shapes it keeps');
select t.as_user(:'A');
select public.club_join('{"e": {"gift.coins": 99999}}');
reset role;
select t.ok(public.club_balance(:'A') = 0 and (select count(*) from public.club_crates where user_id = :'A') = 4, 'joining again changes nothing');

\echo '    joining: a finished sticker page'
select jsonb_build_object(
  'days', (select jsonb_agg(to_char(x, 'YYYY-MM-DD')) from generate_series(public.club_day() - 32, public.club_day(), interval '1 day') x),
  'e', (select jsonb_object_agg(k || to_char(public.club_day() + i, 'YYYY-MM-DD'), v) from generate_series(-2, 1) i,
          (values ('qotd.m.', 10), ('qotd.rw.', 10), ('plan.', 20), ('rev.', 20)) r(k, v)),
  'x', '{"crate.bbbb1": 50, "crate.bbbb2": 50, "crate.bbbb3": 50, "crate.bbbb4": 50, "crate.bbbb5": 50}'::jsonb,
  'o', jsonb_build_object(
         'g.welcome', jsonb_build_array(:t0 + 1000, 'pencil', :'pc1', 'c', 0, 'pencil-0'),
         'g.ms7.' || :'d32', jsonb_build_array(:t0 + 2000, 'pencil', :'r1', 'r', 0, 'pencil-1'),
         'g.ms30.' || :'d32', jsonb_build_array(:t0 + 3000, 'pencil', :'e1', 'e', 0, 'pencil-2'),
         'bbbb1', jsonb_build_array(:t0 + 4000, 'pencil', :'pc2', 'c', 0, 'pencil-3'),
         'bbbb2', jsonb_build_array(:t0 + 5000, 'pencil', :'pc2', 'c', 1, 'pencil-4'),
         'bbbb3', jsonb_build_array(:t0 + 6000, 'pencil', :'pc2', 'c', 1, 'pencil-5'),
         'bbbb4', jsonb_build_array(:t0 + 7000, 'pencil', :'pc2', 'c', 1, 'pencil-6'),
         'bbbb5', jsonb_build_array(:t0 + 8000, 'pencil', :'pc2', 'c', 1, 'pencil-7'),
         'g.page.pencil', jsonb_build_array(:t0 + 9000, 'pencil', :'pc1', 'c', 1, 'pencil-0')),
  'g', jsonb_build_object('welcome', '[1, "pencil", "c", "x"]'::jsonb, 'ms7.' || :'d32', '[1, "", "r", "x"]'::jsonb,
         'ms30.' || :'d32', '[1, "", "e", "x"]'::jsonb, 'page.pencil', '[1, "pencil", "c", "x"]'::jsonb)
)::text as b_rec \gset
select t.as_user(:'B');
select public.club_join(:'b_rec');
reset role;
select t.ok((select carried from public.club_profiles where user_id = :'B') = '{"prizes": 9, "left_out": 0, "coins": 90, "days": 33}', 'all 9 crates came over, 90 coins left');
select t.ok((select count(*) from public.club_stickers where user_id = :'B') = 8 and exists (select 1 from public.club_grants where user_id = :'B' and key = 'page.pencil' and used = 'g.page.pencil'),
  'the crate for the finished pencil page came over once the page was full');

\echo '    joining: a changed record brings no more than honest practice'
select jsonb_build_object(
  'days', (select jsonb_agg(to_char(x, 'YYYY-MM-DD')) from generate_series(date '2026-09-01', public.club_day() + 30, interval '1 day') x),
  'e', (select jsonb_object_agg(k || to_char(x, 'YYYY-MM-DD'), v) from generate_series(public.club_day() - 60, public.club_day() + 30, interval '1 day') x,
          (values ('qotd.m.', 10), ('qotd.rw.', 10), ('plan.', 20), ('rev.', 999)) r(k, v)),
  'x', (select jsonb_object_agg('crate.cccc' || i, 50) from generate_series(1, 200) i),
  'o', (select jsonb_object_agg('cccc' || i, jsonb_build_array(:t0 + i * 1000, 'night', :'z1', 'z', 0, 'night-' || (i % 8))) from generate_series(1, 200) i)
       || '{"gift.all": [1, "", "", "", 0, ""]}'::jsonb,
  'g', (select jsonb_object_agg(k || to_char(x, 'YYYY-MM-DD'), '[1, "", "m", ""]'::jsonb) from generate_series(date '2026-10-01', public.club_day(), interval '1 day') x,
          (values ('ms7.'), ('ms30.'), ('ms100.')) r(k))
       || (select jsonb_object_agg('test.' || to_char(public.club_day() + i, 'YYYY-MM-DD'), '[1, "test", "e", ""]'::jsonb) from generate_series(0, 7) i)
)::text as c_rec \gset
select t.as_user(:'C');
select public.club_join(:'c_rec');
reset role;
select 60 * ((public.club_day() + 1) - date '2026-11-14' + 1) as c_earned, (public.club_day() + 1) - date '2026-10-07' + 1 as c_days \gset
-- what the carry-over allows: a crate while 50 coins are left, each after the first a repeat that gives 20 back
select n as c_bought, b as c_left from (
  with recursive buy(n, b) as (select 0, :c_earned union all select n + 1, b - 50 + case when n > 0 then 20 else 0 end from buy where b >= 50 and n < 200)
  select n, b from buy order by n desc limit 1) z \gset
select t.ok(public.club_balance(:'C') = :c_left and (select count(*) from public.club_crates where user_id = :'C' and id like 'cccc%') = :c_bought,
  'coins only for days since crates came, and crates only while they pay for them');
select t.ok((select count(*) from public.club_days where user_id = :'C') = :c_days, 'no days before the site opened, or after tomorrow');
select t.ok(t.same((select array_agg(key) from public.club_grants where user_id = :'C'),
  array['ms7.2026-10-07', 'ms30.2026-10-07', 'test.' || :'p7', 'welcome'] || case when :c_days >= 100 then array['ms100.2026-10-07'] else '{}' end
  -- As the date advances, the honest coin budget can fund eight crates, completing the eight-sticker night page.
  || case when :c_bought >= 8 then array['page.night'] else '{}' end),
  'free crates only for earned streaks, a completed sticker page, and one Test Day crate');
select t.ok((select count(*) from public.club_stickers where user_id = :'C' and sticker like 'night-%') = least(:c_bought, 8),
  'the carried night stickers are distinct and the page grant needs all eight');
select t.ok((select gifted_at is null from public.club_profiles where user_id = :'C'), 'the owner''s link does not come over from a device');

\echo '    coins for the day'
select t.as_user(:'E');
select public.club_join('{}');
select t.ok((public.club_state() -> 'e') = '{}' and public.club_state() ->> 'joined' = 'true', 'a student with nothing on the device joins with nothing');
select public.club_claim(jsonb_build_object('qotd.m.' || :'d0', 1, 'qotd.rw.' || :'d0', 1, 'plan.' || :'d0', 1, 'rev.' || :'d0', 15, 'day.' || :'d0', 1));
reset role;
select t.ok(public.club_balance(:'E') = 55, 'the day''s coins: 10 + 10 + 20 + 15');
select t.ok(exists (select 1 from public.club_grants where user_id = :'E' and key = 'welcome' and series = 'pencil'), 'the first day practiced brings the welcome crate');
select t.as_user(:'E');
select public.club_claim(jsonb_build_object('qotd.m.' || :'d0', 1, 'plan.' || :'d0', 1, 'rev.' || :'d0', 10));
reset role;
select t.ok(public.club_balance(:'E') = 55, 'each reason counts once, and fewer reviews take nothing back');
select t.as_user(:'E');
select public.club_claim(jsonb_build_object('rev.' || :'d0', 20, 'qotd.m.' || :'d3', 1, 'qotd.m.' || :'d2', 1, 'qotd.m.' || :'p1', 1,
  'qotd.m.' || :'p2', 1, 'rev.' || :'d1', 999, 'rev.' || :'d2', 1000, 'plan.' || :'d1', -5, 'qotd.x.' || :'d0', 1, 'gift.coins', 10000,
  'plan.2026-02-30', 1));
reset role;
select t.ok(t.same((select array_agg(key || '=' || amount) from public.club_ledger where user_id = :'E'),
  array['plan.' || :'d0' || '=20', 'plan.' || :'d1' || '=20', 'qotd.m.' || :'d0' || '=10', 'qotd.m.' || :'d2' || '=10', 'qotd.m.' || :'p1' || '=10',
          'qotd.rw.' || :'d0' || '=10', 'rev.' || :'d0' || '=20', 'rev.' || :'d1' || '=20']),
  'only days from two days ago to tomorrow, each reason at its usual amount, reviews 20 at most');

\echo '    streaks, freezes and milestones'
insert into public.club_days (user_id, day) select :'E', public.club_day() - i from generate_series(2, 5) i;
insert into public.club_ledger (user_id, key, amount) values (:'E', 'test.coins', -95);
select t.as_user(:'E');
select t.fails('select public.club_freeze()', 'not enough coins');
reset role;
update public.club_ledger set amount = -65 where user_id = :'E' and key = 'test.coins';
select t.as_user(:'E');
select public.club_freeze();
select public.club_claim('{}');
reset role;
select t.ok(exists (select 1 from public.club_days where user_id = :'E' and day = public.club_day() - 1 and frozen), 'a missed day is covered by a freeze bought ahead');
select t.ok((select n from public.club_streak(:'E')) = 6 and public.club_freezes_left(:'E') = 0, 'and the streak goes on (6 days), the freeze used');
update public.club_ledger set amount = 1000 where user_id = :'E' and key = 'test.coins';
select t.as_user(:'E');
select public.club_freeze();
select public.club_freeze();
select t.fails('select public.club_freeze()', 'you have all the freezes you can hold');
reset role;
insert into public.club_days (user_id, day) values (:'E', public.club_day() - 6);
select t.as_user(:'E');
select public.club_claim('{}');
reset role;
select t.ok(exists (select 1 from public.club_grants where user_id = :'E' and key = 'ms7.' || :'d6' and series = '' and min_tier = 'r'), '7 days in a row bring a free crate, Rare or better');
select t.as_user(:'E');
select public.club_claim(jsonb_build_object('test.' || :'p3', 1));
reset role;
select t.ok((select test_day from public.club_profiles where user_id = :'E') = public.club_day() + 3
  and exists (select 1 from public.club_grants where user_id = :'E' and key = 'test.' || :'p3' and series = 'test' and min_tier = 'e'),
  'a test this week brings the Test Day crate');
select t.as_user(:'E');
select public.club_claim(jsonb_build_object('test.' || :'p5', 1, 'test.' || :'p8', 1, 'test.' || :'d1', 1));
reset role;
select t.ok((select count(*) from public.club_grants where user_id = :'E' and key like 'test.%') = 1 and (select test_day from public.club_profiles where user_id = :'E') = public.club_day() + 3,
  'another test date within 30 days, or one out of range, brings nothing');

\echo '    opening crates'
select t.as_user(:'E');
select public.club_open('pencil') as o1 \gset
reset role;
select t.ok(exists (select 1 from public.club_crates c join public.club_catalog k on k.id = c.item
  where c.user_id = :'E' and c.id = (:'o1')::jsonb ->> 'id' and c.how = 'crate' and c.series = 'pencil' and c.tier = k.tier and c.tier = (:'o1')::jsonb ->> 'tier'),
  'a crate opened is kept with its prize and that prize''s tier');
select t.ok((:'o1')::jsonb ->> 'sticker' ~ '^pencil-[0-7]$' and exists (select 1 from public.club_stickers where user_id = :'E' and sticker = (:'o1')::jsonb ->> 'sticker'),
  'with a sticker from its series');
select t.ok(exists (select 1 from public.club_ledger where user_id = :'E' and key = 'crate.' || ((:'o1')::jsonb ->> 'id') and amount = -50)
  and (:'o1')::jsonb -> 'state' -> 'o' ? ((:'o1')::jsonb ->> 'id'), 'paid for, and in the record the page gets back');
select t.as_user(:'E');
select t.fails('select public.club_open(''nope'')', 'there is no such crate');
select t.fails('select public.club_open(''pencil'', ''nope'')', 'that free crate is not waiting');
select public.club_open('night', 'welcome') as o2 \gset
select t.fails('select public.club_open(''pencil'', ''welcome'')', 'that free crate is not waiting');
select t.fails(format('select public.club_open(%L, %L)', 'test', 'ms7.' || :'d6'), 'pick a series');
select public.club_open('night', 'ms7.' || :'d6') as o3 \gset
select public.club_open('arcade', 'test.' || :'p3') as o4 \gset
select public.club_open('test') as o5 \gset
reset role;
select t.ok((:'o2')::jsonb ->> 'series' = 'pencil' and (:'o2')::jsonb ->> 'id' = 'g.welcome', 'the welcome crate is a pencil crate');
select t.ok((:'o3')::jsonb ->> 'series' = 'night' and (:'o3')::jsonb ->> 'tier' <> 'c', 'a 7-day crate: the series picked, Rare or better');
select t.ok((:'o4')::jsonb ->> 'series' = 'test' and (:'o4')::jsonb ->> 'tier' in ('e', 'l', 'm', 'z'), 'the free Test Day crate: Epic or better');
select t.ok((:'o5')::jsonb ->> 'tier' in ('e', 'l', 'm', 'z'), 'a Test Day crate bought in the test week: Epic or better');
select t.ok(not exists (select 1 from public.club_ledger where user_id = :'E' and key like 'crate.g.%'), 'free crates cost nothing');
select t.as_user(:'B');
select t.fails('select public.club_open(''test'')', 'the Test Day crate opens in the last week before your test');
select t.as_user(:'D');
select public.club_join('{}');
select t.fails('select public.club_open(''pencil'')', 'not enough coins');
reset role;
-- repeats give coins back; dupe is set only for a prize already held
update public.club_ledger set amount = 100000 where user_id = :'E' and key = 'test.coins';
select set_config('t.e', :'E', false);
do $$ declare u uuid := current_setting('t.e')::uuid; i int; begin
  perform setseed(0.25);
  perform t.as_user(u);
  for i in 1 .. 60 loop perform public.club_open('arcade'); end loop;
  execute 'reset role';
end $$;
select t.ok(not exists (select 1 from public.club_crates c where c.user_id = :'E'
  and c.dupe <> exists (select 1 from public.club_crates x where x.user_id = c.user_id and x.item = c.item and x.at < c.at)), 'a prize is a repeat exactly when it was held before');
select t.ok((select count(*) from public.club_crates c where c.user_id = :'E' and c.dupe and c.how <> 'carried')
  = (select count(*) from public.club_ledger where user_id = :'E' and key like 'dupe.%' and amount = 20), 'and each repeat gives 20 coins back');

\echo '    the promise of an Epic'
select t.as_user(:'H');
select public.club_join('{}');
reset role;
insert into public.club_ledger (user_id, key, amount) values (:'H', 'test.coins', 100000);
select set_config('t.h', :'H', false), set_config('t.pc1', :'pc1', false), set_config('t.e1', :'e1', false);
do $$ declare u uuid := current_setting('t.h')::uuid; k int; i int; o jsonb; low int := 0; begin
  perform setseed(0.5);
  for k in 1 .. 60 loop
    -- an Epic, then 9 (or 8) below it
    insert into public.club_crates (user_id, id, series, item, tier, how, at) values (u, 'p' || k, 'pencil', current_setting('t.e1'), 'e', 'crate', clock_timestamp());
    for i in 1 .. 9 - k % 2 loop
      insert into public.club_crates (user_id, id, series, item, tier, how, at) values (u, 'p' || k || 'x' || i, 'pencil', current_setting('t.pc1'), 'c', 'crate', clock_timestamp());
    end loop;
    perform t.as_user(u);
    o := public.club_open('pencil');
    execute 'reset role';
    if k % 2 = 0 then
      perform t.ok(o ->> 'tier' in ('e', 'l', 'm'), 'after 9 crates below Epic, the next is Epic, Legendary or Mythic (never Radiant): got ' || (o ->> 'tier'));
    elsif o ->> 'tier' in ('c', 'r') then low := low + 1;
    end if;
  end loop;
  perform t.ok(low > 0, 'after only 8, the next can still be below Epic');
end $$;

\echo '    the owner''s link'
update public.club_rules set rules = jsonb_set(rules, '{gift}', to_jsonb(encode(sha256(convert_to('test-owner-code-1234', 'UTF8')), 'hex')));
select t.as_user(:'G');
select public.club_join('{}');
select t.fails('select public.club_gift(''wrong-code-0000000000'')', 'that link does not unlock anything');
select t.fails('select public.club_gift(''short'')', 'that link does not unlock anything');
select public.club_gift('test-owner-code-1234');
select public.club_gift('test-owner-code-1234') as g_state \gset
reset role;
update public.club_rules set rules = jsonb_set(rules, '{gift}', (:'catalog')::jsonb -> 'gift');
select t.ok((select count(*) from public.club_crates where user_id = :'G' and how = 'gift') = :n_items
  and (select count(*) from public.club_stickers where user_id = :'G') = :n_stickers
  and (select count(*) from public.club_grants where user_id = :'G' and key like 'page.%') = :n_pages
  and public.club_balance(:'G') = 10000, 'every prize, every sticker (and so every page''s crate) and 10,000 coins, however often it is opened');
select t.ok((:'g_state')::jsonb -> 'o' ? 'gift.all', 'the page sees the link was used');
select t.ok((select tier from public.club_crates where user_id = :'G' order by at desc limit 1) = 'z', 'the last prize given is a Radiant, so the promise of an Epic starts again');

\echo '    nicknames'
select t.as_user(:'A');
select t.ok(public.club_nick('  Maya   R ') = '{"ok": true, "nick": "Maya R"}', 'a nickname is kept with its spaces tidied');
select t.as_user(:'B');
select t.ok(public.club_nick('maya r') ->> 'why' = 'taken', 'a nickname someone has is taken, whatever the capitals');
select t.ok(public.club_nick('ab') ->> 'why' = 'form', 'too short');
select t.ok(public.club_nick(repeat('a', 21)) ->> 'why' = 'form', 'too long');
select t.ok(public.club_nick('Call 5551234567') ->> 'why' = 'form', 'not a phone number');
select t.ok(public.club_nick('Hi <b>') ->> 'why' = 'form' and public.club_nick('Sam_2') ->> 'why' = 'form', 'letters, digits, spaces, dots and dashes only');
select t.ok(public.club_nick('S.h.i.t') ->> 'why' = 'words', 'no rude words, even spelled out');
select t.ok(public.club_nick('Sam-2') ->> 'ok' = 'true', 'a fine name');
select t.as_user(:'A');
select t.ok(public.club_nick('MAYA R') ->> 'ok' = 'true', 'a student can change the capitals of their own name');
reset role;

\echo '    rooms'
select t.as_user(:'A');
select t.fails('select public.club_room_link(true)', 'save your room first');
select public.club_room_save(jsonb_build_object('w', :'th1', 'win', :'pp1', 'st', jsonb_build_array(:'pc1', :'pc1', :'aura9'),
  'sh', jsonb_build_array(split_part(:'sks', ',', 1)), 'bd', jsonb_build_array('pencil-3', 'pencil-3', 'night-1', 'arcade-2'),
  'tl', 'week', 'av', jsonb_build_array('Teal!', 'x'))) as a_room \gset
reset role;
select t.ok(((:'a_room')::jsonb -> 'layout') - 't' = jsonb_build_object('v', 1, 'w', '', 'win', '', 'st', jsonb_build_array(:'pc1', '', ''), 'sh', '[]'::jsonb,
  'bd', '["pencil-3", "arcade-2"]'::jsonb, 'tl', 'week', 'av', '["violet", "", "", "b", "t2", "dark"]'::jsonb), 'a room keeps only what its owner has won: ' || :'a_room');
select t.as_user(:'A');
select t.ok(public.club_room_save('{"tl": "century"}') -> 'layout' ->> 'tl' = '', 'a title the server can check must be earned');
select t.ok(public.club_room_save('{"tl": "collector"}') -> 'layout' ->> 'tl' = '', '25 prizes for the Collector');
select t.ok(public.club_room_save('{"tl": "planner"}') -> 'layout' ->> 'tl' = 'planner', 'a title only the device can know is taken on trust');
select t.ok(public.club_room_save('{"tl": "boss"}') -> 'layout' ->> 'tl' = '', 'a title that does not exist is dropped');
select t.ok(public.club_room_save(jsonb_build_object('av', jsonb_build_array('teal', 'beanie', :'sk1', 'g', 't9', 'Red!'))) -> 'layout' -> 'av'
  = '["teal", "beanie", "", "g", "t2", "dark"]', 'a character skin not won is dropped, and so are a skin tone and hair the site does not have');
select t.ok(public.club_room_save('{"av": ["teal", "beanie", "theme:x", "boy", "t4", "red"]}') -> 'layout' -> 'av'
  = '["teal", "beanie", "", "b", "t4", "red"]', 'only a skin can be worn, and a figure is a boy or a girl');
select t.ok(public.club_room_save('{"av": ["pink", "bow"]}') -> 'layout' -> 'av' = '["pink", "bow", "", "b", "t2", "dark"]',
  'a page from before character skins keeps its color and hat');
select t.as_user(:'G');
select public.club_room_save(jsonb_build_object('w', :'th1', 'win', :'pp1', 'st', jsonb_build_array(:'aura9', :'aura9', :'fx1'),
  'sh', to_jsonb(string_to_array(:'sks', ',')), 'bd', '["pencil-0", "pencil-1", "pencil-2", "pencil-3", "pencil-4", "pencil-5", "pencil-6"]'::jsonb,
  'tl', 'century', 'av', jsonb_build_array('teal', 'beanie', :'sk1', 'g', 't5', 'silver'))) as g_room \gset
reset role;
select t.ok((:'g_room')::jsonb -> 'layout' ->> 'w' = :'th1' and (:'g_room')::jsonb -> 'layout' ->> 'win' = :'pp1'
  and (:'g_room')::jsonb -> 'layout' -> 'st' = jsonb_build_array(:'aura9', '', :'fx1') and jsonb_array_length((:'g_room')::jsonb -> 'layout' -> 'sh') = 3
  and jsonb_array_length((:'g_room')::jsonb -> 'layout' -> 'bd') = 6 and (:'g_room')::jsonb -> 'layout' ->> 'tl' = 'century'
  and (:'g_room')::jsonb -> 'layout' -> 'av' = jsonb_build_array('teal', 'beanie', :'sk1', 'g', 't5', 'silver'),
  'a full room: 3 stands, 3 streak styles, 6 stickers, any title and a character skin with the owner''s link');
select t.as_user(:'E');
select t.fails('select public.club_room_link(true)', 'choose a nickname first');
select t.as_user(:'A');
select public.club_room_save(jsonb_build_object('st', jsonb_build_array(:'pc1'), 'bd', '["pencil-3"]'::jsonb, 'tl', 'week'));
select public.club_room_link(true) ->> 'link' as link1 \gset
select t.ok(public.club_room_link(true) ->> 'link' = :'link1', 'switching on a shared room keeps its link');
select t.ok(public.club_room_link(false) ->> 'link' is null, 'switched off, it has none');
select public.club_room_link(true) ->> 'link' as link2 \gset
select t.ok(:'link2' ~ '^[0-9a-f]{32}$' and :'link2' <> :'link1', 'switched on again, a new link');
select t.as_user(null);
select public.club_room_view(:'link2') as view \gset
select t.ok((:'view')::jsonb ->> 'nick' = 'MAYA R' and (:'view')::jsonb -> 'layout' -> 'bd' = '["pencil-3"]' and (:'view')::jsonb ->> 'n' = '36'
  and (:'view')::jsonb ->> 'mine' = 'false' and (:'view')::jsonb -> 'board' = '[]' and not (:'view')::jsonb ? 'e', 'anyone with the link sees the room, its nickname and streak, nothing else');
select t.ok(public.club_room_view(:'link1') is null, 'an old link shows nothing');
select t.as_user(:'A');
select t.ok(public.club_room_view(:'link2') ->> 'mine' = 'true', 'the owner is told it is theirs');
reset role;
update public.club_profiles set blocked = true where user_id = :'A';
select t.as_user(null);
select t.ok(public.club_room_view(:'link2') is null, 'a room the site''s owner blocked shows nothing');
select t.as_user(:'A');
select t.fails('select public.club_room_link(true)', 'sharing is switched off for this account');
reset role;
update public.club_profiles set blocked = false where user_id = :'A';

\echo '    stickers on a room''s board'
select t.as_user(:'D');
select t.fails(format('select public.club_board_add(%L, %L)', :'link2', 'pencil-3'), 'choose a nickname first');
select public.club_nick('Dev');
select t.fails(format('select public.club_board_add(%L, %L)', :'link2', 'pencil-3'), 'you do not have that sticker');
reset role;
insert into public.club_stickers (user_id, sticker) values (:'D', 'pencil-3'), (:'D', 'night-2');
select t.as_user(:'D');
select public.club_board_add(:'link2', 'pencil-3');
select public.club_board_add(:'link2', 'night-2') as board \gset
select t.ok(jsonb_array_length((:'board')::jsonb) = 1 and (:'board')::jsonb -> 0 -> 1 = '"night-2"' and (:'board')::jsonb -> 0 ->> 2 = 'Dev'
  and (:'board')::jsonb -> 0 ->> 3 = :'d0', 'one sticker a day from each visitor: a second one replaces the first');
select t.fails(format('select public.club_board_add(%L, %L)', :'link1', 'night-2'), 'this room is not shared any more');
select (:'board')::jsonb -> 0 ->> 0 as b_id \gset
select public.club_board_remove(:b_id);
select t.as_user(:'A');
select t.fails(format('select public.club_board_add(%L, %L)', :'link2', 'pencil-3'), 'this is your own room');
select t.ok(jsonb_array_length(public.club_room_view(:'link2') -> 'board') = 1, 'a visitor cannot take stickers off someone else''s board');
select public.club_board_remove(:b_id);
select t.ok(public.club_room_view(:'link2') -> 'board' = '[]', 'the owner can');
select t.ok(public.club_state() -> 'board' = '[]', 'and sees the board in their own record');
select t.as_user(null);
select t.fails(format('select public.club_board_add(%L, %L)', :'link2', 'night-2'), 'permission denied');
reset role;
insert into auth.users (id) select ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid from generate_series(1, 35) i;
insert into public.club_board (room_id, from_id, sticker, day, at)
select :'A', ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, 'pencil-1', public.club_day(), now() - interval '1 hour' + i * interval '1 second' from generate_series(1, 35) i;
select t.as_user(:'D');
select public.club_board_add(:'link2', 'pencil-3') as board \gset
reset role;
select t.ok(jsonb_array_length((:'board')::jsonb) = 30 and (select count(*) from public.club_board where room_id = :'A') = 30
  and (:'board')::jsonb -> 0 ->> 2 = 'Dev', 'a board keeps the newest 30');
update public.club_profiles set blocked = true where user_id = :'D';
select t.as_user(:'D');
select t.fails(format('select public.club_board_add(%L, %L)', :'link2', 'night-2'), 'stickers are switched off for this account');
reset role;
update public.club_profiles set blocked = false where user_id = :'D';

\echo '    erasing and deleting'
select t.as_user(:'E');
select public.club_erase();
reset role;
select t.ok(not exists (select 1 from public.club_profiles where user_id = :'E') and not exists (select 1 from public.club_ledger where user_id = :'E')
  and not exists (select 1 from public.club_crates where user_id = :'E') and not exists (select 1 from public.club_days where user_id = :'E')
  and not exists (select 1 from public.club_grants where user_id = :'E') and not exists (select 1 from public.club_stickers where user_id = :'E'),
  'erasing empties the clubhouse record');
select t.as_user(:'E');
select t.ok(public.club_state() ->> 'joined' = 'false', 'and the student is not joined');
select public.club_join('{}');
select t.ok(public.club_state() ->> 'joined' = 'true', 'until they join again');
select t.as_user(:'D');
select public.delete_account();
reset role;
select t.ok(not exists (select 1 from public.club_profiles where user_id = :'D') and not exists (select 1 from public.club_stickers where user_id = :'D')
  and not exists (select 1 from public.club_board where from_id = :'D'), 'deleting an account deletes its record and the stickers it left');

\echo '    the draw'
select set_config('t.f', :'F', false), set_config('t.l', :'L', false);
do $$ declare u uuid; i int; begin
  foreach u in array array[current_setting('t.f')::uuid, current_setting('t.l')::uuid] loop
    perform t.as_user(u);
    perform public.club_join('{}');
    execute 'reset role';
    insert into public.club_ledger (user_id, key, amount) values (u, 'test.coins', 1000000);
  end loop;
  perform setseed(0.75);   -- the same draws on every run
  -- L has practiced 30 days in a row: twice the luck
  insert into public.club_days (user_id, day) select current_setting('t.l')::uuid, public.club_day() - g from generate_series(0, 29) g;
  foreach u in array array[current_setting('t.f')::uuid, current_setting('t.l')::uuid] loop
    perform t.as_user(u);
    for i in 1 .. 1500 loop perform public.club_open('pencil'); end loop;
    execute 'reset role';
  end loop;
end $$;
\o
select u.who, count(*) as crates,
       round(100.0 * count(*) filter (where c.tier = 'c') / count(*), 1) as common,
       round(100.0 * count(*) filter (where c.tier = 'r') / count(*), 1) as rare,
       round(100.0 * count(*) filter (where c.tier = 'e') / count(*), 1) as epic,
       round(100.0 * count(*) filter (where c.tier in ('l', 'm', 'z')) / count(*), 1) as "legendary+",
       count(*) filter (where c.tier = 'z') as radiant,
       round(100.0 * count(*) filter (where c.tier = 'c' and k.series = 'pencil') / nullif(count(*) filter (where c.tier = 'c'), 0), 1) as "own series % of commons"
from public.club_crates c join public.club_catalog k on k.id = c.item
join (values (:'F'::uuid, 'plain luck'), (:'L'::uuid, 'a 30-day streak')) u(id, who) on u.id = c.user_id
group by u.who order by u.who desc;
\o /dev/null
select count(*) filter (where c.tier = 'c') * 1.0 / count(*) as f_c, count(*) filter (where c.tier in ('e', 'l', 'm', 'z')) * 1.0 / count(*) as f_e,
       count(*) filter (where c.tier in ('l', 'm', 'z')) * 1.0 / count(*) as f_l, count(*) filter (where c.tier = 'z') as f_z,
       count(*) filter (where c.tier = 'c' and k.series = 'pencil') * 1.0 / nullif(count(*) filter (where c.tier = 'c'), 0) as f_own
from public.club_crates c join public.club_catalog k on k.id = c.item where c.user_id = :'F' \gset
select count(*) filter (where c.tier in ('l', 'm', 'z')) * 1.0 / count(*) as l_l from public.club_crates c where c.user_id = :'L' \gset
-- what share of a pencil crate's commons should be pencil prizes, from the prize list: each of its own counts 3, the rest 1
select 3.0 * count(*) filter (where series = 'pencil') / (3.0 * count(*) filter (where series = 'pencil') + count(*) filter (where series <> 'pencil')) as e_own
from public.club_catalog where active and tier = 'c' \gset
-- with plain luck: Common 59.9%, Epic or better 13.1% (more with the promise), Legendary or better 3.1%, own series as above
select t.ok(:f_c between 0.45 and 0.65, 'about 55 to 60% Common: ' || :f_c);
select t.ok(:f_e between 0.12 and 0.26, 'about 16% Epic or better, the promise included: ' || :f_e);
select t.ok(:f_l between 0.01 and 0.07, 'about 3 to 4% Legendary or better: ' || :f_l);
select t.ok(:f_z <= 12, 'Radiant about 1 in 1,000 crates: ' || :f_z || ' in 1,500');
select t.ok(abs(:f_own - :e_own) <= 0.1, 'a pencil crate''s commons are its own prizes 3 times as often each: ' || round(:f_own, 3) || ', expected ' || round(:e_own, 3));
select t.ok(:l_l > :f_l * 1.2, 'a 30-day streak lifts Legendary and up (twice the odds): ' || :l_l || ' against ' || :f_l);
\echo '    all club database checks passed'
