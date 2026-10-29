begin;

create table public.booking_cancellation_emails (
  booking_id uuid primary key
    references public.session_bookings(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'accepted',
        'not_confirmed',
        'skipped'
      )
    ),

  accepted_at timestamptz,

  constraint booking_cancellation_acceptance_valid
    check (
      (
        status = 'accepted'
        and accepted_at is not null
      )
      or
      (
        status <> 'accepted'
        and accepted_at is null
      )
    )
);

alter table public.booking_cancellation_emails
  enable row level security;

revoke all privileges
  on table public.booking_cancellation_emails
  from public, anon, authenticated, service_role;

grant select
  on table public.booking_cancellation_emails
  to service_role;

grant update (status, accepted_at)
  on table public.booking_cancellation_emails
  to service_role;


-- Create the email record as part of the cancellation transaction.
-- Existing cancelled bookings are not backfilled.
create function public.track_booking_cancellation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'booked'
    and new.status = 'cancelled'
  then
    insert into public.booking_cancellation_emails (
      booking_id,
      status
    )
    values (
      new.id,
      'pending'
    )
    on conflict (booking_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all privileges
  on function public.track_booking_cancellation_email()
  from public, anon, authenticated, service_role;

create trigger track_booking_cancellation_email
after update of status
on public.session_bookings
for each row
execute function public.track_booking_cancellation_email();

comment on table public.booking_cancellation_emails is
  'Private sending outcomes for individual booking cancellation confirmations.';

commit;