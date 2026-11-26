
begin;

create function public.create_email_health_alert()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_alert_id uuid;
  v_issue_count integer;
begin

  -- Prevent concurrent alert creation.
  perform pg_advisory_xact_lock(
    hashtextextended('email_health_alert_creation', 0)
  );

  -- Monitoring must be explicitly enabled.
  if not exists (
    select 1
    from public.email_health_settings
    where id = 1
      and enabled = true
      and monitoring_started_at is not null
  ) then
    return null;
  end if;

  -- Identify open issues that have not already
  -- been assigned an alert for this occurrence.
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

  -- Create the consolidated administrator alert.
  insert into public.email_health_alerts (
    status
  )
  values (
    'pending'
  )
  returning id into v_alert_id;

  -- Associate newly detected issues with this alert.
  insert into public.email_health_alert_items (
    alert_id,
    issue_id,
    occurrence_number
  )
  select
    v_alert_id,
    issue.id,
    issue.occurrence_count
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

  -- Roll back if no issues were assigned.
  if v_issue_count = 0 then
    raise exception 'No eligible email health issues.';
  end if;

  return v_alert_id;

end;
$$;

revoke all privileges on function
  public.create_email_health_alert()
from public, anon, authenticated, service_role;

grant execute on function
  public.create_email_health_alert()
to service_role;

commit;
