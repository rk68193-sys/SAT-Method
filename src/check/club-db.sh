#!/bin/sh
# Tests src/account/club.sql, club-live.sql and club-crew.sql on a plain PostgreSQL (14 or later), with club-shim.sql standing
# in for Supabase:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=... sh src/check/club-db.sh
# It makes a database named club_check (dropped first if it is there), loads setup.sql, then club.sql, club-live.sql and
# club-crew.sql twice each (each must be safe to run again), copies the prize list from catalog.json, runs club-db.sql,
# club-live-db.sql and club-crew-db.sql, has two crew members finish a set at the same moment (over two connections), and
# checks that running club-crew.sql again changes no crew, and that running club.sql again changes no one's coins, prizes or
# room, and leaves live rooms and crews working.
set -eu
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
db=${CLUB_DB:-club_check}
psql -X -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $db" -c "create database $db"
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
club() { run -o /dev/null -f "$root/src/account/club.sql"; }
live() { run -o /dev/null -f "$root/src/account/club-live.sql"; }
crew() { run -o /dev/null -f "$root/src/account/club-crew.sql"; }
run -f "$here/club-shim.sql"
run -f "$root/src/account/setup.sql" 2>/dev/null
club
club
live
live
crew
crew
catalog=$(cat "$root/catalog.json")
run -o /dev/null -v catalog="$catalog" <<'SQL'
insert into net._http_response (id, status_code, content) select asked, 200, :'catalog' from public.club_rules;
select public.club_catalog_sync();
SQL
run -v catalog="$catalog" -f "$here/club-db.sql"
run -f "$here/club-live-db.sql"
run -f "$here/club-crew-db.sql"

# Race Crew (club-crew-db.sql) is one session from its aquarium corner. Crewmate 1 finishes a set and holds the crew for two
# seconds before it is saved; Crewmate 2 finishes one meanwhile. The second must wait for the first, so both count and the
# corner is built once.
m1=00000000-0000-0000-0005-000000000001
m2=00000000-0000-0000-0005-000000000002
first=$(mktemp)
run -t -A > "$first" <<SQL &
begin;
select t.as_user('$m1');
select public.club_crew_add(t.set(9000, 5));
select pg_sleep(2);
commit;
SQL
held=$!
i=0
until [ "$(run -t -A -c "select count(*) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid()
  and state = 'active' and query like 'select pg_sleep(2)%'")" = "1" ]; do
  i=$((i + 1))
  if [ $i -gt 150 ]; then echo "FAILED: the first set was not added"; exit 1; fi
  sleep 0.1
done
second=$(run -t -A -c "select t.as_user('$m2')" -c "select public.club_crew_add(t.set(9000, 5))" | grep '^{')
wait $held
one=$(grep '^{' "$first")
rm -f "$first"
run -o /dev/null -v one="$one" -v two="$second" <<'SQL'
select t.ok(:'one'::jsonb = '{"ok": true, "name": "Race Crew", "step": 2, "n": 0, "goal": 40, "built": 2, "today": 1}', 'the first set builds the aquarium corner');
select t.ok(:'two'::jsonb = '{"ok": true, "name": "Race Crew", "step": 2, "n": 1, "goal": 40, "built": null, "today": 1}', 'the second, finished at the same moment, waits and counts after it');
select t.ok((select row(c.step, c.n, c.total)::text from public.club_crews c where c.name = 'Race Crew') = '(2,1,51)'
  and (select array_agg(b.step order by b.step) from public.club_crew_built b join public.club_crews c on c.id = b.crew_id where c.name = 'Race Crew') = '{1,2}',
  'both sessions are saved, and the corner is built once');
SQL
echo "    crews: two members finishing at the same moment build it once"
crews="select md5(string_agg(t, '|' order by t)) from (
  select 'c' || row(id, name, owner, link, step, n, total, made_by, made_at)::text t from public.club_crews
  union all select 'm' || row(user_id, crew_id, joined_at, seen)::text from public.club_crew_members
  union all select 'b' || row(crew_id, step, sessions, at)::text from public.club_crew_built
  union all select 'a' || row(id, crew_id, user_id, step, day, at)::text from public.club_crew_adds
  union all select 'q' || row(user_id, qid)::text from public.club_crew_qs
  union all select 'x' || row(crew_id, user_id)::text from public.club_crew_bans
  union all select 'g' || row(crews_on, goals, day_cap, min_qs, max_members)::text from public.club_crew_config) x"
before=$(run -t -A -c "$crews")
crew
after=$(run -t -A -c "$crews")
if [ "$before" != "$after" ]; then echo "FAILED: running club-crew.sql again changed a crew"; exit 1; fi
echo "    running club-crew.sql again changes no crew"
sum="select md5(string_agg(t, '|' order by t)) from (
  select 'p' || row(user_id, nickname, carried, test_day, test_at, gifted_at, blocked, owner)::text t from public.club_profiles
  union all select 'l' || row(user_id, key, amount)::text from public.club_ledger
  union all select 'd' || row(user_id, day, frozen)::text from public.club_days
  union all select 'g' || row(user_id, key, series, min_tier, used)::text from public.club_grants
  union all select 'c' || row(user_id, id, series, item, tier, dupe, sticker, how, at)::text from public.club_crates
  union all select 's' || row(user_id, sticker)::text from public.club_stickers
  union all select 'r' || row(user_id, layout, link)::text from public.club_rooms
  union all select 'b' || row(room_id, from_id, sticker, day)::text from public.club_board
  union all select 'k' || row(id, tier, series, active)::text from public.club_catalog) x"
before=$(run -t -A -c "$sum")
club
after=$(run -t -A -c "$sum")
if [ "$before" != "$after" ]; then echo "FAILED: running club.sql again changed what students have"; exit 1; fi
echo "    running club.sql again changes nothing"
calls=$(run -t -A -c "select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname like 'club\_live\_%'
  and has_function_privilege('authenticated', oid, 'execute')")
if [ "$calls" != "13" ]; then echo "FAILED: after club.sql ran again, students can call $calls of the 13 live room functions"; exit 1; fi
live
echo "    and leaves live rooms working"
calls=$(run -t -A -c "select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname like 'club\_crew\_%'
  and has_function_privilege('authenticated', oid, 'execute')")
if [ "$calls" != "11" ]; then echo "FAILED: after club.sql ran again, students can call $calls of the 11 crew functions"; exit 1; fi
crew
echo "    and crews working"
psql -X -q -d postgres -c "drop database $db"
