-- WILDCARD* records.
--
-- Every holder (an auth.users row: an address that has authorized itself by
-- a magic link or a code) has one record here: the fiction's identity record
-- at the Counter Identity Agency. What the holder may do with it is narrow on
-- purpose: read it, and name it. Clearance and status move only through the
-- functions below, and the record number is given only by the studio.
--
--   clearance  unissued → provisional (named) → self_authorized (FORM W*–01
--              filed) → issued (the studio issued the card)
--   status     pending (address authorized, record not named) → active;
--              suspended stops a record
--
-- `record_number` (W*–000137) is the holder's own, human-readable and
-- sequential, so it is never used to find a record from outside; that is
-- what `public_id` is for (random, for a card's public address later).

create type public.clearance as enum ('unissued', 'provisional', 'self_authorized', 'issued');
create type public.record_status as enum ('pending', 'active', 'suspended');

create sequence public.record_number_seq as integer start with 1 minvalue 1;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text
    check (display_name is null or (char_length(display_name) between 1 and 40 and display_name !~ '[[:cntrl:]]')),
  record_number text unique
    check (record_number is null or record_number ~ '^W\*–[0-9]{6}$'),
  public_id text not null unique default replace(gen_random_uuid()::text, '-', ''),
  clearance public.clearance not null default 'unissued',
  status public.record_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'WILDCARD* records: one per holder. Readable and nameable by the holder only.';
comment on column public.profiles.record_number is 'W*–000137. Given by the studio (issue_record_number). Never a public address.';
comment on column public.profiles.public_id is 'Random public identifier, for anything public later (a card''s NFC address).';

-- The versions of a holder's identity: what the studio wrote with them. The
-- latest one is what the record screen shows. Written by the studio (service
-- role) for now; the holder rewrites through FORM W*–01.
create table public.versions (
  id uuid primary key default gen_random_uuid(),
  holder_id uuid not null references public.profiles (id) on delete cascade,
  number integer not null check (number >= 1),
  statement text not null check (char_length(statement) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (holder_id, number)
);

comment on table public.versions is 'Identity versions of a WILDCARD* record. Readable by the holder only.';

-- ── who may do what ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.versions enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.versions from anon, authenticated;
revoke all on sequence public.record_number_seq from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select on table public.versions to authenticated;

create policy "a holder reads their own record"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "a holder names their own record"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id and status <> 'suspended')
  with check ((select auth.uid()) = id);

create policy "a holder reads their own versions"
  on public.versions for select to authenticated
  using ((select auth.uid()) = holder_id);

-- ── keeping it ───────────────────────────────────────────────────────────

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- A record opens (unissued, pending) the moment an address is first seen.
create function public.open_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.open_record();

-- The record follows its address if the address changes.
create function public.follow_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.follow_address();

-- ── what the holder can ask for ──────────────────────────────────────────

-- NAME FOR THIS RECORD: names the caller's record and, the first time,
-- issues it provisionally. The name is trimmed and its spaces collapsed.
create function public.claim_record(name text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  holder uuid := auth.uid();
  clean text := btrim(regexp_replace(coalesce(name, ''), '\s+', ' ', 'g'));
  rec public.profiles;
begin
  if holder is null then
    raise exception 'authorization required' using errcode = '42501';
  end if;
  if char_length(clean) < 1 or char_length(clean) > 40 or clean ~ '[[:cntrl:]]' then
    raise exception 'invalid name' using errcode = '22023';
  end if;

  insert into public.profiles (id, email)
  select u.id, u.email from auth.users u where u.id = holder
  on conflict (id) do nothing;

  update public.profiles p
  set display_name = clean,
      clearance = case when p.clearance = 'unissued' then 'provisional'::public.clearance else p.clearance end,
      status = case when p.status = 'pending' then 'active'::public.record_status else p.status end
  where p.id = holder and p.status <> 'suspended'
  returning * into rec;

  if rec.id is null then
    raise exception 'record unavailable' using errcode = '42501';
  end if;
  return rec;
end;
$$;

revoke all on function public.claim_record(text) from public, anon;
grant execute on function public.claim_record(text) to authenticated;

-- ── what only the studio can do (service role, from a server) ────────────

-- Gives a record its number, once.
create function public.issue_record_number(holder uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text;
begin
  update public.profiles
  set record_number = coalesce(record_number, 'W*–' || lpad(nextval('public.record_number_seq')::text, 6, '0'))
  where id = holder
  returning record_number into n;
  return n;
end;
$$;

revoke all on function public.issue_record_number(uuid) from public, anon, authenticated;
grant execute on function public.issue_record_number(uuid) to service_role;

-- Moves a record's clearance (and so its status) on.
create function public.set_clearance(holder uuid, next public.clearance)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.profiles;
begin
  update public.profiles
  set clearance = next,
      status = case when status = 'pending' then 'active'::public.record_status else status end
  where id = holder
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.set_clearance(uuid, public.clearance) from public, anon, authenticated;
grant execute on function public.set_clearance(uuid, public.clearance) to service_role;

-- Functions made by the migration are otherwise executable by everyone.
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.open_record() from public, anon, authenticated;
revoke all on function public.follow_address() from public, anon, authenticated;
