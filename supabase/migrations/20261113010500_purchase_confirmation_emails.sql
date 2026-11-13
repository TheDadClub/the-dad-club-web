begin;

create table public.purchase_confirmation_emails (
  order_id uuid primary key
    references public.purchase_orders(id)
    on delete restrict,

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
  provider_id text,

  constraint purchase_confirmation_accepted_check
    check (
      (
        status = 'accepted'
        and accepted_at is not null
        and provider_id is not null
        and char_length(provider_id) between 1 and 255
      )
      or
      (
        status <> 'accepted'
        and accepted_at is null
        and provider_id is null
      )
    )
);

alter table public.purchase_confirmation_emails
  enable row level security;

revoke all on table public.purchase_confirmation_emails
  from public, anon, authenticated;

grant select, insert, update
  on table public.purchase_confirmation_emails
  to service_role;

create function public.prepare_purchase_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'fulfilled'
    and old.status is distinct from 'fulfilled'
  then
    insert into public.purchase_confirmation_emails (
      order_id
    )
    values (new.id)
    on conflict (order_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger prepare_purchase_confirmation_email_after_update
after update of status on public.purchase_orders
for each row
execute function public.prepare_purchase_confirmation_email();

revoke all on function public.prepare_purchase_confirmation_email()
  from public, anon, authenticated;

commit;