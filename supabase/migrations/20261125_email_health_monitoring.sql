
begin;

-- =====================================================
-- 1. EMAIL HEALTH ISSUES
-- =====================================================

create table public.email_health_issues (
  id uuid primary key default gen_random_uuid(),

  issue_key text not null unique,
  email_type text not null,
  source_table text not null,
  source_id text not null,

  issue_type text not null
    check (
      issue_type in (
        'failed',
        'not_confirmed',
        'pending_overdue',
        'processing_overdue',
        'queue_overdue',
        'review_required',
        'processor_inactive',
        'processor_failed'
      )
    ),

  severity text not null default 'warning'
    check (
      severity in ('warning', 'critical')
    ),

  status text not null default 'open'
    check (
      status in (
        'open',
        'acknowledged',
        'resolved'
      )
    ),

  source_status text,
  error_code text,

  occurrence_count integer not null default 1
    check (occurrence_count >= 1),

  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),

  acknowledged_at timestamptz,
  resolved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_health_issue_resolution_check
    check (
      (status = 'resolved' and resolved_at is not null)
      or
      (status <> 'resolved' and resolved_at is null)
    ),

  constraint email_health_issue_acknowledgement_check
    check (
      status <> 'acknowledged'
      or acknowledged_at is not null
    )
);

create index email_health_issues_status_idx
  on public.email_health_issues (
    status,
    severity,
    last_detected_at desc
  );

create index email_health_issues_source_idx
  on public.email_health_issues (
    source_table,
    source_id
  );


-- =====================================================
-- 2. ADMINISTRATOR ALERT EMAILS
-- =====================================================

create table public.email_health_alerts (
  id uuid primary key default gen_random_uuid(),

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
  attempted_at timestamptz,
  accepted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_health_alert_acceptance_check
    check (
      (
        status = 'accepted'
        and provider_message_id is not null
        and accepted_at is not null
      )
      or
      (
        status <> 'accepted'
        and provider_message_id is null
        and accepted_at is null
      )
    )
);

create index email_health_alerts_status_idx
  on public.email_health_alerts (
    status,
    created_at desc
  );


-- Associate each alert with the issues it contains.
-- An issue can generate another alert if a new
-- occurrence is detected after resolution.

create table public.email_health_alert_items (
  alert_id uuid not null
    references public.email_health_alerts(id)
    on delete cascade,

  issue_id uuid not null
    references public.email_health_issues(id)
    on delete restrict,

  occurrence_number integer not null
    check (occurrence_number >= 1),

  created_at timestamptz not null default now(),

  primary key (alert_id, issue_id),

  constraint email_health_alert_once_per_occurrence
    unique (issue_id, occurrence_number)
);


-- =====================================================
-- 3. SCHEDULED PROCESSOR HEALTH
-- =====================================================

create table public.email_processor_health (
  processor_name text primary key
    check (
      processor_name in (
        'session_reminders',
        'waitlist_notifications',
        'email_health_monitor'
      )
    ),

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

  current_run_id uuid,

  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,

  last_error_code text,

  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.email_processor_health (
  processor_name
)
values
  ('session_reminders'),
  ('waitlist_notifications'),
  ('email_health_monitor');


-- =====================================================
-- 4. MONITORING ACTIVATION SETTINGS
-- =====================================================

create table public.email_health_settings (
  id integer primary key
    check (id = 1),

  enabled boolean not null default false,

  monitoring_started_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_health_activation_check
    check (
      enabled = false
      or monitoring_started_at is not null
    )
);

insert into public.email_health_settings (
  id,
  enabled
)
values (1, false);


-- =====================================================
-- 5. SECURITY
-- =====================================================

alter table public.email_health_issues
  enable row level security;

alter table public.email_health_alerts
  enable row level security;

alter table public.email_health_alert_items
  enable row level security;

alter table public.email_processor_health
  enable row level security;

alter table public.email_health_settings
  enable row level security;

revoke all privileges on table
  public.email_health_issues,
  public.email_health_alerts,
  public.email_health_alert_items,
  public.email_processor_health,
  public.email_health_settings
from public, anon, authenticated, service_role;

grant select, insert, update on table
  public.email_health_issues,
  public.email_health_alerts,
  public.email_processor_health
to service_role;

grant select, insert on table
  public.email_health_alert_items
to service_role;

grant select, update on table
  public.email_health_settings
to service_role;

commit;
