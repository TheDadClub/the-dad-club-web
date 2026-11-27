
begin;

-- Atomically acquire an execution lease.

create function public.claim_outreach_sync()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token uuid := gen_random_uuid();
  v_claimed_token uuid;
begin

  update public.outreach_sync_settings
  set
    lease_token = v_token,
    lease_expires_at =
      clock_timestamp() + interval '5 minutes',
    last_started_at = clock_timestamp(),
    last_status = 'running',
    last_error_code = null,
    updated_at = clock_timestamp()
  where id = 1
    and enabled = true
    and (
      lease_token is null
      or lease_expires_at <= clock_timestamp()
    )
  returning lease_token
  into v_claimed_token;

  return v_claimed_token;

end;
$$;


-- Verify that the processor still owns its lease.

create function public.owns_outreach_sync(
  p_token uuid
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.outreach_sync_settings
    where id = 1
      and enabled = true
      and lease_token = p_token
      and lease_expires_at > clock_timestamp()
  );
$$;


-- Record the execution outcome and release the lease.

create function public.finish_outreach_sync(
  p_token uuid,
  p_status text,
  p_error_code text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin

  if p_status is null
    or p_status not in ('success', 'failed', 'disabled')
  then
    raise exception 'Invalid outreach sync status.';
  end if;

  if p_status = 'failed' then
    if p_error_code is null
      or char_length(p_error_code) > 100
      or p_error_code !~ '^[a-z0-9_]+$'
    then
      raise exception 'Invalid outreach sync error code.';
    end if;
  end if;

  update public.outreach_sync_settings
  set
    last_status = p_status,

    last_finished_at = clock_timestamp(),

    last_success_at = case
      when p_status = 'success'
        then clock_timestamp()
      else last_success_at
    end,

    last_failure_at = case
      when p_status = 'failed'
        then clock_timestamp()
      else last_failure_at
    end,

    consecutive_failures = case
      when p_status = 'success' then 0
      when p_status = 'failed'
        then consecutive_failures + 1
      else consecutive_failures
    end,

    last_error_code = case
      when p_status = 'failed'
        then p_error_code
      else null
    end,

    lease_token = null,
    lease_expires_at = null,
    updated_at = clock_timestamp()

  where id = 1
    and lease_token = p_token
    and lease_expires_at > clock_timestamp()
    and (
      p_status <> 'success'
      or enabled = true
    );

  get diagnostics v_updated = row_count;

  return v_updated = 1;

end;
$$;


-- Restrict function execution to trusted server-side code.

revoke all
  on function public.claim_outreach_sync()
  from public, anon, authenticated, service_role;

revoke all
  on function public.owns_outreach_sync(uuid)
  from public, anon, authenticated, service_role;

revoke all
  on function public.finish_outreach_sync(uuid, text, text)
  from public, anon, authenticated, service_role;

grant execute
  on function public.claim_outreach_sync()
  to service_role;

grant execute
  on function public.owns_outreach_sync(uuid)
  to service_role;

grant execute
  on function public.finish_outreach_sync(uuid, text, text)
  to service_role;

commit;
