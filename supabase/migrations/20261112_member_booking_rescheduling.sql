begin;

create table public.booking_changes (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id) on delete restrict,

  old_booking_id uuid not null unique
    references public.session_bookings(id) on delete restrict,

  new_booking_id uuid not null unique
    references public.session_bookings(id) on delete restrict,

  session_number integer not null
    check (session_number between 1 and 5),

  recipient_email text not null
    check (char_length(recipient_email) between 3 and 254),

  old_session_details jsonb not null
    check (jsonb_typeof(old_session_details) = 'object'),

  new_session_details jsonb not null
    check (jsonb_typeof(new_session_details) = 'object'),

  created_by uuid not null references auth.users(id),

  created_at timestamp with time zone not null default now(),

  email_status text not null default 'pending'
    check (
      email_status in (
        'pending',
        'accepted',
        'not_confirmed',
        'skipped'
      )
    ),

  email_accepted_at timestamp with time zone,

  constraint booking_changes_different_bookings
    check (old_booking_id <> new_booking_id),

  constraint booking_changes_email_acceptance
    check (
      (
        email_status = 'accepted'
        and email_accepted_at is not null
      )
      or
      (
        email_status <> 'accepted'
        and email_accepted_at is null
      )
    )
);

create index booking_changes_member_created_at
  on public.booking_changes(member_id, created_at desc);

alter table public.booking_changes enable row level security;

revoke all on public.booking_changes
  from public, anon, authenticated;

grant select, insert, update
  on public.booking_changes to service_role;

create function public.reschedule_member_booking(
  p_booking_id uuid,
  p_session_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;

  original_booking public.session_bookings%rowtype;
  original_session public.program_sessions%rowtype;
  replacement_session public.program_sessions%rowtype;
  selected_member public.members%rowtype;
  selected_entitlement public.member_entitlements%rowtype;

  original_session_id uuid;
  replacement_booking_id uuid;
  change_id uuid;
  occupied_places integer;
  affected_rows integer;
begin
  if current_user_id is null
    or auth.role() is distinct from 'authenticated'
  then
    raise exception 'Member sign-in required.';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = current_user_id
      and email_confirmed_at is not null
  ) then
    raise exception 'A verified email address is required.';
  end if;

  select id
  into current_member_id
  from public.members
  where auth_user_id = current_user_id
    and status = 'active';

  if current_member_id is null then
    raise exception 'Active member access is required.';
  end if;

  select session_id
  into original_session_id
  from public.session_bookings
  where id = p_booking_id
    and member_id = current_member_id
    and status = 'booked';

  if not found then
    raise exception 'This booking is no longer available to change.';
  end if;

  if original_session_id = p_session_id then
    raise exception 'Choose a different session date.';
  end if;

  -- Lock both sessions in a consistent order.
  -- Capacity checks and the booking changes share these locks.
  perform id
  from public.program_sessions
  where id in (original_session_id, p_session_id)
  order by id
  for update;

  select *
  into original_session
  from public.program_sessions
  where id = original_session_id;

  if not found then
    raise exception 'The original session could not be found.';
  end if;

  select *
  into replacement_session
  from public.program_sessions
  where id = p_session_id;

  if not found then
    raise exception 'The replacement session could not be found.';
  end if;

  select *
  into selected_member
  from public.members
  where id = current_member_id
  for update;

  if not found then
    raise exception 'Active member access is required.';
  end if;

  if selected_member.status <> 'active'
    or selected_member.auth_user_id is distinct from current_user_id
  then
    raise exception 'Active member access is required.';
  end if;

  select *
  into original_booking
  from public.session_bookings
  where id = p_booking_id
    and member_id = current_member_id
    and status = 'booked'
  for update;

  if not found then
    raise exception 'This booking is no longer available to change.';
  end if;

  if original_booking.session_id is distinct from original_session_id then
    raise exception 'This booking changed. Please refresh and try again.';
  end if;

  if original_session.starts_at <= clock_timestamp() then
    raise exception 'The original session has already started. Contact us to change.';
  end if;

  if replacement_session.session_number
    <> original_booking.session_number
  then
    raise exception 'Choose another date for the same session type.';
  end if;

  if replacement_session.status <> 'published' then
    raise exception 'Only published sessions can be booked.';
  end if;

  if replacement_session.starts_at <= clock_timestamp() then
    raise exception 'The replacement session has already started.';
  end if;

  select *
  into selected_entitlement
  from public.member_entitlements
  where member_id = current_member_id
    and session_number = original_booking.session_number
  for update;

  if not found then
    raise exception 'The matching session entitlement is missing.';
  end if;

  if selected_entitlement.status <> 'available' then
    raise exception 'This session entitlement is not available.';
  end if;

  select count(*)
  into occupied_places
  from public.session_bookings
  where session_id = p_session_id
    and status in ('booked', 'attended');

  if occupied_places >= replacement_session.capacity then
    raise exception 'This session is full.';
  end if;

  -- Both writes belong to this transaction.
  -- Any later failure rolls back the cancellation as well.
  update public.session_bookings
  set
    status = 'cancelled',
    updated_by = current_user_id
  where id = original_booking.id
    and member_id = current_member_id
    and status = 'booked';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'This booking is no longer available to change.';
  end if;

  insert into public.session_bookings (
    member_id,
    session_id,
    session_number,
    status,
    created_by,
    updated_by
  )
  values (
    current_member_id,
    replacement_session.id,
    original_booking.session_number,
    'booked',
    current_user_id,
    current_user_id
  )
  returning id into replacement_booking_id;

  -- The existing triggers create these records.
  -- Suppress the separate emails before anything is committed.
  update public.booking_cancellation_emails
  set
    status = 'skipped',
    accepted_at = null
  where booking_id = original_booking.id
    and status = 'pending';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Unable to prepare the booking change email.';
  end if;

  update public.booking_confirmation_emails
  set
    status = 'skipped',
    accepted_at = null
  where booking_id = replacement_booking_id
    and status = 'pending';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Unable to prepare the booking change email.';
  end if;

  insert into public.booking_changes (
    member_id,
    old_booking_id,
    new_booking_id,
    session_number,
    recipient_email,
    old_session_details,
    new_session_details,
    created_by
  )
  values (
    current_member_id,
    original_booking.id,
    replacement_booking_id,
    original_booking.session_number,
    selected_member.email,
    jsonb_build_object(
      'session_id', original_session.id,
      'starts_at', original_session.starts_at,
      'ends_at', original_session.ends_at,
      'venue_name', original_session.venue_name,
      'venue_address', original_session.venue_address
    ),
    jsonb_build_object(
      'session_id', replacement_session.id,
      'starts_at', replacement_session.starts_at,
      'ends_at', replacement_session.ends_at,
      'venue_name', replacement_session.venue_name,
      'venue_address', replacement_session.venue_address
    ),
    current_user_id
  )
  returning id into change_id;

  return change_id;
end;
$$;

revoke all
on function public.reschedule_member_booking(uuid, uuid)
from public, anon, authenticated;

grant execute
on function public.reschedule_member_booking(uuid, uuid)
to authenticated;

commit;