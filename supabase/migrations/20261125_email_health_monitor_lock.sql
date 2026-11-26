
begin;

-- =====================================================
-- 1. ADD MONITORING LEASE FIELDS
-- =====================================================

alter table public.email_health_settings

  add column monitor_lease_token uuid,

  add column monitor_lease_expires_at timestamptz,

  add constraint email_health_monitor_lease_check
    check (
      (
        monitor_lease_token is null
        and monitor_lease_expires_at is null
      )
      or
      (
        monitor_lease_token is not null
        and monitor_lease_expires_at is not null
      )
    );


-- =====================================================
-- 2. ATOMICALLY CLAIM THE MONITORING LEASE
-- =====================================================

create function public.claim_email_health_monitor()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token uuid := gen_random_uuid();
begin

  update public.email_health_settings
  set
    monitor_lease_token = v_token,
    monitor_lease_expires_at =
      clock_timestamp() + interval '5 minutes',
    updated_at = clock_timestamp()
  where id = 1
    and enabled = true
    and monitoring_started_at is not null
    and (
      monitor_lease_token is null
      or monitor_lease_expires_at <= clock_timestamp()
    );

  if not found then
    return null;
  end if;

  return v_token;

end;
$$;


-- =====================================================
-- 3. VERIFY MONITORING LEASE OWNERSHIP
-- =====================================================

create function public.owns_email_health_monitor(
  p_token uuid
)
returns boolean
language sql
security invoker
set search_path = ''
as $$

  select exists (
    select 1
    from public.email_health_settings
    where id = 1
      and enabled = true
      and monitoring_started_at is not null
      and monitor_lease_token = p_token
      and monitor_lease_expires_at >
        clock_timestamp()
  );

$$;


-- =====================================================
-- 4. RELEASE THE MONITORING LEASE
-- =====================================================

create function public.release_email_health_monitor(
  p_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin

  update public.email_health_settings
  set
    monitor_lease_token = null,
    monitor_lease_expires_at = null,
    updated_at = clock_timestamp()
  where id = 1
    and monitor_lease_token = p_token;

  return found;

end;
$$;


-- =====================================================
-- 5. RESTRICT FUNCTION ACCESS
-- =====================================================

revoke all privileges on function
  public.claim_email_health_monitor()
from public, anon, authenticated, service_role;

grant execute on function
  public.claim_email_health_monitor()
to service_role;


revoke all privileges on function
  public.owns_email_health_monitor(uuid)
from public, anon, authenticated, service_role;

grant execute on function
  public.owns_email_health_monitor(uuid)
to service_role;


revoke all privileges on function
  public.release_email_health_monitor(uuid)
from public, anon, authenticated, service_role;

grant execute on function
  public.release_email_health_monitor(uuid)
to service_role;

commit;
