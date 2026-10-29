begin;

-- Queue reminders during the hour after their scheduled time.
-- Late bookings already receive a booking confirmation.
create function public.enqueue_session_reminders()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  insert into public.session_reminder_queue (
    booking_id,
    session_starts_at,
    reminder_kind,
    scheduled_for,
    next_attempt_at
  )
  select
    booking.id,
    session.starts_at,
    '24_hours',
    session.starts_at - interval '24 hours',
    now()
  from public.session_bookings as booking
  join public.program_sessions as session
    on session.id = booking.session_id
  join public.members as member
    on member.id = booking.member_id
  where booking.status = 'booked'
    and member.status = 'active'
    and session.status = 'published'
    and session.starts_at > now()
    and session.starts_at - interval '24 hours' <= now()
    and session.starts_at - interval '24 hours'
      > now() - interval '1 hour'
    and booking.created_at
      <= session.starts_at - interval '24 hours'
  on conflict (
    booking_id,
    session_starts_at,
    reminder_kind
  ) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;


-- Claim a small batch, with a lease to prevent overlapping workers
-- from processing the same reminder at the same time.
create function public.claim_session_reminders()
returns setof public.session_reminder_queue
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Stop retrying after five attempts or 23 hours.
  -- This keeps retries inside the email provider's
  -- idempotency protection window.
  update public.session_reminder_queue as queue
  set
    status = 'review',
    last_error_code = 'retry_limit',
    updated_at = now(),
    lease_token = null,
    lease_expires_at = null
  where (
      queue.status = 'queued'
      or (
        queue.status = 'processing'
        and queue.lease_expires_at <= now()
      )
    )
    and (
      queue.attempts >= 5
      or queue.first_attempt_at
        <= now() - interval '23 hours'
    );

  -- Skip cancelled bookings, inactive members, unpublished
  -- sessions, changed start times and sessions already started.
  update public.session_reminder_queue as queue
  set
    status = 'skipped',
    last_error_code = 'no_longer_eligible',
    updated_at = now(),
    lease_token = null,
    lease_expires_at = null
  where (
      queue.status = 'queued'
      or (
        queue.status = 'processing'
        and queue.lease_expires_at <= now()
      )
    )
    and not exists (
      select 1
      from public.session_bookings as booking
      join public.program_sessions as session
        on session.id = booking.session_id
      join public.members as member
        on member.id = booking.member_id
      where booking.id = queue.booking_id
        and booking.status = 'booked'
        and member.status = 'active'
        and session.status = 'published'
        and session.starts_at = queue.session_starts_at
        and session.starts_at > now()
    );

  return query
  with candidates as (
    select queue.id
    from public.session_reminder_queue as queue
    where (
        queue.status = 'queued'
        or (
          queue.status = 'processing'
          and queue.lease_expires_at <= now()
        )
      )
      and queue.scheduled_for <= now()
      and queue.next_attempt_at <= now()
      and queue.attempts < 5
      and (
        queue.first_attempt_at is null
        or queue.first_attempt_at
          > now() - interval '23 hours'
      )
      and exists (
        select 1
        from public.session_bookings as booking
        join public.program_sessions as session
          on session.id = booking.session_id
        join public.members as member
          on member.id = booking.member_id
        where booking.id = queue.booking_id
          and booking.status = 'booked'
          and member.status = 'active'
          and session.status = 'published'
          and session.starts_at = queue.session_starts_at
          and session.starts_at > now()
      )
    order by
      queue.scheduled_for,
      queue.created_at,
      queue.id
    limit 5
    for update of queue skip locked
  )
  update public.session_reminder_queue as queue
  set
    status = 'processing',
    attempts = queue.attempts + 1,
    first_attempt_at = coalesce(
      queue.first_attempt_at,
      now()
    ),
    lease_token = gen_random_uuid(),
    lease_expires_at = now() + interval '5 minutes',
    updated_at = now()
  from candidates
  where queue.id = candidates.id
  returning queue.*;
end;
$$;


-- Record an outcome only while this worker still owns the lease.
create function public.finish_session_reminder(
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
  changed_count integer;
begin
  if p_status is null
    or p_status not in (
      'queued',
      'accepted',
      'skipped',
      'review'
    )
  then
    raise exception 'Invalid reminder outcome.';
  end if;

  if p_status = 'accepted'
    and nullif(btrim(p_provider_message_id), '') is null
  then
    raise exception 'Accepted reminders require a provider identifier.';
  end if;

  update public.session_reminder_queue as queue
  set
    status = p_status,

    provider_message_id = case
      when p_status = 'accepted'
        then p_provider_message_id
      else null
    end,

    accepted_at = case
      when p_status = 'accepted' then now()
      else null
    end,

    last_error_code = left(p_error_code, 120),

    next_attempt_at = case
      when p_status = 'queued'
        then now() + interval '5 minutes'
      else queue.next_attempt_at
    end,

    updated_at = now(),
    lease_token = null,
    lease_expires_at = null

  where queue.id = p_id
    and queue.status = 'processing'
    and queue.lease_token = p_lease_token
    and queue.lease_expires_at > now();

  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;


-- These functions are for server-side scheduled processing only.
revoke all privileges
  on function public.enqueue_session_reminders()
  from public, anon, authenticated, service_role;

revoke all privileges
  on function public.claim_session_reminders()
  from public, anon, authenticated, service_role;

revoke all privileges
  on function public.finish_session_reminder(
    uuid, uuid, text, text, text
  )
  from public, anon, authenticated, service_role;

grant execute
  on function public.enqueue_session_reminders()
  to service_role;

grant execute
  on function public.claim_session_reminders()
  to service_role;

grant execute
  on function public.finish_session_reminder(
    uuid, uuid, text, text, text
  )
  to service_role;

commit;