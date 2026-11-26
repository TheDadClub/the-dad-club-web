
begin;

alter table public.email_health_alerts

  add column attempt_count integer
    not null default 0,

  add column first_attempt_at timestamptz,

  add column next_attempt_at timestamptz
    not null default now(),

  add column lease_token uuid,

  add column lease_expires_at timestamptz,

  add column payload jsonb,

  add column last_error_code text,

  add constraint email_health_alert_attempt_count_check
    check (attempt_count >= 0),

  add constraint email_health_alert_payload_check
    check (
      payload is null
      or jsonb_typeof(payload) = 'object'
    ),

  add constraint email_health_alert_lease_check
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
    );

create index email_health_alerts_retry_idx
  on public.email_health_alerts (
    status,
    next_attempt_at
  );

create index email_health_alerts_lease_idx
  on public.email_health_alerts (
    lease_expires_at
  )
  where status = 'processing';

commit;
