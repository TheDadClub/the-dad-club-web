
begin;

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null,

  event_type text not null
    check (
      event_type in (
        'venue_enquiry',
        'interest_registration',
        'facilitator_application'
      )
    ),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'processing',
        'accepted',
        'failed',
        'not_confirmed'
      )
    ),

  provider_message_id text,
  accepted_at timestamptz,
  attempted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Only one notification record per event.
  constraint admin_notification_once_per_event
    unique (event_type, event_id),

  -- Provider acceptance requires a recorded identifier
  -- and acceptance timestamp.
  constraint admin_notification_acceptance_check
    check (
      (
        status = 'accepted'
        and accepted_at is not null
        and provider_message_id is not null
      )
      or
      (
        status <> 'accepted'
        and accepted_at is null
        and provider_message_id is null
      )
    )
);

create index admin_notifications_status_idx
  on public.admin_notifications (
    status,
    created_at desc
  );

create index admin_notifications_created_idx
  on public.admin_notifications (
    created_at desc
  );

-- Restrict access to trusted server-side code.
alter table public.admin_notifications
  enable row level security;

revoke all privileges
  on table public.admin_notifications
  from public, anon, authenticated, service_role;

grant select, insert, update
  on table public.admin_notifications
  to service_role;

commit;
