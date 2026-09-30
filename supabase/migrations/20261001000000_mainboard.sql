-- WILDCARD* — the record system (the Mainboard's ground).
--
--   THE CARD REMEMBERS. THE RECORD CHANGES. THE HOLDER DECIDES.
--
-- An account is not a card. A holder (auth.users) owns one RECORD. The
-- record's identity is written in VERSIONS: one is current — what a tap on
-- any of the holder's cards shows — and every earlier one is frozen, an
-- archive. EDIT corrects the current version in place (a typo, an order, a
-- visibility); REWRITE writes version N+1 and freezes N. Contact is the
-- record's, not a version's: it is corrected, never rewritten. CARDS are the
-- physical issues of a record, each with the version it was issued at; a
-- card's NFC tag carries only an opaque token (/w/{token}), which can be
-- revoked without touching anything else.
--
-- Holders read their own rows and nothing else; every write goes through a
-- function below that checks who is asking. The public page reads through
-- one function (`public_record`) that returns only what the holder made
-- public — and link-only material only to those holding the record's share
-- key. The studio's functions (numbers, clearance, cards) are the service
-- role's alone.
--
-- This replaces 20260930000000's `profiles` / `versions` (their rows move
-- here: a record keeps its id, its number, its public id).

create extension if not exists pgcrypto with schema extensions;

-- ── opaque tokens ────────────────────────────────────────────────────────

-- URL-safe random: 15 bytes → 20 characters. Never derived from an id.
create function public.opaque_token(bytes integer default 15)
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(bytes), 'base64'), '+/=', '-_');
$$;

revoke all on function public.opaque_token(integer) from public, anon, authenticated;

-- ── the vocabulary ───────────────────────────────────────────────────────

create type public.record_origin as enum ('self_application', 'studio_application', 'found');
create type public.visibility as enum ('public', 'link_only', 'private');
create type public.section_kind as enum (
  'currently', 'i_care_about', 'current_obsession', 'dont_reduce_me_to',
  'five_pieces', 'object', 'sound', 'unasked', 'custom'
);
create type public.link_kind as enum ('email', 'phone', 'website', 'instagram', 'work', 'location', 'custom');
create type public.card_design_mode as enum ('self', 'studio');
create type public.card_provenance as enum ('self_issued', 'studio_portrait', 'found');
create type public.card_status as enum ('pending', 'production', 'active', 'lost', 'revoked', 'retired');
create type public.card_production as enum (
  'draft', 'designing', 'awaiting_selection', 'selected', 'prepress',
  'production', 'quality_check', 'shipped', 'active'
);

-- ── records ──────────────────────────────────────────────────────────────

create table public.records (
  id uuid primary key default gen_random_uuid(),
  holder_id uuid not null unique references auth.users (id) on delete cascade,
  email text,
  display_name text
    check (display_name is null or (char_length(display_name) between 1 and 40 and display_name !~ '[[:cntrl:]]')),
  record_number text unique
    check (record_number is null or record_number ~ '^W\*–[0-9]{6}$'),
  public_id text not null unique default public.opaque_token(15),
  share_key text not null default public.opaque_token(18),
  clearance public.clearance not null default 'unissued',
  status public.record_status not null default 'pending',
  origin public.record_origin not null default 'self_application',
  current_version_id uuid,
  history_visibility public.visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.records is 'A holder''s W* RECORD: one per holder. The account is not the card.';
comment on column public.records.record_number is 'W*–000137. Display only — never a lookup, never authentication.';
comment on column public.records.public_id is 'Opaque: the record''s public address without a card (QR, a link).';
comment on column public.records.share_key is 'Opaque: opens LINK-ONLY material when it is in the link (?k=).';

insert into public.records (id, holder_id, email, display_name, record_number, public_id, clearance, status, created_at, updated_at)
select id, id, email, display_name, record_number, public_id, clearance, status, created_at, updated_at
from public.profiles;

-- ── versions: what the record has said, one of them current ─────────────

create table public.record_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  number integer not null check (number >= 1),
  statement text not null default '' check (char_length(statement) <= 2000),
  statement_visibility public.visibility not null default 'public',
  intro text not null default '' check (char_length(intro) <= 280),
  intro_visibility public.visibility not null default 'public',
  -- NOT SURE, at the rewrite: uncertainty counts.
  uncertain boolean not null default false,
  created_at timestamptz not null default now(),
  -- Set when a rewrite supersedes it; a frozen version is never written again.
  frozen_at timestamptz,
  unique (record_id, number)
);

comment on table public.record_versions is 'Identity versions of a record. The current one is edited in place; the rest are an archive.';

insert into public.record_versions (id, record_id, number, statement, created_at)
select v.id, v.holder_id, v.number, v.statement, v.created_at
from public.versions v;

update public.record_versions v
set frozen_at = now()
where exists (select 1 from public.record_versions w where w.record_id = v.record_id and w.number > v.number);

update public.records r
set current_version_id = (
  select v.id from public.record_versions v where v.record_id = r.id order by v.number desc limit 1
);

alter table public.records
  add constraint records_current_version_fk
  foreign key (current_version_id) references public.record_versions (id) on delete set null;

-- ── sections: a version's parts, each with its own visibility ───────────

create table public.record_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.record_versions (id) on delete cascade,
  kind public.section_kind not null default 'custom',
  label text check (label is null or char_length(label) between 1 and 60),
  body text not null default '' check (char_length(body) <= 4000),
  position integer not null default 0,
  visibility public.visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'custom' or label is not null)
);

create index record_sections_version on public.record_sections (version_id, position);

-- ── links: the record's contact, corrected but never rewritten ──────────

create table public.record_links (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  kind public.link_kind not null,
  label text check (label is null or char_length(label) between 1 and 40),
  value text not null check (char_length(value) between 1 and 500),
  position integer not null default 0,
  visibility public.visibility not null default 'private',
  -- Given when an EXCHANGE* is accepted (later).
  on_exchange boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index record_links_record on public.record_links (record_id, position);

-- ── cards: the physical issues ───────────────────────────────────────────

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  issue_number integer not null check (issue_number >= 1),
  version_at_issue uuid references public.record_versions (id) on delete set null,
  design_mode public.card_design_mode not null,
  provenance public.card_provenance not null,
  status public.card_status not null default 'pending',
  production public.card_production not null default 'draft',
  -- The chip's own UID, when known: not a secret, not an authentication factor.
  nfc_identifier text,
  -- References to the design's assets (storage paths), once there are any.
  design jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_id, issue_number)
);

comment on table public.cards is 'Physical issues of a record. A card''s design never changes after production; its token''s destination is the record.';

-- What a card's tag carries: /w/{token}. One active token per card; a
-- revoked token stays, inactive, so a tap on it can be told so.
create table public.nfc_tokens (
  token text primary key,
  card_id uuid not null references public.cards (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index nfc_tokens_one_active on public.nfc_tokens (card_id) where active;

-- ── audit: what changed the record's standing ───────────────────────────

create table public.audit_events (
  id bigint generated always as identity primary key,
  record_id uuid references public.records (id) on delete set null,
  actor uuid,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── the old tables go ────────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_email_changed on auth.users;
drop function if exists public.open_record();
drop function if exists public.follow_address();
drop function if exists public.claim_record(text);
drop function if exists public.issue_record_number(uuid);
drop function if exists public.set_clearance(uuid, public.clearance);
drop table public.versions;
drop table public.profiles;

-- ── who may read what ────────────────────────────────────────────────────

alter table public.records enable row level security;
alter table public.record_versions enable row level security;
alter table public.record_sections enable row level security;
alter table public.record_links enable row level security;
alter table public.cards enable row level security;
alter table public.nfc_tokens enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.records, public.record_versions, public.record_sections, public.record_links,
  public.cards, public.nfc_tokens, public.audit_events from anon, authenticated;

grant select on table public.records, public.record_versions, public.record_sections, public.record_links,
  public.cards, public.nfc_tokens to authenticated;

create policy "a holder reads their own record"
  on public.records for select to authenticated
  using (holder_id = (select auth.uid()));

create policy "a holder reads their own versions"
  on public.record_versions for select to authenticated
  using (record_id in (select id from public.records where holder_id = (select auth.uid())));

create policy "a holder reads their own sections"
  on public.record_sections for select to authenticated
  using (version_id in (
    select v.id from public.record_versions v
    join public.records r on r.id = v.record_id
    where r.holder_id = (select auth.uid())
  ));

create policy "a holder reads their own links"
  on public.record_links for select to authenticated
  using (record_id in (select id from public.records where holder_id = (select auth.uid())));

create policy "a holder reads their own cards"
  on public.cards for select to authenticated
  using (record_id in (select id from public.records where holder_id = (select auth.uid())));

create policy "a holder reads their own cards' tokens"
  on public.nfc_tokens for select to authenticated
  using (card_id in (
    select c.id from public.cards c
    join public.records r on r.id = c.record_id
    where r.holder_id = (select auth.uid())
  ));

-- ── keeping it ───────────────────────────────────────────────────────────

create trigger records_touch before update on public.records
  for each row execute function public.touch_updated_at();
create trigger record_sections_touch before update on public.record_sections
  for each row execute function public.touch_updated_at();
create trigger record_links_touch before update on public.record_links
  for each row execute function public.touch_updated_at();
create trigger cards_touch before update on public.cards
  for each row execute function public.touch_updated_at();

-- A record opens (unissued, pending) the moment an address is first seen.
create function public.open_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.records (holder_id, email)
  values (new.id, new.email)
  on conflict (holder_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.open_record();

create function public.follow_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.records set email = new.email where holder_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.follow_address();

-- ── what the holder can ask for ──────────────────────────────────────────

-- The caller's record, opened if the trigger has not (older accounts).
create function public.my_record()
returns public.records
language plpgsql
security definer
set search_path = ''
as $$
declare
  holder uuid := auth.uid();
  rec public.records;
begin
  if holder is null then
    raise exception 'authorization required' using errcode = '42501';
  end if;
  insert into public.records (holder_id, email)
  select u.id, u.email from auth.users u where u.id = holder
  on conflict (holder_id) do nothing;
  select * into rec from public.records where holder_id = holder;
  if rec.status = 'suspended' then
    raise exception 'record unavailable' using errcode = '42501';
  end if;
  return rec;
end;
$$;

revoke all on function public.my_record() from public, anon, authenticated;

-- NAME FOR THIS RECORD: names the record and, the first time, issues it
-- provisionally.
create function public.claim_record(name text)
returns public.records
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(regexp_replace(coalesce(name, ''), '\s+', ' ', 'g'));
  rec public.records := public.my_record();
begin
  if char_length(clean) < 1 or char_length(clean) > 40 or clean ~ '[[:cntrl:]]' then
    raise exception 'invalid name' using errcode = '22023';
  end if;
  update public.records r
  set display_name = clean,
      clearance = case when r.clearance = 'unissued' then 'provisional'::public.clearance else r.clearance end,
      status = case when r.status = 'pending' then 'active'::public.record_status else r.status end
  where r.id = rec.id
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.claim_record(text) from public, anon;
grant execute on function public.claim_record(text) to authenticated;

-- Writes a version's sections from JSON: [{kind, label, body, visibility}],
-- in order. Shared by EDIT and REWRITE.
create function public.put_sections(target uuid, sections jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s jsonb;
  i integer := 0;
begin
  if sections is null or jsonb_typeof(sections) <> 'array' then
    raise exception 'sections must be a list' using errcode = '22023';
  end if;
  if jsonb_array_length(sections) > 24 then
    raise exception 'too many sections' using errcode = '22023';
  end if;
  delete from public.record_sections where version_id = target;
  for s in select * from jsonb_array_elements(sections) loop
    insert into public.record_sections (version_id, kind, label, body, position, visibility)
    values (
      target,
      coalesce(nullif(s ->> 'kind', ''), 'custom')::public.section_kind,
      nullif(btrim(coalesce(s ->> 'label', '')), ''),
      coalesce(s ->> 'body', ''),
      i,
      coalesce(nullif(s ->> 'visibility', ''), 'public')::public.visibility
    );
    i := i + 1;
  end loop;
end;
$$;

revoke all on function public.put_sections(uuid, jsonb) from public, anon, authenticated;

-- EDIT: corrections to the current version and to the record's contact and
-- privacy. No new version.
create function public.edit_record(
  statement text,
  statement_visibility public.visibility,
  intro text,
  intro_visibility public.visibility,
  sections jsonb,
  links jsonb,
  history_visibility public.visibility
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records := public.my_record();
  l jsonb;
  i integer := 0;
begin
  if rec.display_name is null then
    raise exception 'record not named' using errcode = '42501';
  end if;
  if rec.current_version_id is not null then
    update public.record_versions v
    set statement = coalesce(edit_record.statement, ''),
        statement_visibility = edit_record.statement_visibility,
        intro = coalesce(edit_record.intro, ''),
        intro_visibility = edit_record.intro_visibility
    where v.id = rec.current_version_id;
    perform public.put_sections(rec.current_version_id, coalesce(sections, '[]'::jsonb));
  end if;

  if links is null or jsonb_typeof(links) <> 'array' or jsonb_array_length(links) > 20 then
    raise exception 'links must be a list of at most 20' using errcode = '22023';
  end if;
  delete from public.record_links where record_id = rec.id;
  for l in select * from jsonb_array_elements(links) loop
    insert into public.record_links (record_id, kind, label, value, position, visibility, on_exchange)
    values (
      rec.id,
      (l ->> 'kind')::public.link_kind,
      nullif(btrim(coalesce(l ->> 'label', '')), ''),
      btrim(coalesce(l ->> 'value', '')),
      i,
      coalesce(nullif(l ->> 'visibility', ''), 'private')::public.visibility,
      coalesce((l ->> 'on_exchange')::boolean, false)
    );
    i := i + 1;
  end loop;

  update public.records r set history_visibility = edit_record.history_visibility where r.id = rec.id;
end;
$$;

revoke all on function public.edit_record(text, public.visibility, text, public.visibility, jsonb, jsonb, public.visibility) from public, anon;
grant execute on function public.edit_record(text, public.visibility, text, public.visibility, jsonb, jsonb, public.visibility) to authenticated;

-- REWRITE: version N+1 from what the holder wrote; N is frozen. The first
-- version written makes the record self-authorized.
create function public.rewrite_record(
  statement text,
  statement_visibility public.visibility,
  intro text,
  intro_visibility public.visibility,
  sections jsonb,
  uncertain boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records := public.my_record();
  n integer;
  made uuid;
begin
  if rec.display_name is null then
    raise exception 'record not named' using errcode = '42501';
  end if;
  select coalesce(max(v.number), 0) + 1 into n from public.record_versions v where v.record_id = rec.id;
  insert into public.record_versions (record_id, number, statement, statement_visibility, intro, intro_visibility, uncertain)
  values (rec.id, n, coalesce(rewrite_record.statement, ''), rewrite_record.statement_visibility,
          coalesce(rewrite_record.intro, ''), rewrite_record.intro_visibility, coalesce(rewrite_record.uncertain, false))
  returning id into made;
  perform public.put_sections(made, coalesce(sections, '[]'::jsonb));
  update public.record_versions v set frozen_at = now() where v.id = rec.current_version_id;
  update public.records r
  set current_version_id = made,
      clearance = case when r.clearance in ('unissued', 'provisional') then 'self_authorized'::public.clearance else r.clearance end,
      status = case when r.status = 'pending' then 'active'::public.record_status else r.status end
  where r.id = rec.id;
  insert into public.audit_events (record_id, actor, action, detail)
  values (rec.id, auth.uid(), 'version.written', jsonb_build_object('number', n, 'uncertain', coalesce(rewrite_record.uncertain, false)));
  return n;
end;
$$;

revoke all on function public.rewrite_record(text, public.visibility, text, public.visibility, jsonb, boolean) from public, anon;
grant execute on function public.rewrite_record(text, public.visibility, text, public.visibility, jsonb, boolean) to authenticated;

-- LOST: the card's token stops answering (a tap reads THIS ISSUE IS NO
-- LONGER ACTIVE, nothing else). The design is not touched.
create function public.mark_card_lost(card uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records := public.my_record();
  owned public.cards;
begin
  select * into owned from public.cards c where c.id = card and c.record_id = rec.id;
  if owned.id is null then
    raise exception 'no such card' using errcode = '42501';
  end if;
  update public.cards c set status = 'lost' where c.id = owned.id;
  update public.nfc_tokens t set active = false, revoked_at = now() where t.card_id = owned.id and t.active;
  insert into public.audit_events (record_id, actor, action, detail)
  values (rec.id, auth.uid(), 'card.lost', jsonb_build_object('issue', owned.issue_number));
end;
$$;

revoke all on function public.mark_card_lost(uuid) from public, anon;
grant execute on function public.mark_card_lost(uuid) to authenticated;

-- A new share key: every link-only link given out so far stops opening.
create function public.renew_share_key()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records := public.my_record();
  key text := public.opaque_token(18);
begin
  update public.records r set share_key = key where r.id = rec.id;
  insert into public.audit_events (record_id, actor, action) values (rec.id, auth.uid(), 'share_key.renewed');
  return key;
end;
$$;

revoke all on function public.renew_share_key() from public, anon;
grant execute on function public.renew_share_key() to authenticated;

-- ── what anyone may see: the public page ────────────────────────────────

-- /w/{tag}: a card's token, or the record's public id. Returns only what
-- the holder made public — and link-only material when `key` is the
-- record's share key. `ver`: an earlier version, if the holder shows their
-- history. Nothing identifies the record inside the system.
create function public.public_record(tag text, key text default null, ver integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  hit record;
  rec public.records;
  card public.cards;
  shown public.record_versions;
  inner_ok boolean;
  seen public.visibility[];
  history jsonb := '[]'::jsonb;
begin
  if tag is null or char_length(tag) < 16 or char_length(tag) > 64 then
    return jsonb_build_object('state', 'missing');
  end if;

  select t.active as active, c.* into hit
  from public.nfc_tokens t join public.cards c on c.id = t.card_id
  where t.token = tag;

  if found then
    if not hit.active or hit.status <> 'active' then
      return jsonb_build_object('state', 'inactive');
    end if;
    select * into card from public.cards c where c.id = hit.id;
    select * into rec from public.records r where r.id = card.record_id;
  else
    select * into rec from public.records r where r.public_id = tag;
    if rec.id is null then
      return jsonb_build_object('state', 'missing');
    end if;
  end if;

  if rec.status = 'suspended' or rec.display_name is null then
    return jsonb_build_object('state', 'inactive');
  end if;

  inner_ok := key is not null and key = rec.share_key;
  seen := case when inner_ok then array['public', 'link_only']::public.visibility[] else array['public']::public.visibility[] end;

  if ver is not null and rec.history_visibility = any (seen) then
    select * into shown from public.record_versions v where v.record_id = rec.id and v.number = ver;
  end if;
  if shown.id is null then
    select * into shown from public.record_versions v where v.id = rec.current_version_id;
  end if;

  if rec.history_visibility = any (seen) then
    select coalesce(jsonb_agg(jsonb_build_object('number', v.number, 'created_at', v.created_at) order by v.number desc), '[]'::jsonb)
    into history
    from public.record_versions v where v.record_id = rec.id;
  end if;

  return jsonb_build_object(
    'state', 'active',
    'inner', inner_ok,
    'name', rec.display_name,
    'record_number', rec.record_number,
    'origin', rec.origin,
    'version', shown.number,
    'current', shown.id is not distinct from rec.current_version_id,
    'written_at', shown.created_at,
    'intro', case when shown.intro_visibility = any (seen) then nullif(shown.intro, '') end,
    'statement', case when shown.statement_visibility = any (seen) then nullif(shown.statement, '') end,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('kind', s.kind, 'label', s.label, 'body', s.body) order by s.position)
      from public.record_sections s
      where s.version_id = shown.id and s.visibility = any (seen) and s.body <> ''
    ), '[]'::jsonb),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('kind', l.kind, 'label', l.label, 'value', l.value) order by l.position)
      from public.record_links l
      where l.record_id = rec.id and l.visibility = any (seen)
    ), '[]'::jsonb),
    'history', history,
    'card', case when card.id is null then null else jsonb_build_object(
      'issue', card.issue_number,
      'provenance', card.provenance,
      'issued_at', card.issued_at,
      'version_at_issue', (select v.number from public.record_versions v where v.id = card.version_at_issue)
    ) end
  );
end;
$$;

revoke all on function public.public_record(text, text, integer) from public;
grant execute on function public.public_record(text, text, integer) to anon, authenticated;

-- ── what only the studio can do (service role, from a server) ───────────

-- Gives a record its number, once.
create function public.issue_record_number(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text;
begin
  update public.records r
  set record_number = coalesce(r.record_number, 'W*–' || lpad(nextval('public.record_number_seq')::text, 6, '0'))
  where r.id = target
  returning r.record_number into n;
  return n;
end;
$$;

revoke all on function public.issue_record_number(uuid) from public, anon, authenticated;
grant execute on function public.issue_record_number(uuid) to service_role;

create function public.set_clearance(target uuid, to_clearance public.clearance)
returns public.records
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records;
begin
  update public.records r
  set clearance = to_clearance,
      status = case when r.status = 'pending' then 'active'::public.record_status else r.status end
  where r.id = target
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.set_clearance(uuid, public.clearance) from public, anon, authenticated;
grant execute on function public.set_clearance(uuid, public.clearance) to service_role;

-- Issues a card for a record: the next issue number, the current version,
-- a fresh token. `activate` for a card already in the holder's hand.
create function public.issue_card(
  target uuid,
  mode public.card_design_mode,
  provenance public.card_provenance,
  activate boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.records;
  n integer;
  made public.cards;
  tag text := public.opaque_token(15);
begin
  select * into rec from public.records r where r.id = target;
  if rec.id is null then
    raise exception 'no such record' using errcode = '22023';
  end if;
  select coalesce(max(c.issue_number), 0) + 1 into n from public.cards c where c.record_id = rec.id;
  insert into public.cards (record_id, issue_number, version_at_issue, design_mode, provenance, status, production, issued_at)
  values (rec.id, n, rec.current_version_id, issue_card.mode, issue_card.provenance,
          case when activate then 'active'::public.card_status else 'pending'::public.card_status end,
          case when activate then 'active'::public.card_production else 'draft'::public.card_production end,
          case when activate then now() end)
  returning * into made;
  insert into public.nfc_tokens (token, card_id) values (tag, made.id);
  if issue_card.provenance = 'found' then
    update public.records r set origin = 'found' where r.id = rec.id;
  end if;
  insert into public.audit_events (record_id, action, detail)
  values (rec.id, 'card.issued', jsonb_build_object('issue', n, 'mode', issue_card.mode, 'provenance', issue_card.provenance));
  return jsonb_build_object('card', made.id, 'issue', n, 'token', tag);
end;
$$;

revoke all on function public.issue_card(uuid, public.card_design_mode, public.card_provenance, boolean) from public, anon, authenticated;
grant execute on function public.issue_card(uuid, public.card_design_mode, public.card_provenance, boolean) to service_role;

-- Moves a card on (production, activation, revocation, retirement). A
-- card that stops being active takes its token with it.
create function public.set_card_status(card uuid, to_status public.card_status, stage public.card_production default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.cards c
  set status = to_status,
      production = coalesce(stage, c.production),
      issued_at = case when to_status = 'active' and c.issued_at is null then now() else c.issued_at end
  where c.id = card;
  if to_status <> 'active' then
    update public.nfc_tokens t set active = false, revoked_at = now() where t.card_id = card and t.active;
  end if;
  insert into public.audit_events (record_id, action, detail)
  select c.record_id, 'card.status', jsonb_build_object('issue', c.issue_number, 'status', to_status)
  from public.cards c where c.id = card;
end;
$$;

revoke all on function public.set_card_status(uuid, public.card_status, public.card_production) from public, anon, authenticated;
grant execute on function public.set_card_status(uuid, public.card_status, public.card_production) to service_role;

-- Functions made by this migration are otherwise executable by everyone.
revoke all on function public.open_record() from public, anon, authenticated;
revoke all on function public.follow_address() from public, anon, authenticated;
