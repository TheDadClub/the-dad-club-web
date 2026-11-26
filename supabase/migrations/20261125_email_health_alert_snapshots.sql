
begin;

-- Monitoring must remain disabled during this migration.
do $$
begin
  if exists (
    select 1
    from public.email_health_settings
    where enabled = true
  ) then
    raise exception 'Disable email health monitoring first.';
  end if;

  if exists (
    select 1
    from public.email_health_alert_items
  ) then
    raise exception 'Existing alert items require review.';
  end if;
end;
$$;

-- Store the original issue details with each alert item.
alter table public.email_health_alert_items

  add column email_type text not null,

  add column issue_type text not null,

  add column severity text not null,

  add constraint email_health_alert_item_severity_check
    check (
      severity in ('warning', 'critical')
    ),

  add constraint email_health_alert_item_type_check
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
    );


-- Replace the alert creation function so issue details
-- are captured atomically when the alert is created.

create or replace function public.create_email_health_alert()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_alert_id uuid;
  v_issue_count integer;
begin

  perform pg_advisory_xact_lock(
    hashtextextended('email_health_alert_creation', 0)
  );

  if not exists (
    select 1
    from public.email_health_settings
    where id = 1
      and enabled = true
      and monitoring_started_at is not null
  ) then
    return null;
  end if;

  if not exists (
    select 1
    from public.email_health_issues as issue
    where issue.status = 'open'
      and not exists (
        select 1
        from public.email_health_alert_items as item
        where item.issue_id = issue.id
          and item.occurrence_number =
            issue.occurrence_count
      )
  ) then
    return null;
  end if;

  insert into public.email_health_alerts (
    status
  )
  values (
    'pending'
  )
  returning id into v_alert_id;

  insert into public.email_health_alert_items (
    alert_id,
    issue_id,
    occurrence_number,
    email_type,
    issue_type,
    severity
  )
  select
    v_alert_id,
    issue.id,
    issue.occurrence_count,
    issue.email_type,
    issue.issue_type,
    issue.severity
  from public.email_health_issues as issue
  where issue.status = 'open'
    and not exists (
      select 1
      from public.email_health_alert_items as item
      where item.issue_id = issue.id
        and item.occurrence_number =
          issue.occurrence_count
    )
  on conflict (
    issue_id,
    occurrence_number
  )
  do nothing;

  get diagnostics v_issue_count = row_count;

  if v_issue_count = 0 then
    raise exception 'No eligible email health issues.';
  end if;

  return v_alert_id;

end;
$$;


-- Preserve restricted function access.
revoke all privileges on function
  public.create_email_health_alert()
from public, anon, authenticated, service_role;

grant execute on function
  public.create_email_health_alert()
to service_role;

commit;
