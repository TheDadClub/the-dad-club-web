
begin;

create table public.outreach_sync_settings (
  id integer primary key
    check (id = 1),

  enabled boolean not null default false,

  mailbox_email text not null
    default 'hello@thedadclub.com.au'
    check (
      mailbox_email = 'hello@thedadclub.com.au'
    ),

  sync_from_at timestamptz not null,

  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,

  last_status text not null default 'not_started'
    check (
      last_status in (
        'not_started',
        'running',
        'success',
        'failed',
        'disabled'
      )
    ),

  last_error_code text,

  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),

  lease_token uuid,
  lease_expires_at timestamptz,

  constraint outreach_sync_lease_check
    check (
      (lease_token is null and lease_expires_at is null)
      or
      (lease_token is not null and lease_expires_at is not null)
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.outreach_sync_settings (
  id,
  enabled,
  sync_from_at
)
values (
  1,
  false,
  '2026-11-01 00:00:00 Australia/Adelaide'::timestamptz
);

alter table public.outreach_sync_settings
  enable row level security;

revoke all
  on table public.outreach_sync_settings
  from public, anon, authenticated, service_role;

grant select, update
  on table public.outreach_sync_settings
  to service_role;

commit;
