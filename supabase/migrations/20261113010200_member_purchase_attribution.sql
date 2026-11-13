begin;

alter table public.members
  add column purchase_order_id uuid
  unique
  references public.purchase_orders(id)
  on delete restrict;

alter table public.members
  alter column created_by drop not null;

alter table public.members
  add constraint members_creation_source_check
  check (
    created_by is not null
    or purchase_order_id is not null
  );

create function public.validate_member_purchase_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
begin
  -- Existing administrator-created memberships
  -- continue using their administrator reference.
  if new.purchase_order_id is null then
    return new;
  end if;

  -- Only our server can create purchased memberships.
  if auth.role() is distinct from 'service_role' then
    raise exception 'Server payment processing required.';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = new.purchase_order_id
  for update;

  if not found then
    raise exception 'Purchase order not found.';
  end if;

  if purchase.status <> 'paid'
    or purchase.purchase_kind <> 'self'
    or purchase.package_code not in ('before_baby', 'after_baby')
    or purchase.paid_at is null
    or purchase.paid_amount is distinct from purchase.expected_amount
    or purchase.stripe_checkout_session_id is null
    or purchase.member_id is not null
  then
    raise exception 'Purchase is not available for membership creation.';
  end if;

  if new.email is distinct from purchase.purchaser_email
    or new.program_package is distinct from purchase.package_code
    or new.status <> 'active'
    or new.auth_user_id is not null
    or new.created_by is not null
  then
    raise exception 'Membership does not match the paid purchase.';
  end if;

  return new;
end;
$$;

create trigger validate_member_purchase_source_before_insert
before insert on public.members
for each row
execute function public.validate_member_purchase_source();

revoke all on function public.validate_member_purchase_source()
  from public, anon, authenticated;

commit;