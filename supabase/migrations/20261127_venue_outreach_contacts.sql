
begin;

create table public.venue_outreach_contacts (
  id uuid primary key default gen_random_uuid(),

  venue_name text not null
    check (char_length(trim(venue_name)) between 1 and 150),

  contact_name text,

  email text not null
    check (
      char_length(email) between 3 and 254
      and email = lower(trim(email))
      and position('@' in email) > 1
    ),

  phone text,
  website text,
  suburb text,

  state text not null default 'SA',

  priority text not null default 'Medium'
    check (
      priority in ('High', 'Medium', 'Low')
    ),

  status text not null default 'Not contacted'
    check (
      status in (
        'Not contacted',
        'Emailed',
        'Responded',
        'Interested',
        'Confirmed',
        'Declined',
        'Inactive'
      )
    ),

  notes text,

  last_contacted_at timestamptz,
  last_response_at timestamptz,
  follow_up_at timestamptz,

  venue_partner_id uuid
    references public.venue_partners(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint venue_outreach_email_unique
    unique (email)
);

create index venue_outreach_status_idx
  on public.venue_outreach_contacts(status);

create index venue_outreach_priority_idx
  on public.venue_outreach_contacts(priority);

create index venue_outreach_follow_up_idx
  on public.venue_outreach_contacts(follow_up_at)
  where follow_up_at is not null;

create index venue_outreach_partner_idx
  on public.venue_outreach_contacts(venue_partner_id)
  where venue_partner_id is not null;

alter table public.venue_outreach_contacts
  enable row level security;

revoke all
  on table public.venue_outreach_contacts
  from public, anon, authenticated, service_role;

grant select, insert, update, delete
  on table public.venue_outreach_contacts
  to service_role;

commit;
