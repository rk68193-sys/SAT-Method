-- Tests for src/account/club-crew.sql (crews), run by src/check/club-db.sh after club-live-db.sql in the same database: it
-- uses club-db.sql's helpers (schema t). Each check that fails stops the run with "FAILED: <what>". It ends by setting up
-- a crew one session from its aquarium corner, for club-db.sh to check two members finishing a set at the same moment.
\set ON_ERROR_STOP 1
\o /dev/null

-- a finished set of n questions, numbered from i
create function t.set(i int, n int) returns jsonb language sql as $$
  select jsonb_build_object('s', 'm', 'q', (select jsonb_agg('m:q' || k) from generate_series(i, i + n - 1) k))
$$;
-- a crew call as a student, and back as the database's owner
create function t.crew(u uuid, call text) returns jsonb language plpgsql as $$
declare v jsonb;
begin
  perform t.as_user(u);
  execute 'select ' || call into v;
  execute 'reset role';
  return v;
end $$;
create function t.add(u uuid, i int, n int) returns jsonb language sql as $$ select t.crew(u, format('public.club_crew_add(%L)', t.set(i, n))) $$;
-- six students for a full crew
create function t.cm(i int) returns uuid language sql as $$ select ('00000000-0000-0000-0005-' || lpad(i::text, 12, '0'))::uuid $$;
grant execute on all functions in schema t to anon, authenticated;

\set K1 '00000000-0000-0000-0004-000000000001'
\set K2 '00000000-0000-0000-0004-000000000002'
\set K3 '00000000-0000-0000-0004-000000000003'
\set K4 '00000000-0000-0000-0004-000000000004'
\set K5 '00000000-0000-0000-0004-000000000005'
\set K6 '00000000-0000-0000-0004-000000000006'
\set K7 '00000000-0000-0000-0004-000000000007'
\set KX '00000000-0000-0000-0004-000000000008'
\set KN '00000000-0000-0000-0004-000000000009'
insert into auth.users (id) values (:'K1'), (:'K2'), (:'K3'), (:'K4'), (:'K5'), (:'K6'), (:'K7'), (:'KX'), (:'KN');
insert into auth.users (id) select t.cm(i) from generate_series(1, 6) i;
insert into public.club_profiles (user_id, nickname) select t.cm(i), 'Crewmate ' || i from generate_series(1, 6) i;
select t.as_user(:'K1'); select public.club_join('{}'); select public.club_nick('Kite'); select public.club_room_save('{"av": ["teal", "cap"]}');
select t.as_user(:'K2'); select public.club_join('{}'); select public.club_nick('Lark');
select t.as_user(:'K3'); select public.club_join('{}'); select public.club_nick('Moss');
select t.as_user(:'K4'); select public.club_join('{}'); select public.club_nick('Nova');
select t.as_user(:'K5'); select public.club_join('{}'); select public.club_nick('Opal');
select t.as_user(:'K6'); select public.club_join('{}'); select public.club_nick('Plum');
select t.as_user(:'K7'); select public.club_join('{}'); select public.club_nick('Rush');
select t.as_user(:'KN'); select public.club_join('{}');
reset role;
select layout -> 'av' as av1 from public.club_rooms where user_id = :'K1' \gset
select to_char(public.club_day(), 'YYYY-MM-DD') as d0 \gset

\echo '    crews: making one'
select t.as_user(null);
select t.fails('select public.club_crew_state()', 'permission denied');
select t.fails('select public.club_crew_make(''Night Owls'')', 'permission denied');
select t.as_user(:'KX');
select t.ok(public.club_crew_make('Night Owls') ->> 'why' = 'join', 'a student who is not in the clubhouse cannot make a crew');
select t.as_user(:'KN');
select t.ok(public.club_crew_make('Night Owls') ->> 'why' = 'nick', 'nor one without a nickname');
select t.as_user(:'K1');
select public.club_crew_state() as v \gset
select t.ok(:'v'::jsonb = '{"ok": true, "on": true, "goals": [20, 30, 40], "cap": 2, "min": 5, "max": 8, "today": 0, "crew": null}',
  'a student with no crew sees the settings and no crew');
select t.ok(public.club_crew_make('ab') ->> 'why' = 'name', 'a crew name has 3 letters or more');
select t.ok(public.club_crew_make(repeat('a', 25)) ->> 'why' = 'name', 'and 24 at most');
select t.ok(public.club_crew_make('-Owls') ->> 'why' = 'name' and public.club_crew_make('Owls!') ->> 'why' = 'name', 'letters, numbers and a few marks');
select t.ok(public.club_crew_make('Room 5551234') ->> 'why' = 'name', 'not a phone number');
select t.ok(public.club_crew_make('owls.com') ->> 'why' = 'name', 'nor a link');
select t.ok(public.club_crew_make('Snap Owls') ->> 'why' = 'name', 'nor a social app');
reset role;
insert into public.club_words (word) values ('blarg');
select t.as_user(:'K1');
select t.ok(public.club_crew_make('The Blargers') ->> 'why' = 'name', 'nor a word a nickname cannot have');
reset role;
delete from public.club_words where word = 'blarg';
select t.as_user(:'K1');
select t.ok(not exists (select 1 from public.club_crew_state() x where x -> 'crew' <> 'null'), 'a name that cannot be used makes no crew');
select public.club_crew_make('  Night   Owls ') -> 'crew' as v \gset
select t.ok((:'v'::jsonb - 'link' - 'members') = '{"name": "Night Owls", "mine": true, "step": 0, "n": 0, "total": 0, "seen": 0, "helpers": [], "built": []}',
  'a crew is made, its name tidied, with nothing built yet');
select t.ok(:'v'::jsonb ->> 'link' ~ '^[0-9a-f]{32}$', 'its owner sees its invite link');
select t.ok(:'v'::jsonb -> 'members' = jsonb_build_array(jsonb_build_array('Kite', :'av1'::jsonb, 1, 1)), 'and its one member, with their character');
select :'v'::jsonb ->> 'link' as link1 \gset
select t.ok(public.club_crew_make('Day Owls') ->> 'why' = 'crew', 'a student is in one crew at a time');

\echo '    crews: invite links and joining'
select t.as_user(:'K2');
select t.ok(public.club_crew_peek(:'link1') = '{"ok": true, "name": "Night Owls", "members": ["Kite"], "full": false, "mine": false, "other": false, "removed": false, "blocked": false}',
  'an invite link shows the crew before joining');
select t.ok(public.club_crew_peek('0123456789abcdef0123456789abcdef') ->> 'why' = 'closed', 'a link no crew has is closed');
select t.ok(public.club_crew_peek('anything') ->> 'why' = 'closed' and public.club_crew_peek(null) ->> 'why' = 'closed', 'and so is anything else');
select t.ok(public.club_crew_join('anything') ->> 'why' = 'closed', 'and cannot be joined');
select t.as_user(:'KX');
select t.ok(public.club_crew_join(:'link1') ->> 'why' = 'join', 'a student who is not in the clubhouse cannot join');
select t.as_user(:'KN');
select t.ok(public.club_crew_join(:'link1') ->> 'why' = 'nick', 'nor one without a nickname');
select t.as_user(:'K2');
select public.club_crew_join(:'link1') -> 'crew' as v \gset
select t.ok(:'v'::jsonb ->> 'name' = 'Night Owls' and :'v'::jsonb -> 'mine' = 'false' and :'v'::jsonb -> 'link' = 'null',
  'a student joins with the link, and only the owner sees it');
select t.ok(:'v'::jsonb -> 'members' = jsonb_build_array(jsonb_build_array('Kite', :'av1'::jsonb, 1, 0), '["Lark", [], 0, 1]'::jsonb),
  'members are listed in the order they joined, with the owner marked');
select t.ok(public.club_crew_join(:'link1') -> 'crew' ->> 'name' = 'Night Owls', 'joining again changes nothing');
select t.ok(public.club_crew_peek(:'link1') ->> 'mine' = 'true', 'and the link says they are in it');
select t.as_user(:'K3');
select public.club_crew_make('Moss Crew') -> 'crew' ->> 'link' as link3 \gset
select t.ok(public.club_crew_peek(:'link1') ->> 'other' = 'true', 'a student in another crew is told so');
select t.ok(public.club_crew_join(:'link1') ->> 'why' = 'crew', 'and cannot join a second one');
reset role;
select t.crew(t.cm(i), format('public.club_crew_join(%L)', :'link1')) from generate_series(1, 6) i;
select t.ok((select count(*) from public.club_crew_members m join public.club_crews c on c.id = m.crew_id where c.link = :'link1') = 8, 'six more join');
select t.as_user(:'K4');
select t.ok(public.club_crew_peek(:'link1') ->> 'full' = 'true', 'a crew of 8 is full');
select t.ok(public.club_crew_join(:'link1') ->> 'why' = 'full', 'and no one else can join');
reset role;
select t.crew(t.cm(i), 'public.club_crew_leave()') from generate_series(1, 6) i;
select t.ok((select count(*) from public.club_crew_members m join public.club_crews c on c.id = m.crew_id where c.link = :'link1') = 2, 'and leave again');
select t.ok(t.crew(t.cm(1), 'public.club_crew_state()') -> 'crew' = 'null', 'which takes them out of the crew');

\echo '    crews: study sessions'
select t.as_user(:'K3');
select t.ok(public.club_crew_add(t.set(1, 10)) = '{"ok": false, "why": "solo", "name": "Moss Crew"}', 'a crew of one cannot build yet');
select t.as_user(:'K4');
select t.ok(public.club_crew_add(t.set(1, 10)) = '{"ok": false, "why": "crew"}', 'a student with no crew adds nothing');
select t.as_user(:'K1');
select t.ok(public.club_crew_add(t.set(1, 4)) = '{"ok": false, "why": "few", "min": 5, "fresh": 4, "name": "Night Owls"}', 'a set needs 5 questions or more');
select t.ok(public.club_crew_add('{"q": "m:q1"}') ->> 'fresh' = '0' and public.club_crew_add('null') ->> 'fresh' = '0', 'anything else is no set');
select t.ok(public.club_crew_add(jsonb_build_array('m:q1', 'm:q1', 'm:q1', 'm:q1', 'm:q1', 'm q2', repeat('x', 41), null)) ->> 'fresh' = '0'
  and public.club_crew_add(jsonb_build_object('q', jsonb_build_array('m:q1', 'm:q1', 'm:q1', 'm:q1', 'm:q1', 'm q2', repeat('x', 41), null))) ->> 'fresh' = '1',
  'a question counts once, and only a question''s id counts');
select t.ok(public.club_crew_add(t.set(1, 5)) = '{"ok": true, "name": "Night Owls", "step": 0, "n": 1, "goal": 20, "built": null, "today": 1}', 'a set of 5 new questions adds a study session');
select t.ok(public.club_crew_add(t.set(1, 5)) = '{"ok": false, "why": "few", "min": 5, "fresh": 0, "name": "Night Owls"}', 'sending it again adds nothing');
select t.ok(public.club_crew_add(t.set(3, 6)) = '{"ok": false, "why": "few", "min": 5, "fresh": 3, "name": "Night Owls"}', 'a question counts once for each student');
select t.ok(public.club_crew_add(t.set(6, 5)) ->> 'n' = '2', 'a second set adds another');
select t.ok(public.club_crew_add(t.set(11, 5)) = '{"ok": false, "why": "day", "cap": 2, "today": 2, "name": "Night Owls"}', 'and 2 a day is the most');
select t.ok(public.club_crew_state() ->> 'today' = '2', 'the crew page counts them');
select t.as_user(:'K2');
select t.ok(public.club_crew_add(t.set(1, 5)) ->> 'n' = '3', 'another member''s questions count for them');
select t.ok(public.club_crew_state() -> 'crew' -> 'helpers' = '["Kite", "Lark"]', 'the crew page shows who helped, in order');
reset role;
select t.ok((select count(*) from public.club_crew_qs where user_id = :'K1') = 10 and (select count(*) from public.club_crew_qs where user_id = :'K2') = 5,
  'the questions that counted are kept');

\echo '    crews: upgrades'
update public.club_crew_config set day_cap = 100;
select t.add(:'K1', 100 + 5 * i, 5) from generate_series(1, 16) i;
select t.ok(t.add(:'K2', 100, 5) = '{"ok": true, "name": "Night Owls", "step": 1, "n": 0, "goal": 30, "built": 1, "today": 2}', 'the 20th session builds the study corner');
select t.ok((select array_agg(row(b.step, b.sessions)::text) from public.club_crew_built b join public.club_crews c on c.id = b.crew_id where c.link = :'link1') = '{"(1,20)"}',
  'once');
select t.as_user(:'K1');
select public.club_crew_state() -> 'crew' as v \gset
select t.ok(array[:'v'::jsonb ->> 'step', :'v'::jsonb ->> 'n', :'v'::jsonb ->> 'total', :'v'::jsonb ->> 'seen'] = '{1, 0, 20, 0}', 'the crew page shows it, not yet revealed');
select t.ok(:'v'::jsonb -> 'built' = jsonb_build_array(jsonb_build_array(1, :'d0', 20, '["Kite", "Lark"]'::jsonb)),
  'with the day, the sessions and who helped');
select t.ok(:'v'::jsonb -> 'helpers' = '[]', 'and no one has helped toward the next one yet');
select t.ok(public.club_crew_seen(1) = '{"ok": true}', 'a member sees the reveal');
select t.ok(public.club_crew_state() -> 'crew' ->> 'seen' = '1', 'which the crew page keeps');
select public.club_crew_seen(3); select public.club_crew_seen(0); select public.club_crew_seen(null);
select t.ok(public.club_crew_state() -> 'crew' ->> 'seen' = '1', 'only of what is built, and once');
select t.as_user(:'K2');
select t.ok(public.club_crew_state() -> 'crew' ->> 'seen' = '0', 'each member sees it for themselves');
select t.as_user(:'K4');
select t.ok(public.club_crew_join(:'link1') -> 'crew' ->> 'seen' = '1', 'a student who joins later is not shown what was built before');
reset role;
select t.add(:'K1', 300 + 5 * i, 5) from generate_series(1, 5) i;
update public.club_crew_config set goals = '{20, 3, 40}';
select t.ok(t.add(:'K4', 300, 5) = '{"ok": true, "name": "Night Owls", "step": 2, "n": 3, "goal": 40, "built": 2, "today": 1}', 'sessions past a goal count toward the next upgrade');
update public.club_crew_config set goals = '{20, 30, 40}';
select t.add(:'K1', 1000 + 5 * i, 5) from generate_series(1, 36) i;
select t.ok(t.add(:'K2', 1000, 5) = '{"ok": true, "name": "Night Owls", "step": 3, "n": 0, "goal": null, "built": 3, "today": 3}', '40 more turn the room Deep Sea');
select t.ok(t.add(:'K2', 1005, 5) = '{"ok": true, "name": "Night Owls", "step": 3, "n": 1, "goal": null, "built": null, "today": 4}', 'and sessions after that still count');
select t.as_user(:'K1');
select public.club_crew_state() -> 'crew' as v \gset
select t.ok((select jsonb_agg(jsonb_build_array(b -> 0, b -> 2, b -> 3) order by b -> 0) from jsonb_array_elements(:'v'::jsonb -> 'built') b)
  = '[[1, 20, ["Kite", "Lark"]], [2, 3, ["Kite", "Nova"]], [3, 40, ["Kite", "Lark"]]]', 'the crew page lists each upgrade and who helped build it');
select t.ok(:'v'::jsonb ->> 'total' = '64' and :'v'::jsonb -> 'helpers' = '["Lark"]', 'with every session counted');
reset role;
select t.ok((select count(*) from public.club_crew_adds a join public.club_crews c on c.id = a.crew_id where c.link = :'link1') = 64, 'one row for each session');
update public.club_crew_config set day_cap = 2;

\echo '    crews: the owner'
select t.as_user(:'K2');
select t.ok(public.club_crew_link(false) ->> 'why' = 'owner' and public.club_crew_rename('Owl Squad') ->> 'why' = 'owner'
  and public.club_crew_hand('Nova') ->> 'why' = 'owner' and public.club_crew_remove('Nova') ->> 'why' = 'owner', 'only the owner can change the crew');
select t.as_user(:'K5');
select t.ok(public.club_crew_link(false) ->> 'why' = 'crew' and public.club_crew_rename('Owl Squad') ->> 'why' = 'crew'
  and public.club_crew_hand('Nova') ->> 'why' = 'crew' and public.club_crew_remove('Nova') ->> 'why' = 'crew'
  and public.club_crew_leave() -> 'crew' = 'null', 'a student with no crew has none to change or leave');
select t.as_user(:'K1');
select t.ok(public.club_crew_rename('Owl Squad') -> 'crew' ->> 'name' = 'Owl Squad', 'the owner renames the crew');
select t.ok(public.club_crew_rename('x') ->> 'why' = 'name', 'to a name a crew can have');
select t.ok(public.club_crew_link(false) -> 'crew' -> 'link' = 'null', 'switches the link off');
select t.as_user(:'K5');
select t.ok(public.club_crew_peek(:'link1') ->> 'why' = 'closed' and public.club_crew_join(:'link1') ->> 'why' = 'closed', 'and it stops working');
select t.as_user(:'K1');
select public.club_crew_link(true) -> 'crew' ->> 'link' as link2 \gset
select t.ok(:'link2' ~ '^[0-9a-f]{32}$' and :'link2' <> :'link1', 'makes a new one');
select t.as_user(:'K5');
select t.ok(public.club_crew_peek(:'link1') ->> 'why' = 'closed' and public.club_crew_peek(:'link2') ->> 'name' = 'Owl Squad', 'and the old one stays closed');
reset role;
insert into public.club_blocks (user_id, blocked_id) values (:'K5', :'K2');
select t.as_user(:'K5');
select t.ok(public.club_crew_peek(:'link2') ->> 'blocked' = 'true' and public.club_crew_join(:'link2') ->> 'why' = 'blocked',
  'a student cannot join a crew with someone they blocked');
reset role;
delete from public.club_blocks where user_id = :'K5';
insert into public.club_blocks (user_id, blocked_id) values (:'K2', :'K5');
select t.as_user(:'K5');
select t.ok(public.club_crew_join(:'link2') ->> 'why' = 'blocked', 'or who blocked them');
reset role;
delete from public.club_blocks where user_id = :'K2';
select t.as_user(:'K1');
select t.ok(public.club_crew_hand('Nobody') ->> 'why' = 'gone' and public.club_crew_hand('Kite') ->> 'why' = 'gone' and public.club_crew_hand('Moss') ->> 'why' = 'gone',
  'the owner hands the crew only to another member');
select public.club_crew_hand('nova') -> 'crew' as v \gset
select t.ok(:'v'::jsonb -> 'mine' = 'false' and :'v'::jsonb -> 'link' = 'null', 'and hands it over');
select t.as_user(:'K4');
select t.ok(public.club_crew_state() -> 'crew' ->> 'link' = :'link2', 'the new owner has the link');
select public.club_crew_remove('LARK') -> 'crew' -> 'members' as v \gset
select t.ok((select jsonb_agg(m -> 0) from jsonb_array_elements(:'v'::jsonb) m) = '["Kite", "Nova"]', 'and removes a member');
select t.as_user(:'K2');
select t.ok(public.club_crew_state() -> 'crew' = 'null', 'who is out of the crew');
select t.ok(public.club_crew_peek(:'link2') ->> 'removed' = 'true' and public.club_crew_join(:'link2') ->> 'why' = 'removed', 'and cannot join it again');
select t.as_user(:'K4');
select t.ok(public.club_crew_state() -> 'crew' -> 'built' -> 0 -> 3 = '["Kite", "Lark"]', 'what they helped build still shows their name');

\echo '    crews: leaving'
select t.ok(public.club_crew_leave() -> 'crew' = 'null', 'the owner leaves');
select t.ok(public.club_crew_state() -> 'crew' = 'null', 'and is out of the crew');
select t.as_user(:'K1');
select t.ok(public.club_crew_state() -> 'crew' ->> 'mine' = 'true', 'and the member who joined first owns the crew');
select t.as_user(:'K4');
select t.ok(public.club_crew_join(:'link2') -> 'crew' ->> 'seen' = '3', 'a member who left can join again');
select t.as_user(:'K1');
select public.club_crew_leave();
select t.as_user(:'K4');
select t.ok(public.club_crew_state() -> 'crew' ->> 'mine' = 'true', 'the last one owns it');
select public.club_crew_leave();
reset role;
select t.ok(not exists (select 1 from public.club_crews where name = 'Owl Squad'), 'and when they leave, the crew is deleted');
select t.ok(not exists (select 1 from public.club_crew_adds where crew_id not in (select id from public.club_crews))
  and not exists (select 1 from public.club_crew_built where crew_id not in (select id from public.club_crews))
  and not exists (select 1 from public.club_crew_bans where crew_id not in (select id from public.club_crews)), 'with everything it had');
select t.ok((select count(*) from public.club_crew_qs where user_id = :'K1') = 10 + 80 + 25 + 180, 'questions counted for it stay counted');

\echo '    crews: switched off'
reset role;
update public.club_crew_config set crews_on = false;
select t.as_user(:'K3');
select t.ok(public.club_crew_state() ->> 'on' = 'false' and public.club_crew_state() -> 'crew' ->> 'name' = 'Moss Crew', 'switched off, a crew is still shown');
select t.ok(public.club_crew_add(t.set(1, 5)) ->> 'why' = 'off', 'but no sessions are added');
select t.as_user(:'K5');
select t.ok(public.club_crew_make('New Crew') ->> 'why' = 'off' and public.club_crew_join(:'link3') ->> 'why' = 'off', 'and no crew is made or joined');
reset role;
update public.club_crew_config set crews_on = true;

\echo '    crews: blocked, erased and deleted accounts'
select t.crew(:'K5', format('public.club_crew_join(%L)', :'link3'));
update public.club_profiles set blocked = true where user_id = :'K5';
select t.ok(not exists (select 1 from public.club_crew_members where user_id = :'K5'), 'a student the site''s owner blocks leaves their crew');
select t.as_user(:'K5');
select t.ok(public.club_crew_join(:'link3') ->> 'why' = 'locked' and public.club_crew_make('Opal Crew') ->> 'why' = 'locked'
  and public.club_crew_add(t.set(1, 5)) ->> 'why' = 'locked', 'and cannot join, make or add to one');
reset role;
update public.club_profiles set blocked = false where user_id = :'K5';
select t.as_user(:'K5');
select t.ok(public.club_crew_join(:'link3') -> 'crew' ->> 'name' = 'Moss Crew', 'unblocked, they can join again');
select t.ok(public.club_crew_add(t.set(1, 5)) ->> 'n' = '1', 'and add a session');
select public.club_erase();
reset role;
select t.ok(not exists (select 1 from public.club_crew_members where user_id = :'K5') and not exists (select 1 from public.club_crew_qs where user_id = :'K5')
  and not exists (select 1 from public.club_crew_adds where user_id = :'K5'), 'erasing a clubhouse record leaves the crew and forgets the questions');
select t.ok((select total from public.club_crews where link = :'link3') = 1, 'the session still counts');
select t.as_user(:'K3');
select t.ok(public.club_crew_state() -> 'crew' -> 'helpers' = '[]', 'with no name');
select public.club_erase();
reset role;
select t.ok(not exists (select 1 from public.club_crews where link = :'link3'), 'when the last member erases theirs, the crew goes');
select t.crew(:'K6', 'public.club_crew_make(''Plum Crew'')') -> 'crew' ->> 'link' as link6 \gset
select t.crew(:'K7', format('public.club_crew_join(%L)', :'link6'));
select t.ok(t.add(:'K7', 1, 5) ->> 'ok' = 'true', 'Rush adds a session to Plum Crew');
delete from auth.users where id = :'K6';
select t.ok((select owner from public.club_crews where link = :'link6') = :'K7'::uuid, 'when an owner''s account is deleted, the next member owns the crew');
delete from auth.users where id = :'K7';
select t.ok(not exists (select 1 from public.club_crews where link = :'link6') and not exists (select 1 from public.club_crew_qs where user_id = :'K7'),
  'and when the last one''s is, the crew goes');

\echo '    crews: what a page may call'
select t.as_user(:'K1');
select t.fails('select * from public.' || x, 'permission denied')
from unnest(array['club_crew_config', 'club_crews', 'club_crew_members', 'club_crew_built', 'club_crew_adds', 'club_crew_qs', 'club_crew_bans']) x;
select t.fails(x, 'permission denied') from unnest(array[
  format('select public.club_crew_view(%L)', :'K1'), format('select public.club_crew_may(%L)', :'K1'), format('select public.club_crew_drop(%L)', :'K1'),
  'select public.club_crew_goal(0)', 'select public.club_crew_name(''Owls'')', 'select public.club_crew_new_link()',
  'select public.club_crew_helpers(gen_random_uuid(), 0)']) x;
select t.fails('update public.club_crew_config set day_cap = 100', 'permission denied');
reset role;
select t.ok((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname like 'club\_crew\_%'
  and has_function_privilege('authenticated', oid, 'execute')) = 11, 'a signed-in student can call the 11 crew functions');
select t.ok(not exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and proname like 'club\_crew\_%'
  and has_function_privilege('anon', oid, 'execute')), 'and a visitor none');

-- for club-db.sh: Crewmate 1 and 2 in a crew one session from its aquarium corner
select t.crew(t.cm(1), 'public.club_crew_make(''Race Crew'')') -> 'crew' ->> 'link' as link9 \gset
select t.crew(t.cm(2), format('public.club_crew_join(%L)', :'link9'));
update public.club_crews set step = 1, n = 29, total = 49 where link = :'link9';
insert into public.club_crew_built (crew_id, step, sessions) select id, 1, 20 from public.club_crews where link = :'link9';
