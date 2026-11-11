
begin;

-- Venue partnership enquiries and approved venue records.
-- Public submissions will be processed by trusted server code,
-- not through direct browser access to this table.

create table public.venue_partners (
  id uuid primary key default gen_random_uuid(),

  venue_name text not null
    check (char_length(venue_name) between 1 and 150),

  suburb text not null
    check (char_length(suburb) between 1 and 100),

  contact_name text not null
    check (char_length(contact_name) between 1 and 100),

  contact_email text not null
    check (char_length(contact_email) between 3 and 254),

  contact_phone text
    check (
      contact_phone is null
      or char_length(contact_phone) <= 30
    ),

  capacity text not null
    check (
      capacity in ('6-12', '13-20', '20+', 'unsure')
    ),

  privacy text not null
    check (
      privacy in ('private', 'semi-private', 'open')
    ),

  equipment text not null
    check (
      equipment in ('tv', 'projector', 'both', 'none')
    ),

  evenings text[] not null default '{}'
    check (
      evenings <@ array[
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday'
      ]::text[]
    ),

  complimentary text not null
    check (
      complimentary in ('yes', 'discuss', 'no')
    ),

  notes text
    check (
      notes is null
      or char_length(notes) <= 1000
    ),

  -- Partnership management fields.
  status text not null default 'new'
    check (
      status in (
        'new',
        'contacted',
        'interested',
        'confirmed',
        'declined',
        'inactive'
      )
    ),

  source text not null default 'website'
    check (
      source in ('website', 'admin', 'outreach')
    ),

  internal_notes text,

  last_contacted_at timestamptz,
  follow_up_at timestamptz,

  contact_consent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index venue_partners_status_idx
  on public.venue_partners (status, created_at desc);

create index venue_partners_follow_up_idx
  on public.venue_partners (follow_up_at)
  where follow_up_at is not null;

create index venue_partners_created_idx
  on public.venue_partners (created_at desc);

-- Protect venue details from direct public access.

alter table public.venue_partners
  enable row level security;

revoke all privileges
  on table public.venue_partners
  from public, anon, authenticated, service_role;

grant select, insert, update, delete
  on table public.venue_partners
  to service_role;

-- No anon or authenticated policies are created.
-- All public submissions must pass through a validated
-- server endpoint using trusted service credentials.

commit;
