
begin;

create or replace function public.record_email_health_issues(
  p_issues jsonb,
  p_detected_at timestamptz
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_issue jsonb;
  v_count integer := 0;
begin
  if p_issues is null
    or jsonb_typeof(p_issues) <> 'array'
    or p_detected_at is null
    or p_detected_at > now() + interval '1 minute'
  then
    raise exception 'Invalid email health scan.';
  end if;

  -- Serialise issue recording across monitoring runs.
  perform pg_advisory_xact_lock(
    hashtextextended('email_health_issue_tracking', 0)
  );

  for v_issue in
    select value
    from jsonb_array_elements(p_issues)
  loop

    insert into public.email_health_issues as existing (
      issue_key,
      email_type,
      source_table,
      source_id,
      issue_type,
      severity,
      status,
      source_status,
      error_code,
      occurrence_count,
      first_detected_at,
      last_detected_at,
      created_at,
      updated_at
    )
    values (
      v_issue->>'issue_key',
      v_issue->>'email_type',
      v_issue->>'source_table',
      v_issue->>'source_id',
      v_issue->>'issue_type',
      v_issue->>'severity',
      'open',
      v_issue->>'source_status',
      v_issue->>'error_code',
      1,
      p_detected_at,
      p_detected_at,
      now(),
      now()
    )

    on conflict (issue_key)
    do update set
      issue_type = excluded.issue_type,
      severity = excluded.severity,
      source_status = excluded.source_status,
      error_code = excluded.error_code,

      status = case
        when existing.status = 'resolved'
          then 'open'
        else existing.status
      end,

      occurrence_count = case
        when existing.status = 'resolved'
          then existing.occurrence_count + 1
        else existing.occurrence_count
      end,

      first_detected_at = case
        when existing.status = 'resolved'
          then excluded.first_detected_at
        else existing.first_detected_at
      end,

      last_detected_at = excluded.last_detected_at,

      acknowledged_at = case
        when existing.status = 'resolved'
          then null
        else existing.acknowledged_at
      end,

      resolved_at = null,
      updated_at = now()

    where existing.last_detected_at
      <= excluded.last_detected_at
      and (
        existing.resolved_at is null
        or existing.resolved_at < excluded.last_detected_at
      );

    if found then
      v_count := v_count + 1;
    end if;

  end loop;

  return v_count;
end;
$$;

revoke all privileges on function
  public.record_email_health_issues(jsonb, timestamptz)
from public, anon, authenticated, service_role;

grant execute on function
  public.record_email_health_issues(jsonb, timestamptz)
to service_role;

commit;
