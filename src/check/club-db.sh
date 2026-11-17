#!/bin/sh
# Tests src/account/club.sql and club-live.sql on a plain PostgreSQL (14 or later), with club-shim.sql standing in for Supabase:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=... sh src/check/club-db.sh
# It makes a database named club_check (dropped first if it is there), loads setup.sql, then club.sql and club-live.sql twice
# each (both must be safe to run again), copies the prize list from catalog.json, runs club-db.sql and club-live-db.sql, and
# checks that running club.sql once more changes no one's coins, prizes or room, and leaves live rooms working.
set -eu
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
db=${CLUB_DB:-club_check}
psql -X -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $db" -c "create database $db"
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
club() { run -o /dev/null -f "$root/src/account/club.sql"; }
live() { run -o /dev/null -f "$root/src/account/club-live.sql"; }
run -f "$here/club-shim.sql"
run -f "$root/src/account/setup.sql" 2>/dev/null
club
club
live
live
catalog=$(cat "$root/catalog.json")
run -o /dev/null -v catalog="$catalog" <<'SQL'
insert into net._http_response (id, status_code, content) select asked, 200, :'catalog' from public.club_rules;
select public.club_catalog_sync();
SQL
run -v catalog="$catalog" -f "$here/club-db.sql"
run -f "$here/club-live-db.sql"
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
if [ "$calls" != "11" ]; then echo "FAILED: after club.sql ran again, students can call $calls of the 11 live room functions"; exit 1; fi
live
echo "    and leaves live rooms working"
psql -X -q -d postgres -c "drop database $db"
