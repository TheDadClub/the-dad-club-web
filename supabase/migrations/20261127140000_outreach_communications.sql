
begin;

alter table public.healthcare_referrals
  add column if not exists
    last_response_at timestamptz;

create table public.outreach_communications (
  id uuid primary key default gen_random_uuid(),

  healthcare_referral_id uuid
    references public.healthcare_referrals(id)
    on delete cascade,

  venue_outreach_contact_id uuid
    references public.venue_outreach_contacts(id)
    on delete cascade,

  mailbox_email text not null
    default 'hello@thedadclub.com.au'
    check (
      mailbox_email = 'hello@thedadclub.com.au'
    ),

  direction text not null
    check (direction in ('outbound', 'inbound')),

  provider text not null
    default 'microsoft_graph'
    check (provider = 'microsoft_graph'),

  provider_message_id text not null
    check (
      char_length(provider_message_id)
        between 1 and 2048
    ),

  internet_message_id text,

  conversation_id text,

  subject text,

  contact_email text not null
    check (
      contact_email = lower(trim(contact_email))
      and char_length(contact_email)
        between 3 and 254
      and position('@' in contact_email) > 1
    ),

  occurred_at timestamptz not null,

  created_at timestamptz not null default now(),

  constraint outreach_communication_contact_check
    check (
      num_nonnulls(
        healthcare_referral_id,
        venue_outreach_contact_id
      ) = 1
    )
);

create unique index outreach_healthcare_message_unique
  on public.outreach_communications (
    mailbox_email,
    provider_message_id,
    healthcare_referral_id
  )
  where healthcare_referral_id is not null;

create unique index outreach_venue_message_unique
  on public.outreach_communications (
    mailbox_email,
    provider_message_id,
    venue_outreach_contact_id
  )
  where venue_outreach_contact_id is not null;

create index outreach_healthcare_history_idx
  on public.outreach_communications (
    healthcare_referral_id,
    occurred_at desc
  )
  where healthcare_referral_id is not null;

create index outreach_venue_history_idx
  on public.outreach_communications (
    venue_outreach_contact_id,
    occurred_at desc
  )
  where venue_outreach_contact_id is not null;

create index outreach_conversation_idx
  on public.outreach_communications (
    mailbox_email,
    conversation_id
  )
  where conversation_id is not null;

alter table public.outreach_communications
  enable row level security;

revoke all
  on table public.outreach_communications
  from public, anon, authenticated, service_role;

grant select, insert
  on table public.outreach_communications
  to service_role;

commit;
