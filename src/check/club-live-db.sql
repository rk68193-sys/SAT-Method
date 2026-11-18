-- Tests for src/account/club-live.sql (live rooms), run by src/check/club-db.sh after club-db.sql in the same database: it
-- uses that file's helpers (schema t) and its prize list. Each check that fails stops the run with "FAILED: <what>".
\set ON_ERROR_STOP 1
\o /dev/null

-- the last message sent to a topic, as [event, payload]
create function t.last_msg(tp text) returns jsonb language sql as $$
  select jsonb_build_array(event, payload) from realtime.messages where topic = tp and event <> 'probe' order by id desc limit 1
$$;
create function t.sent() returns bigint language sql security definer as $$ select coalesce(sum(sent), 0)::bigint from public.club_live_budget $$;
-- whether the signed-in student may listen to a topic, the way Realtime asks: a message on it, read under the policy
create function t.probe(tp text) returns void language sql security definer as $$
  insert into realtime.messages (topic, extension, event, private) values (tp, 'broadcast', 'probe', true)
$$;
create function t.hears(tp text) returns boolean language plpgsql as $$
declare n bigint;
begin
  perform t.probe(tp);
  perform set_config('realtime.topic', tp, false);
  select count(*) into n from realtime.messages where topic = tp and event = 'probe';
  perform set_config('realtime.topic', '', false);
  return n > 0;
end $$;
-- join a room as a student, and come back as the database's owner
create function t.live_join(u uuid, link text) returns jsonb language plpgsql as $$
declare v jsonb;
begin
  perform t.as_user(u);
  v := public.club_live_join(link);
  execute 'reset role';
  return v;
end $$;
-- a typed line from a student, as soon as they may send one (the 3-second wait is skipped)
create function t.chat(u uuid, line text) returns jsonb language plpgsql as $$
declare v jsonb;
begin
  update public.club_live_leases set say_at = null where user_id = u;
  perform t.as_user(u);
  v := public.club_live_chat(line);
  execute 'reset role';
  return v;
end $$;
grant execute on all functions in schema t to anon, authenticated;

\set O '00000000-0000-0000-0002-000000000001'
\set P '00000000-0000-0000-0002-000000000002'
\set Q '00000000-0000-0000-0002-000000000003'
\set R '00000000-0000-0000-0002-000000000004'
\set S '00000000-0000-0000-0002-000000000005'
\set N '00000000-0000-0000-0002-000000000006'
\set X '00000000-0000-0000-0002-000000000007'
insert into auth.users (id) values (:'O'), (:'P'), (:'Q'), (:'R'), (:'S'), (:'N'), (:'X');
-- twenty more students, in the clubhouse with a nickname, for the limits
insert into auth.users (id) select ('00000000-0000-0000-0003-' || lpad(i::text, 12, '0'))::uuid from generate_series(1, 20) i;
insert into public.club_profiles (user_id, nickname) select ('00000000-0000-0000-0003-' || lpad(i::text, 12, '0'))::uuid, 'Filler ' || i from generate_series(1, 20) i;
create function t.f(i int) returns uuid language sql as $$ select ('00000000-0000-0000-0003-' || lpad(i::text, 12, '0'))::uuid $$;
grant execute on function t.f(int) to anon, authenticated;

select t.as_user(:'O'); select public.club_join('{}'); select public.club_nick('Oak');
select public.club_room_save('{"av": ["teal", "cap"]}'); select public.club_room_link(true) ->> 'link' as link1 \gset
select t.as_user(:'S'); select public.club_join('{}'); select public.club_nick('Sage');
select public.club_room_save('{}'); select public.club_room_link(true) ->> 'link' as link2 \gset
select t.as_user(:'P'); select public.club_join('{}'); select public.club_nick('Pine'); select public.club_room_save('{"av": ["pink", "bow"]}');
select t.as_user(:'Q'); select public.club_join('{}'); select public.club_nick('Quill');
select t.as_user(:'R'); select public.club_join('{}'); select public.club_nick('Reed');
select t.as_user(:'N'); select public.club_join('{}');
reset role;
select t.sent() as b0 \gset

\echo '    live rooms: joining'
select t.as_user(null);
select t.fails(format('select public.club_live_join(%L)', :'link1'), 'permission denied');
select t.as_user(:'X');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'join', 'a student who is not in the clubhouse cannot join live');
select t.as_user(:'N');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'nick', 'nor one without a nickname');
select t.as_user(:'P');
select t.ok(public.club_live_join('0123456789abcdef0123456789abcdef') ->> 'why' = 'closed', 'a link that is not shared is closed');
select t.ok(public.club_live_join('anything') ->> 'why' = 'closed', 'and so is anything else');
select public.club_live_join(:'link1') as v \gset
select (:'v')::jsonb ->> 'topic' as topic1, (:'v')::jsonb ->> 'me' as pid_p \gset
select t.ok((:'v')::jsonb ->> 'ok' = 'true' and :'topic1' ~ '^live-[0-9a-f]{32}$' and :'pid_p' ~ '^[0-9a-f]{10}$' and (:'v')::jsonb ->> 'mine' = 'false'
  and ((:'v')::jsonb ->> 'left')::int = 399, 'a signed-in student with a nickname joins a shared room live');
select t.ok(jsonb_array_length((:'v')::jsonb -> 'members') = 1 and (:'v')::jsonb -> 'members' -> 0 ->> 0 = :'pid_p'
  and (:'v')::jsonb -> 'members' -> 0 -> 1 = '"Pine"' and (:'v')::jsonb -> 'members' -> 0 -> 2 = '"pink"' and (:'v')::jsonb -> 'members' -> 0 -> 3 = '"bow"'
  and ((:'v')::jsonb -> 'members' -> 0 ->> 4)::int between 40 and 89 and ((:'v')::jsonb -> 'members' -> 0 ->> 5)::int between 86 and 95
  and (:'v')::jsonb -> 'members' -> 0 -> 6 = '0', 'they are in it with their nickname, color and hat, on the floor');
reset role;
select t.ok(t.sent() = :b0, 'alone in a room, nothing is sent');
select t.as_user(:'Q');
select public.club_live_join(:'link1') as v \gset
select (:'v')::jsonb ->> 'me' as pid_q \gset
reset role;
select t.ok(t.last_msg(:'topic1') = jsonb_build_array('hi', jsonb_build_object('p', :'pid_q'))
  and (select private from realtime.messages where topic = :'topic1' order by id desc limit 1), 'the room hears that someone came in, on its private topic');
select t.ok(t.sent() = :b0 + 3, 'counted as 1, plus 1 for each of the 2 pages in the room');
select t.ok(jsonb_array_length((:'v')::jsonb -> 'members') = 2 and (:'v')::jsonb -> 'members' -> 0 ->> 0 = :'pid_p' and :'pid_q' <> :'pid_p', 'and they see who is there');
select t.ok(position(:'pid_q' in :'Q') = 0 and (select count(*) from public.club_live_leases where pid = :'pid_q') = 1, 'the id others see is not the account''s id');
select t.as_user(:'O');
select public.club_live_join(:'link1') as v \gset
select (:'v')::jsonb ->> 'me' as pid_o \gset
select t.ok((:'v')::jsonb ->> 'mine' = 'true' and (:'v')::jsonb -> 'members' -> 2 ->> 0 = :'pid_o' and (:'v')::jsonb -> 'members' -> 2 -> 2 = '"teal"'
  and (:'v')::jsonb -> 'members' -> 2 -> 3 = '"cap"' and (:'v')::jsonb -> 'members' -> 2 -> 6 = '1', 'the room''s owner joins it too, marked as the owner');
select t.sent() as b1 \gset
select public.club_live_join(:'link1') as v \gset
select t.ok((:'v')::jsonb ->> 'me' = :'pid_o' and t.sent() = :b1, 'joining again from the room keeps the place and sends nothing');

\echo '    who can listen and send'
select t.ok((select array_agg(p.proname::text order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'club\_live\_%' and has_function_privilege('authenticated', p.oid, 'execute'))
  = array['club_live_block', 'club_live_blocks', 'club_live_can_listen', 'club_live_chat', 'club_live_chat_start', 'club_live_count', 'club_live_join',
          'club_live_leave', 'club_live_ping', 'club_live_remove', 'club_live_report', 'club_live_say', 'club_live_unblock'],
  'a signed-in student can call only the page''s live functions');
select t.ok((select array_agg(p.proname::text) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'club\_live\_%' and has_function_privilege('anon', p.oid, 'execute')) = array['club_live_count'],
  'and a visitor with no account can only ask how many are live in a room');
select t.as_user(null);
select t.ok(public.club_live_count(:'link1') = '{"on": true, "n": 3, "chat": true}' and public.club_live_count('nothing') = '{"on": true, "n": 0, "chat": true}',
  'which shows 3 in room 1, and that typed chat is on');
reset role;
select t.as_user(:'P'); select t.ok(t.hears(:'topic1'), 'a student in the room can listen to it');
select t.as_user(:'R'); select t.ok(not t.hears(:'topic1'), 'one who is not in it cannot');
select t.as_user(null); select t.ok(not t.hears(:'topic1'), 'nor can a visitor who is not signed in');
select t.as_user(:'P');
select t.fails(format('insert into realtime.messages (topic, extension, event, payload) values (%L, %L, %L, %L)', :'topic1', 'broadcast', 's', '{"k": "hi"}'), 'row-level security');
select t.fails('select * from public.club_live_leases', 'permission denied');
select t.fails('select * from public.club_reports', 'permission denied');
select t.fails('select * from public.club_blocks', 'permission denied');
select t.fails(format('select public.club_live_send(%L::uuid, %L, %L::jsonb)', :'O', 's', '{}'), 'permission denied');
select t.fails(format('select public.club_live_close(%L::uuid, %L)', :'O', 'off'), 'permission denied');
select t.fails('update public.club_live_config set live_on = false', 'permission denied');
select t.fails('select * from public.club_chat_ok', 'permission denied');
select t.fails('select * from public.club_chat_words', 'permission denied');
select t.fails('select public.club_live_check(''hi'')', 'permission denied');

\echo '    moves, reactions and phrases'
select t.as_user(:'P');
select public.club_live_say('walk', null, 200, 10) as v \gset
reset role;
select t.ok((:'v')::jsonb ->> 'ok' = 'true' and t.last_msg(:'topic1') = jsonb_build_array('w', jsonb_build_object('p', :'pid_p', 'x', 95, 'y', 78)),
  'a move goes to the room, kept on the floor');
select t.ok((select x = 95 and y = 78 from public.club_live_leases where user_id = :'P'), 'and the room keeps where they stand');
select t.ok(t.sent() = :b1 + 4, 'a message to a room of 3 counts 4');
select t.as_user(:'P');
select public.club_live_say('walk', null, 50, 90) as v \gset
select t.ok((:'v')::jsonb ->> 'why' = 'wait' and ((:'v')::jsonb ->> 'ms')::int between 1 and 2000, 'one move every 2 seconds');
select public.club_live_say('react', 'clap') as v \gset
reset role;
select t.ok((:'v')::jsonb ->> 'ok' = 'true' and t.last_msg(:'topic1') = jsonb_build_array('r', jsonb_build_object('p', :'pid_p', 'k', 'clap')), 'a reaction goes to the room');
select t.as_user(:'P');
select t.ok(public.club_live_say('say', 'nice') ->> 'why' = 'wait', 'one reaction or phrase every 3 seconds');
reset role;
update public.club_live_leases set say_at = now() - interval '4 seconds', walk_at = now() - interval '4 seconds' where user_id = :'P';
select t.as_user(:'P');
select public.club_live_say('say', 'nice') as v \gset
reset role;
select t.ok(t.last_msg(:'topic1') = jsonb_build_array('s', jsonb_build_object('p', :'pid_p', 'k', 'nice')) and ((:'v')::jsonb ->> 'left')::int = 396,
  'a phrase goes to the room, and the student sees how many actions are left today');
select t.as_user(:'P');
select t.ok(public.club_live_say('say', 'Anything I like') ->> 'why' = 'form', 'only the fixed phrases');
select t.ok(public.club_live_say('react', 'nice') ->> 'why' = 'form', 'and the fixed reactions');
select t.ok(public.club_live_say('shout', 'hi') ->> 'why' = 'form', 'and nothing else');
select t.ok(public.club_live_say('walk') ->> 'why' = 'form', 'a move needs a spot');
select t.as_user(:'R');
select t.ok(public.club_live_say('react', 'clap') ->> 'why' = 'expired', 'a student who is not in a room sends nothing');
reset role;
select t.ok((select array_agg(kind || ':' || value order by id) from public.club_live_log where user_id = :'P' and kind in ('react', 'say')) = array['react:clap', 'say:nice'],
  'reactions and phrases are kept for reports; moves are not');
select t.ok(public.club_live_words() = '{"react": ["clap", "fire", "party", "laugh", "heart", "wow"], "say": ["hi", "nice", "study", "luck", "gotthis", "great", "thanks", "practice", "brb", "bye"]}',
  'six reactions and ten phrases');
update public.club_live_usage set n = 400 where user_id = :'P';
update public.club_live_leases set say_at = null, walk_at = null where user_id = :'P';
select t.as_user(:'P');
select t.ok(public.club_live_say('react', 'wow') ->> 'why' = 'day', 'each student has 400 actions a day');
reset role;
update public.club_live_usage set n = 10 where user_id = :'P';
update public.club_live_leases set say_at = null where user_id = :'P';

\echo '    typed chat'
select extract(year from public.club_day())::int as cy, extract(month from public.club_day())::int as cm,
       extract(year from public.club_day() - interval '13 years 1 month')::int as by, extract(month from public.club_day() - interval '13 years 1 month')::int as bm \gset
select t.as_user(:'P');
select t.ok(public.club_live_ping() ->> 'chat' = 'ask' and public.club_live_chat('Hello') ->> 'why' = 'chat',
  'typing waits until the student has said when they were born');
select t.ok(public.club_live_chat_start(13, 2000) ->> 'why' = 'form' and public.club_live_chat_start(5, :cy + 1) ->> 'why' = 'form'
  and public.club_live_chat_start(null, 2000) ->> 'why' = 'form' and public.club_live_chat_start(5, :cy - 121) ->> 'why' = 'form', 'a month and a year it could be');
select t.ok(public.club_live_chat_start(5, :cy - 16) = '{"ok": true, "chat": "ok"}' and public.club_live_ping() ->> 'chat' = 'ok', 'a student of 13 or older can type');
select t.ok(public.club_live_chat_start(1, :cy - 5) = '{"ok": true, "chat": "ok"}', 'and a second answer changes nothing');
select t.as_user(:'O');
select t.ok(public.club_live_chat_start(:bm, :by) ->> 'chat' = 'ok', 'one who was 13 by last month can type');
select t.as_user(:'Q');
select t.ok(public.club_live_chat_start(:cm, :cy - 13) = '{"ok": true, "chat": "no"}', 'one who may turn 13 later this month cannot');
select t.ok(public.club_live_chat_start(1, :cy - 30) ->> 'chat' = 'no' and public.club_live_ping() ->> 'chat' = 'no'
  and public.club_live_chat('Hello') ->> 'why' = 'chat', 'nor change the answer, or type');
select t.as_user(:'X');
select t.ok(public.club_live_chat_start(5, 2000) ->> 'why' = 'join', 'a student who is not in the clubhouse is not asked');
reset role;
select t.ok((select array_agg(ok order by ok) from public.club_chat_ok) = array[false, true, true]
  and (select array_agg(column_name::text order by column_name) from information_schema.columns where table_schema = 'public' and table_name = 'club_chat_ok') = array['at', 'ok', 'user_id'],
  'only whether they are 13 or older is kept, never the date');
select t.sent() as b2 \gset
select t.as_user(:'P');
select public.club_live_chat(E'  Hello  \n everyone ') as v \gset
reset role;
select t.ok((:'v')::jsonb ->> 'ok' = 'true' and (:'v')::jsonb ->> 't' = 'Hello everyone' and ((:'v')::jsonb ->> 'left')::int = 389
  and t.last_msg(:'topic1') = jsonb_build_array('c', jsonb_build_object('p', :'pid_p', 't', 'Hello everyone')) and t.sent() = :b2 + 4,
  'a typed line goes to the room, tidied, and counts like a phrase');
select t.as_user(:'P');
select t.ok(public.club_live_chat('Again') ->> 'why' = 'wait' and public.club_live_say('react', 'clap') ->> 'why' = 'wait', 'it shares the 3-second wait with reactions and phrases');
reset role;
select t.ok(t.chat(:'P', 'hello EVERYONE') ->> 'why' = 'same', 'the same line twice in a minute is not sent again');
select t.ok(t.chat(:'P', repeat('a', 161)) ->> 'why' = 'long' and t.chat(:'P', E' \n\u200B ') ->> 'why' = 'form', 'a line has 1 to 160 characters');
select t.ok(t.chat(:'P', repeat('é', 160)) ->> 't' = repeat('é', 160) and t.chat(:'P', 'I got 1450, aiming for 1500-1550 in Niger with my therapist') ->> 'ok' = 'true',
  'letters of any kind count as one, and scores, places and words with others inside them are fine');
select t.as_user(:'O');
select t.ok(public.club_live_chat('Welcome to my room!') ->> 'ok' = 'true', 'the room''s owner can type too');
reset role;
select t.sent() as b3 \gset
insert into public.club_chat_words (word) values ('zorp*');
select t.ok(t.chat(:'P', 'Text me at 555 123 4567') ->> 'why' = 'contact', 'a phone number is held back');
select t.ok(t.chat(:'P', 'my email is pine@example.org') ->> 'why' = 'contact', 'and an email or @handle');
select t.ok(t.chat(:'P', 'see www.example.com') ->> 'why' = 'link', 'and a link');
select t.ok(t.chat(:'P', 'Which school do you go to?') ->> 'why' = 'contact', 'and asking where someone is');
select t.ok(t.chat(:'P', 'You zorpy thing') ->> 'why' = 'words', 'and a word on the list');
select t.ok(t.chat(:'P', 'Sorry') ->> 'why' = 'pause', 'after 5 held back in 10 minutes, typing waits');
select t.ok(t.sent() = :b3 and t.last_msg(:'topic1') ->> 0 = 'c' and t.last_msg(:'topic1') -> 1 ->> 't' = 'Welcome to my room!', 'nothing held back reaches the room');
select t.ok((select array_agg(value order by id) from public.club_live_log where user_id = :'P' and kind = 'held') = array['contact', 'contact', 'link', 'contact', 'words'],
  'the log keeps why each line was held back, not the line');
delete from public.club_live_log where kind = 'held';
select t.ok(t.chat(:'P', 'z o r p') ->> 'why' = 'words' and t.chat(:'P', 'zooorrrp') ->> 'why' = 'words' and t.chat(:'P', 'Z0RP!') ->> 'why' = 'words'
  and t.chat(:'P', E'\uFF3A\uFF2F\uFF32\uFF30') ->> 'why' = 'words', 'spaced out, stretched, with numbers or in wide letters too');
delete from public.club_live_log where kind = 'held';
delete from public.club_chat_words where word = 'zorp*';
select t.as_user(:'Q');
select t.ok(public.club_live_chat('Hi') ->> 'why' = 'chat', 'a student who cannot type sends nothing');
reset role;
update public.club_live_config set chat_on = false;
select t.ok(t.chat(:'P', 'Still here') ->> 'why' = 'chat', 'switching typed chat off stops it');
select t.as_user(:'P');
select t.ok(public.club_live_ping() ->> 'chat' = 'off' and public.club_live_say('react', 'wow') ->> 'ok' = 'true', 'pages hear it at their next ping, and reactions still work');
select t.as_user(null);
select t.ok(public.club_live_count(:'link1') ->> 'chat' = 'false', 'and a room''s page can tell before joining');
reset role;
update public.club_live_config set chat_on = true;
update public.club_live_usage set n = 10 where user_id = :'P';
update public.club_live_leases set say_at = null where user_id = :'P';

\echo '    staying, leaving and coming back'
select t.as_user(:'Q');
select public.club_live_ping(false) as v \gset
select t.ok((:'v')::jsonb ->> 'topic' = :'topic1' and jsonb_array_length((:'v')::jsonb -> 'members') = 3 and (:'v')::jsonb -> 'hide' = '[]',
  'a ping keeps the place and shows who is there');
reset role;
update public.club_live_leases set seen_at = now() - interval '80 seconds' where user_id = :'Q';
select t.as_user(:'P');
select t.ok(jsonb_array_length(public.club_live_ping(false) -> 'members') = 2, 'a page that stopped pinging for 75 seconds loses its place');
select t.as_user(:'Q');
select t.ok(public.club_live_ping(false) ->> 'why' = 'expired', 'and hears so when it is back');
select t.ok(not t.hears(:'topic1'), 'it cannot listen any more');
select public.club_live_join(:'link1') as v \gset
select t.ok((:'v')::jsonb ->> 'ok' = 'true' and (:'v')::jsonb ->> 'me' = :'pid_q', 'joining again gives the same id in that room');
reset role;
update public.club_live_leases set acted_at = now() - interval '7 minutes' where user_id = :'Q';
select t.as_user(:'Q');
select t.ok(public.club_live_ping(true) ->> 'why' = 'idle', 'a student who did nothing for 6 minutes loses their place');
select public.club_live_join(:'link1');
reset role;
update public.club_live_leases set acted_at = now() - interval '5 minutes' where user_id = :'Q';
select t.as_user(:'Q');
select public.club_live_ping(true);
reset role;
select t.ok((select acted_at > now() - interval '1 minute' from public.club_live_leases where user_id = :'Q'), 'a ping after they did something keeps it');
select t.as_user(:'Q');
select public.club_live_leave();
reset role;
select t.ok(not exists (select 1 from public.club_live_leases where user_id = :'Q') and t.last_msg(:'topic1') = jsonb_build_array('bye', jsonb_build_object('p', :'pid_q')),
  'leaving tells the room');
select t.ok(t.live_join(:'Q', :'link2') ->> 'ok' = 'true', 'a student can join another room');
select t.live_join(:'Q', :'link1');
select t.ok((select array_agg(room_id) from public.club_live_leases where user_id = :'Q') = array[:'O'::uuid], 'one room at a time');
select (select topic from public.club_live_rooms where room_id = :'S') as topic2 \gset
select t.ok(t.last_msg(:'topic2') is null, 'leaving a room where no one else is sends nothing');

\echo '    room and site limits'
-- room 1 has O, P and Q
select t.ok(bool_and(t.live_join(t.f(i), :'link1') ->> 'ok' = 'true'), 'a room takes 8') from generate_series(1, 5) i;
select t.ok(t.live_join(t.f(6), :'link1') ->> 'why' = 'full', 'and no more');
select t.ok(t.live_join(:'P', :'link1') ->> 'ok' = 'true', 'someone already in it can still come back to it');
select t.ok(bool_and(t.live_join(t.f(i), :'link2') ->> 'ok' = 'true'), 'another room fills') from generate_series(6, 13) i;
select t.as_user(t.f(14)); select public.club_room_save('{}'); select public.club_room_link(true) ->> 'link' as link3 \gset
reset role;
select t.ok(bool_and(t.live_join(t.f(i), :'link3') ->> 'ok' = 'true'), 'and a third, up to 20 across the site') from generate_series(14, 17) i;
select t.ok((select count(*) from public.club_live_leases) = 20 and t.live_join(t.f(18), :'link3') ->> 'why' = 'busy', 'then the site is full');
delete from public.club_live_leases where user_id::text like '00000000-0000-0000-0003-%';
select t.ok(t.live_join(t.f(18), :'link3') ->> 'ok' = 'true', 'until someone leaves');
delete from public.club_live_leases where user_id::text like '00000000-0000-0000-0003-%';

\echo '    the 30-day limit'
-- room 1 has O, P and Q; bring the last 30 days to exactly 1,000,000
delete from public.club_live_budget where day < public.club_day();
update public.club_live_budget set sent = 1000000 where day = public.club_day();
select t.as_user(:'P');
select t.ok(public.club_live_say('walk', null, 50, 90) ->> 'why' = 'rest', 'nothing is sent past 1,000,000 messages in 30 days');
select t.ok(public.club_live_ping() ->> 'why' = 'rest', 'and the student''s place ends');
select t.as_user(:'O');
select t.ok(public.club_live_ping() ->> 'why' = 'rest', 'the others'' places end at their next ping');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'rest', 'and no one can join');
reset role;
update public.club_live_budget set day = public.club_day() - 30;
select t.ok(t.live_join(:'O', :'link1') ->> 'ok' = 'true' and t.live_join(:'P', :'link1') ->> 'ok' = 'true',
  'messages more than 30 days old no longer count');
delete from public.club_live_budget;

\echo '    the owner asks someone to leave'
select t.ok(t.live_join(:'Q', :'link1') ->> 'ok' = 'true', 'room 1 has O, P and Q again');
select t.as_user(:'P');
select t.ok(public.club_live_remove(:'pid_q') ->> 'why' = 'gone', 'only the room''s owner can ask someone to leave');
select t.as_user(:'O');
select public.club_live_remove(:'pid_q') as v \gset
select (:'v')::jsonb ->> 'topic' as topic1b \gset
reset role;
select t.ok(t.last_msg(:'topic1') = jsonb_build_array('moved', jsonb_build_object('p', :'pid_q')), 'the room hears it on its topic');
select t.ok(:'topic1b' <> :'topic1' and (select topic from public.club_live_rooms where room_id = :'O') = :'topic1b'
  and jsonb_array_length((:'v')::jsonb -> 'members') = 2, 'and moves to a new one without them');
select t.as_user(:'Q');
select t.ok(public.club_live_ping() ->> 'why' = 'removed', 'the student hears why their place ended');
select t.ok(not t.hears(:'topic1b'), 'they cannot listen to the new topic');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'removed', 'or come back that day');
select t.as_user(:'P');
select t.ok(t.hears(:'topic1b') and public.club_live_ping() ->> 'topic' = :'topic1b', 'the others can, and their next ping says where');
reset role;
update public.club_live_bans set until = now() - interval '1 second' where user_id = :'Q';
select t.ok(t.live_join(:'Q', :'link1') ->> 'ok' = 'true', 'the next day they can come back');

\echo '    blocking'
select (t.live_join(:'R', :'link1')) ->> 'me' as pid_r \gset
select t.as_user(:'P');
select public.club_live_block(:'pid_r') as v \gset
select t.ok(not ((:'v')::jsonb -> 'members' @> jsonb_build_array(jsonb_build_array(:'pid_r'))) and (:'v')::jsonb -> 'hide' = jsonb_build_array(:'pid_r'),
  'a student who blocks someone no longer sees them in the room');
select t.as_user(:'R');
select public.club_live_ping() as v \gset
select t.ok(not ((:'v')::jsonb -> 'members' @> jsonb_build_array(jsonb_build_array(:'pid_p'))) and (:'v')::jsonb -> 'hide' = jsonb_build_array(:'pid_p'),
  'and the one blocked does not see them either, though both are still in the room');
select t.as_user(:'O');
select t.ok(jsonb_array_length(public.club_live_ping() -> 'members') = 4, 'everyone else still sees both');
select t.as_user(:'P'); select public.club_room_link(true) ->> 'link' as link4 \gset
select t.as_user(:'R');
select t.ok(public.club_live_join(:'link4') ->> 'why' = 'blocked', 'the one blocked cannot come into the room of the one who blocked them');
select t.as_user(:'P');
select t.ok(public.club_live_blocks() = '["Reed"]', 'a student sees whom they blocked');
select t.ok(public.club_live_unblock('reed') = '[]', 'and can unblock them');
select t.as_user(:'R');
select t.ok(public.club_live_join(:'link4') ->> 'ok' = 'true', 'who can then come in');
select t.ok(public.club_live_join(:'link1') ->> 'ok' = 'true', 'R is back in room 1');
select t.as_user(:'O');
select public.club_live_block(:'pid_r') as v \gset
select t.ok(jsonb_array_length((:'v')::jsonb -> 'members') = 3 and (:'v')::jsonb ->> 'topic' <> :'topic1b', 'blocking someone in your own room takes them out of it');
select t.as_user(:'R');
select t.ok(public.club_live_ping() ->> 'why' = 'removed' and public.club_live_join(:'link1') ->> 'why' = 'blocked', 'and they cannot come back');
select t.as_user(:'Q');
select public.club_live_block(:'pid_o') as v \gset
select t.ok((:'v')::jsonb = '{"ok": true, "out": true}' and public.club_live_ping() ->> 'why' = 'expired', 'blocking the room''s owner takes you out of their room');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'blocked', 'and you cannot go back in while the block stands');
select t.ok(public.club_live_block('0000000000') ->> 'why' = 'gone', 'only someone in your room can be blocked');
reset role;
delete from public.club_blocks where user_id = :'Q';

\echo '    reports'
select t.ok(t.live_join(:'Q', :'link1') ->> 'ok' = 'true', 'room 1 has O, P and Q');
select t.as_user(:'O');
select public.club_live_say('say', 'luck');
select t.as_user(:'P');
select t.ok(public.club_live_report(:'pid_o', 'rude') ->> 'why' = 'form', 'a report gives one of the reasons');
select t.ok(public.club_live_report('0000000000', 'spam') ->> 'why' = 'gone', 'about someone in the room');
select t.ok(public.club_live_report(:'pid_o', 'unkind') ->> 'ok' = 'true', 'a student can report someone');
reset role;
select t.ok((select from_nick = 'Pine' and about_nick = 'Oak' and room_nick = 'Oak' and reason = 'unkind' and not done
               and recent -> -1 ->> 1 = 'say' and recent -> -1 ->> 2 = 'luck' and from_id = :'P' and about_id = :'O'
             from public.club_reports order by id desc limit 1), 'it keeps who sent it, about whom, where, why, and what they did last');
select t.ok(t.chat(:'O', 'Shh, no one is looking') ->> 'ok' = 'true', 'Oak types');
select t.ok(t.chat(:'P', 'That feels odd') ->> 'ok' = 'true', 'and Pine');
select t.ok(t.chat(:'O', 'Text me at 555 123 4567') ->> 'why' = 'contact', 'and Oak''s next line is held back');
select t.as_user(:'P');
select t.ok(public.club_live_report(:'pid_o', 'personal') ->> 'ok' = 'true', 'a report can say someone asked for or shared personal details');
reset role;
select t.ok((select reason = 'personal' and room_chat -> -2 = jsonb_build_array(room_chat -> -2 ->> 0, 'Oak', 'Shh, no one is looking')
               and room_chat -> -1 ->> 1 = 'Pine' and room_chat -> -1 ->> 2 = 'That feels odd'
               and recent -> -1 ->> 1 = 'held' and recent -> -1 ->> 2 = 'contact' and recent -> -2 ->> 2 = 'Shh, no one is looking'
             from public.club_reports order by id desc limit 1), 'it keeps every typed line in the room, and what the student had held back');
delete from public.club_reports where reason = 'personal';
insert into public.club_reports (from_id, reason) select :'P', 'spam' from generate_series(1, 9);
select t.as_user(:'P');
select t.ok(public.club_live_report(:'pid_q', 'spam') ->> 'why' = 'day', 'at most 10 reports a day');
reset role;
delete from public.club_reports where from_id = :'P' and about_id is null;
update public.club_live_log set at = now() - interval '8 days' where kind = 'chat' and value = 'Hello everyone';
select public.club_live_sweep();
select t.ok(not exists (select 1 from public.club_live_log where value = 'Hello everyone') and exists (select 1 from public.club_live_log where kind = 'chat'),
  'typed lines are deleted after 7 days');
select t.ok((select schedule = '41 * * * *' and command = 'select public.club_live_sweep()' from cron.job where jobname = 'club-live-sweep'), 'by a tidy that runs every hour');

\echo '    what ends live visits'
select topic as topic1c from public.club_live_rooms where room_id = :'O' \gset
select t.as_user(:'O');
select public.club_room_link(false);
reset role;
select t.ok(not exists (select 1 from public.club_live_leases where room_id = :'O')
  and t.last_msg(:'topic1c') = jsonb_build_array('closed', jsonb_build_object('why', 'closed')), 'stopping sharing ends every live visit, and the room hears it');
select t.ok((select topic from public.club_live_rooms where room_id = :'O') <> :'topic1c', 'its next visitors get a new topic');
select t.as_user(:'P');
select t.ok(public.club_live_ping() ->> 'why' = 'closed', 'a visitor hears why');
select t.ok(public.club_live_join(:'link1') ->> 'why' = 'closed', 'and the old link no longer joins');
select t.as_user(:'O'); select public.club_room_link(true) ->> 'link' as link1 \gset
select t.ok(t.live_join(:'P', :'link1') ->> 'ok' = 'true' and t.live_join(:'S', :'link1') ->> 'ok' = 'true', 'the new link does');
select t.ok(t.live_join(:'Q', :'link2') ->> 'ok' = 'true', 'Q is in S''s room');
update public.club_profiles set blocked = true where user_id = :'S';
select t.ok(not exists (select 1 from public.club_live_leases where user_id in (:'S', :'Q')), 'when the site''s owner blocks a student, they leave live rooms and their own room closes');
select t.as_user(:'S');
select t.ok(public.club_live_ping() ->> 'why' = 'locked' and public.club_live_join(:'link1') ->> 'why' = 'locked', 'they hear why, and cannot join');
select t.as_user(:'Q');
select t.ok(public.club_live_ping() ->> 'why' = 'closed' and public.club_live_join(:'link2') ->> 'why' = 'closed', 'and their room cannot be joined');
reset role;
update public.club_profiles set blocked = false where user_id = :'S';
select t.ok(t.live_join(:'Q', :'link1') ->> 'ok' = 'true' and t.live_join(:'O', :'link1') ->> 'ok' = 'true', 'room 1 has P, Q and O');
update public.club_live_config set live_on = false;
select t.ok(not exists (select 1 from public.club_live_leases), 'switching live rooms off ends every visit');
select t.as_user(:'P');
select t.ok(public.club_live_ping() ->> 'why' = 'off' and public.club_live_join(:'link1') ->> 'why' = 'off', 'everyone hears why, and no one can join');
reset role;
update public.club_live_config set live_on = true;
select t.ok(t.live_join(:'P', :'link1') ->> 'ok' = 'true' and t.live_join(:'Q', :'link1') ->> 'ok' = 'true', 'switched on again, they can');
select t.as_user(:'P');
select public.club_erase();
reset role;
select t.ok(not exists (select 1 from public.club_live_leases where user_id = :'P') and t.last_msg((select topic from public.club_live_rooms where room_id = :'O'))
  = jsonb_build_array('bye', jsonb_build_object('p', :'pid_p')), 'erasing the clubhouse record leaves the room');
select t.as_user(:'Q');
select public.delete_account();
reset role;
select t.ok(not exists (select 1 from public.club_live_leases where user_id = :'Q') and not exists (select 1 from auth.users where id = :'Q'),
  'deleting an account while live works, and leaves the room');
select t.as_user(:'O');
select public.delete_account();
reset role;
select t.ok(not exists (select 1 from public.club_live_rooms where room_id = :'O'), 'and deleting a room''s owner deletes the room');
\echo '    all live room checks passed'
