
begin;

-- =====================================================
-- 1. CLAIM EMAIL HEALTH ALERTS
-- =====================================================

create function public.claim_email_health_alerts()
returns setof public.email_health_alerts
language plpgsql
security invoker
set search_path = ''
as $$
begin

  -- Do not process alerts while monitoring is disabled.
  if not exists (
    select 1
    from public.email_health_settings
    where id = 1
      and enabled = true
      and monitoring_started_at is not null
  ) then
    return;
  end if;

  -- Recover expired processing leases.
  update public.email_health_alerts
  set
    status = case
      when attempt_count >= 5
        or first_attempt_at <= now() - interval '23 hours'
      then 'not_confirmed'
      else 'pending'
    end,
    lease_token = null,
    lease_expires_at = null,
    next_attempt_at = now(),
    last_error_code = 'lease_expired',
    updated_at = now()
  where status = 'processing'
    and lease_expires_at <= now();

  -- Stop retries outside the permitted retry window.
  update public.email_health_alerts
  set
    status = 'not_confirmed',
    last_error_code = 'retry_window_exhausted',
    updated_at = now()
  where status = 'pending'
    and (
      attempt_count >= 5
      or first_attempt_at <= now() - interval '23 hours'
    );

  -- Atomically claim up to five eligible alerts.
  return query
  with candidates as (
    select alert.id
    from public.email_health_alerts as alert
    where alert.status = 'pending'
      and alert.next_attempt_at <= now()
      and alert.attempt_count < 5
      and (
        alert.first_attempt_at is null
        or alert.first_attempt_at >
          now() - interval '23 hours'
      )
    order by alert.created_at, alert.id
    limit 5
    for update skip locked
  )
  update public.email_health_alerts as alert
  set
    status = 'processing',
    attempt_count = alert.attempt_count + 1,
    first_attempt_at = coalesce(
      alert.first_attempt_at,
      now()
    ),
    attempted_at = now(),
    lease_token = gen_random_uuid(),
    lease_expires_at = now() + interval '5 minutes',
    updated_at = now()
  from candidates
  where alert.id = candidates.id
  returning alert.*;

end;
$$;


-- =====================================================
-- 2. RECORD ALERT SENDING OUTCOME
-- =====================================================

create function public.finish_email_health_alert(
  p_id uuid,
  p_lease_token uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_alert public.email_health_alerts%rowtype;
  v_status text;
begin

  if p_status is null
    or p_status not in (
      'accepted',
      'pending',
      'failed',
      'not_confirmed'
    )
  then
    raise exception 'Invalid email health alert outcome.';
  end if;

  if p_status = 'accepted'
    and (
      p_provider_message_id is null
      or length(trim(p_provider_message_id)) = 0
      or length(p_provider_message_id) > 255
    )
  then
    raise exception 'Provider message ID required.';
  end if;

  -- Lock only the alert owned by this processing attempt.
  select *
  into v_alert
  from public.email_health_alerts
  where id = p_id
    and status = 'processing'
    and lease_token = p_lease_token
    and lease_expires_at > now()
  for update;

  if not found then
    return false;
  end if;

  v_status := p_status;

  -- Prevent retries beyond the attempt or time limit.
  if v_status = 'pending'
    and (
      v_alert.attempt_count >= 5
      or v_alert.first_attempt_at <=
        now() - interval '23 hours'
    )
  then
    v_status := 'not_confirmed';
  end if;

  update public.email_health_alerts
  set
    status = v_status,

    provider_message_id = case
      when v_status = 'accepted'
      then p_provider_message_id
      else null
    end,

    accepted_at = case
      when v_status = 'accepted'
      then now()
      else null
    end,

    next_attempt_at = case
      when v_status = 'pending'
      then now() + interval '15 minutes'
      else next_attempt_at
    end,

    last_error_code = case
      when v_status = 'accepted'
      then null
      else p_error_code
    end,

    lease_token = null,
    lease_expires_at = null,
    updated_at = now()

  where id = p_id
    and lease_token = p_lease_token
    and status = 'processing';

  return found;

end;
$$;


-- =====================================================
-- 3. RESTRICT FUNCTION ACCESS
-- =====================================================

revoke all privileges on function
  public.claim_email_health_alerts()
from public, anon, authenticated, service_role;

grant execute on function
  public.claim_email_health_alerts()
to service_role;

revoke all privileges on function
  public.finish_email_health_alert(
    uuid, uuid, text, text, text
  )
from public, anon, authenticated, service_role;

grant execute on function
  public.finish_email_health_alert(
    uuid, uuid, text, text, text
  )
to service_role;

commit;
