begin;

create table public.waitlist_email_queue (
  id uuid primary key default gen_random_uuid(),

  waitlist_id uuid not null
    references public.session_waitlist(id) on delete cascade,

  waitlist_joined_at timestamptz not null,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'processing',
        'accepted',
        'skipped',
        'review'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),

  attempts integer not null default 0
    check (attempts between 0 and 5),

  first_attempt_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,

  -- Store the exact sending request before contacting Resend.
  -- Retries must reuse that same request and idempotency key.
  payload jsonb
    check (payload is null or jsonb_typeof(payload) = 'object'),

  provider_message_id text,
  accepted_at timestamptz,
  last_error_code text,

  constraint waitlist_email_once_per_joining
    unique (waitlist_id, waitlist_joined_at),

  constraint waitlist_email_acceptance_check
    check (
      (
        status = 'accepted'
        and accepted_at is not null
        and provider_message_id is not null
      )
      or
      (
        status <> 'accepted'
        and accepted_at is null
      )
    )
);

create index waitlist_email_queue_due_idx
  on public.waitlist_email_queue (next_attempt_at, created_at)
  where status in ('queued', 'processing');

alter table public.waitlist_email_queue
  enable row level security;

revoke all privileges
  on table public.waitlist_email_queue
  from public, anon, authenticated, service_role;

grant select, insert, update
  on table public.waitlist_email_queue
  to service_role;


-- Find eligible waiting members whose session now has space.
-- Only trusted server code can execute this function.
create function public.enqueue_waitlist_notifications()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  insert into public.waitlist_email_queue (
    waitlist_id,
    waitlist_joined_at
  )
  select
    waitlist.id,
    waitlist.joined_at
  from public.session_waitlist as waitlist
  join public.members as member
    on member.id = waitlist.member_id
  join public.program_sessions as session
    on session.id = waitlist.session_id
  join public.member_entitlements as entitlement
    on entitlement.member_id = member.id
    and entitlement.session_number = session.session_number
  where waitlist.status = 'waiting'
    and member.status = 'active'
    and entitlement.status = 'available'
    and session.status = 'published'
    and session.starts_at > now()

    and not exists (
      select 1
      from public.session_bookings as booking
      where booking.member_id = member.id
        and booking.session_number = session.session_number
        and booking.status in ('booked', 'attended')
    )

    and (
      select count(*)
      from public.session_bookings as booking
      where booking.session_id = session.id
        and booking.status in ('booked', 'attended')
    ) < session.capacity

  on conflict (waitlist_id, waitlist_joined_at)
    do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all privileges
  on function public.enqueue_waitlist_notifications()
  from public, anon, authenticated, service_role;

grant execute
  on function public.enqueue_waitlist_notifications()
  to service_role;


-- Claim a small batch without allowing concurrent workers
-- to process the same queue records.
create function public.claim_waitlist_notifications()
returns setof public.waitlist_email_queue
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Stop automatic retries before Resend's 24-hour
  -- idempotency window expires.
  update public.waitlist_email_queue as queue
  set status = 'review',
      updated_at = now(),
      lease_token = null,
      lease_expires_at = null,
      last_error_code = 'retry_limit'
  where (
      queue.status = 'queued'
      or (
        queue.status = 'processing'
        and queue.lease_expires_at <= now()
      )
    )
    and (
      queue.attempts >= 5
      or queue.first_attempt_at <= now() - interval '23 hours'
    );

  -- Close unsent work when the member, session or waiting
  -- entry is no longer eligible. A full session is not
  -- skipped: its queued notification can wait for space.
  update public.waitlist_email_queue as queue
  set status = 'skipped',
      updated_at = now(),
      lease_token = null,
      lease_expires_at = null,
      last_error_code = 'no_longer_eligible'
  where (
      queue.status = 'queued'
      or (
        queue.status = 'processing'
        and queue.lease_expires_at <= now()
      )
    )
    and not exists (
      select 1
      from public.session_waitlist as waitlist
      join public.members as member
        on member.id = waitlist.member_id
      join public.program_sessions as session
        on session.id = waitlist.session_id
      join public.member_entitlements as entitlement
        on entitlement.member_id = member.id
        and entitlement.session_number = session.session_number
      where waitlist.id = queue.waitlist_id
        and waitlist.joined_at = queue.waitlist_joined_at
        and waitlist.status = 'waiting'
        and member.status = 'active'
        and entitlement.status = 'available'
        and session.status = 'published'
        and session.starts_at > now()
        and not exists (
          select 1
          from public.session_bookings as booking
          where booking.member_id = member.id
            and booking.session_number = session.session_number
            and booking.status in ('booked', 'attended')
        )
    );

  return query
  with candidates as (
    select queue.id
    from public.waitlist_email_queue as queue
    join public.session_waitlist as waitlist
      on waitlist.id = queue.waitlist_id
      and waitlist.joined_at = queue.waitlist_joined_at
    join public.members as member
      on member.id = waitlist.member_id
    join public.program_sessions as session
      on session.id = waitlist.session_id
    join public.member_entitlements as entitlement
      on entitlement.member_id = member.id
      and entitlement.session_number = session.session_number
    where (
        queue.status = 'queued'
        or (
          queue.status = 'processing'
          and queue.lease_expires_at <= now()
        )
      )
      and queue.next_attempt_at <= now()
      and queue.attempts < 5
      and (
        queue.first_attempt_at is null
        or queue.first_attempt_at > now() - interval '23 hours'
      )
      and waitlist.status = 'waiting'
      and member.status = 'active'
      and entitlement.status = 'available'
      and session.status = 'published'
      and session.starts_at > now()
      and not exists (
        select 1
        from public.session_bookings as booking
        where booking.member_id = member.id
          and booking.session_number = session.session_number
          and booking.status in ('booked', 'attended')
      )
      and (
        select count(*)
        from public.session_bookings as booking
        where booking.session_id = session.id
          and booking.status in ('booked', 'attended')
      ) < session.capacity
    order by queue.created_at, queue.id
    limit 5
    for update of queue skip locked
  )
  update public.waitlist_email_queue as queue
  set status = 'processing',
      attempts = queue.attempts + 1,
      first_attempt_at = coalesce(queue.first_attempt_at, now()),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + interval '5 minutes',
      updated_at = now()
  from candidates
  where queue.id = candidates.id
  returning queue.*;
end;
$$;

revoke all privileges
  on function public.claim_waitlist_notifications()
  from public, anon, authenticated, service_role;

grant execute
  on function public.claim_waitlist_notifications()
  to service_role;


-- Record an outcome only if this worker still owns its claim.
create function public.finish_waitlist_notification(
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
     or p_status not in ('queued', 'accepted', 'skipped', 'review') then
    raise exception 'Invalid notification outcome.';
  end if;

  if p_status = 'accepted'
     and nullif(trim(p_provider_message_id), '') is null then
    raise exception 'Provider acceptance identifier required.';
  end if;

  update public.waitlist_email_queue
  set status = p_status,
      provider_message_id = case
        when p_status = 'accepted' then p_provider_message_id
        else provider_message_id
      end,
      accepted_at = case
        when p_status = 'accepted' then now()
        else null
      end,
      last_error_code = left(p_error_code, 120),
      next_attempt_at = case
        when p_status = 'queued' then now() + interval '5 minutes'
        else next_attempt_at
      end,
      updated_at = now(),
      lease_token = null,
      lease_expires_at = null
  where id = p_id
    and status = 'processing'
    and lease_token = p_lease_token;

  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

revoke all privileges
  on function public.finish_waitlist_notification(
    uuid, uuid, text, text, text
  )
  from public, anon, authenticated, service_role;

grant execute
  on function public.finish_waitlist_notification(
    uuid, uuid, text, text, text
  )
  to service_role;

commit;