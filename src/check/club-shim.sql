-- The parts of Supabase that src/account/club.sql uses, for testing it on a plain PostgreSQL (src/check/club-db.sh):
-- the anon and authenticated roles with Supabase's default grants, auth.users and auth.uid(), pg_net's request function and
-- answers table, and pg_cron's schedule. Requests are not sent: a test writes the answer into net._http_response itself.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
end $$;
grant usage on schema public to anon, authenticated;
-- Supabase grants everything made in public to both roles; club.sql has to take that away again
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create schema if not exists extensions;
create schema if not exists net;
create table if not exists net._http_response (
  id bigint primary key, status_code int, content_type text, headers jsonb, content text, timed_out boolean, error_msg text,
  created timestamptz not null default now()
);
create sequence if not exists net.http_request_queue_id_seq;
create or replace function net.http_get(url text, params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 2000)
returns bigint language sql as $$ select nextval('net.http_request_queue_id_seq') $$;

create schema if not exists cron;
create table if not exists cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text);
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid
$$;

-- Realtime (club-live.sql): the messages table that realtime.send writes to (Realtime sends each new row to the pages
-- listening on its topic), and realtime.topic(), the topic a page asks to listen to while Realtime checks the policy
create schema if not exists realtime;
create table if not exists realtime.messages (
  id bigserial primary key, topic text not null, extension text not null, payload jsonb, event text,
  private boolean default false, inserted_at timestamptz not null default now()
);
alter table realtime.messages enable row level security;
create or replace function realtime.topic() returns text language sql stable as $$
  select nullif(current_setting('realtime.topic', true), '')::text
$$;
create or replace function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
language plpgsql as $$
begin
  begin
    perform set_config('realtime.topic', topic, true);
    insert into realtime.messages (payload, event, topic, private, extension) values (payload, event, topic, private, 'broadcast');
  exception when others then raise warning 'ErrorSendingBroadcastMessage: %', sqlerrm;
  end;
end $$;
-- as on Supabase, pages may try to read and write it; the policies decide (club-live.sql adds none for writing)
grant usage on schema realtime to anon, authenticated;
grant select, insert on realtime.messages to anon, authenticated;
grant usage on sequence realtime.messages_id_seq to anon, authenticated;
grant execute on function realtime.topic() to anon, authenticated;
