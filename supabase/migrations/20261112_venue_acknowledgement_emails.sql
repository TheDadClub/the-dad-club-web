begin;

alter table public.venue_partners
  add column acknowledgement_email_status text
    not null default 'not_recorded',
  add column acknowledgement_email_accepted_at
    timestamp with time zone,
  add column acknowledgement_email_provider_id text;

alter table public.venue_partners
  add constraint venue_acknowledgement_status_check
  check (
    acknowledgement_email_status in (
      'not_recorded',
      'pending',
      'accepted',
      'failed',
      'not_confirmed'
    )
  );

alter table public.venue_partners
  add constraint venue_acknowledgement_acceptance_check
  check (
    (
      acknowledgement_email_status = 'accepted'
      and acknowledgement_email_accepted_at is not null
      and acknowledgement_email_provider_id is not null
    )
    or
    (
      acknowledgement_email_status <> 'accepted'
      and acknowledgement_email_accepted_at is null
      and acknowledgement_email_provider_id is null
    )
  );

commit;