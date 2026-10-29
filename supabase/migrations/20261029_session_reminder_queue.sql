begin;

create table public.session_reminder_queue (
  id uuid primary key default gen_random_uuid(),

  booking_id uuid not null
    references public.session_bookings(id)
    on delete cascade,

  -- Identify the session date this reminder relates to.
  -- Rescheduled sessions can receive a new reminder.
  session_starts_at timestamptz not null,

  reminder_kind text not null default '24_hours'
    check (reminder_kind = '24_hours'),

  scheduled_for timestamptz not null,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'processing',
        'accepted',
        'skipped',
        'review'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),

  attempts integer not null default 0
    check (attempts between 0 and 5),

  first_attempt_at timestamptz,

  lease_token uuid,
  lease_expires_at timestamptz,

  -- Save the exact email request before sending.
  -- Retries must reuse the same request and idempotency key.
  payload jsonb
    check (
      payload is null
      or jsonb_typeof(payload) = 'object'
    ),

  provider_message_id text,
  accepted_at timestamptz,
  last_error_code text,

  constraint session_reminder_unique
    unique (
      booking_id,
      session_starts_at,
      reminder_kind
    ),

  constraint session_reminder_schedule_valid
    check (
      scheduled_for =
        session_starts_at - interval '24 hours'
    ),

  constraint session_reminder_lease_valid
    check (
      (
        status = 'processing'
        and lease_token is not null
        and lease_expires_at is not null
      )
      or
      (
        status <> 'processing'
        and lease_token is null
        and lease_expires_at is null
      )
    ),

  constraint session_reminder_acceptance_valid
    check (
      (
        status = 'accepted'
        and accepted_at is not null
        and nullif(btrim(provider_message_id), '') is not null
      )
      or
      (
        status <> 'accepted'
        and accepted_at is null
      )
    )
);

create index session_reminder_due_index
  on public.session_reminder_queue (
    next_attempt_at,
    scheduled_for,
    created_at
  )
  where status in ('queued', 'processing');

alter table public.session_reminder_queue
  enable row level security;

revoke all privileges
  on table public.session_reminder_queue
  from public, anon, authenticated, service_role;

grant select, insert, update
  on table public.session_reminder_queue
  to service_role;

comment on table public.session_reminder_queue is
  'Private operational email queue for booked-session reminders. Server access only.';

commit;