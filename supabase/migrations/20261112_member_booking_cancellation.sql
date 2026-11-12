begin;

create or replace function public.validate_session_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_session public.program_sessions%rowtype;
  selected_member public.members%rowtype;
  selected_entitlement public.member_entitlements%rowtype;
  occupied_places integer;
  current_user_id uuid := auth.uid();
  member_request boolean :=
    coalesce(auth.role() = 'authenticated', false);
begin
  if member_request then
    if current_user_id is null
      or new.updated_by is distinct from current_user_id
    then
      raise exception 'Member sign-in required.';
    end if;

    if tg_op = 'INSERT' then
      if new.status <> 'booked'
        or new.created_by is distinct from current_user_id
      then
        raise exception 'Members can only create their own bookings.';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.status <> 'cancelled' then
        raise exception 'Members can only cancel their own bookings.';
      end if;
    else
      raise exception 'Member booking action is not permitted.';
    end if;

    if not exists (
      select 1
      from auth.users
      where id = current_user_id
        and email_confirmed_at is not null
    ) then
      raise exception 'A verified email address is required.';
    end if;
  else
    if auth.role() is not null
      and auth.role() <> 'service_role'
    then
      raise exception 'Administrator access required.';
    end if;

    if not exists (
      select 1
      from public.admin_users
      where user_id = new.updated_by
    ) then
      raise exception 'Administrator access required.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.member_id is distinct from old.member_id
      or new.session_id is distinct from old.session_id
      or new.session_number is distinct from old.session_number
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Booking details cannot be reassigned. Cancel and create a new booking.';
    end if;

    if old.status <> 'booked' then
      raise exception 'This booking is already completed or cancelled.';
    end if;

    if new.status not in ('attended', 'cancelled') then
      raise exception 'Choose attendance or cancellation.';
    end if;
  else
    if new.status <> 'booked'
      or new.created_by is distinct from new.updated_by
    then
      raise exception 'New bookings must start as booked.';
    end if;

    new.created_at := now();
  end if;

  select *
  into selected_session
  from public.program_sessions
  where id = new.session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  select *
  into selected_member
  from public.members
  where id = new.member_id
  for update;

  if not found then
    raise exception 'Member not found.';
  end if;

  if member_request then
    if selected_member.auth_user_id is distinct from current_user_id then
      raise exception 'This booking is not available to your account.';
    end if;

    if selected_member.status <> 'active' then
      raise exception 'Active member access is required.';
    end if;

    if tg_op = 'UPDATE'
      and selected_session.starts_at <= clock_timestamp()
    then
      raise exception 'This session has already started. Contact us to cancel.';
    end if;
  end if;

  if tg_op = 'INSERT' then
    new.session_number := selected_session.session_number;
  end if;

  select *
  into selected_entitlement
  from public.member_entitlements
  where member_id = new.member_id
    and session_number = new.session_number
  for update;

  if not found then
    raise exception 'The matching session entitlement is missing.';
  end if;

  if tg_op = 'INSERT' then
    if selected_member.status <> 'active' then
      raise exception 'Only active members can be booked.';
    end if;

    if selected_session.status <> 'published' then
      raise exception 'Only published sessions can be booked.';
    end if;

    if selected_session.starts_at <= now() then
      raise exception 'This session has already started.';
    end if;

    if selected_entitlement.status <> 'available' then
      raise exception 'This session entitlement is not available.';
    end if;

    if exists (
      select 1
      from public.session_bookings
      where member_id = new.member_id
        and session_number = new.session_number
        and status in ('booked', 'attended')
    ) then
      raise exception 'This member already has a booking for this session type.';
    end if;

    select count(*)
    into occupied_places
    from public.session_bookings
    where session_id = new.session_id
      and status in ('booked', 'attended');

    if occupied_places >= selected_session.capacity then
      raise exception 'This session is full.';
    end if;
  end if;

  new.updated_at := now();
  new.attended_at := null;
  new.cancelled_at := null;

  if new.status = 'attended' then
    if selected_session.starts_at > now() then
      raise exception 'Attendance can be recorded once the session starts.';
    end if;

    if selected_session.status <> 'published' then
      raise exception 'Attendance requires a published session.';
    end if;

    if selected_entitlement.status <> 'available' then
      raise exception 'This session entitlement is not available.';
    end if;

    new.attended_at := now();

    update public.member_entitlements
    set status = 'used'
    where member_id = new.member_id
      and session_number = new.session_number;
  elsif new.status = 'cancelled' then
    new.cancelled_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.cancel_member_booking(
  p_booking_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  cancelled_booking_id uuid;
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

  update public.session_bookings
  set
    status = 'cancelled',
    updated_by = current_user_id
  where id = p_booking_id
    and member_id = current_member_id
    and status = 'booked'
  returning id into cancelled_booking_id;

  if cancelled_booking_id is null then
    raise exception 'This booking is no longer available to cancel.';
  end if;

  return cancelled_booking_id;
end;
$$;

revoke all
on function public.cancel_member_booking(uuid)
from public, anon, authenticated;

grant execute
on function public.cancel_member_booking(uuid)
to authenticated;

commit;