begin;

create table public.program_gifts (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null unique
    references public.purchase_orders(id)
    on delete restrict,

  package_code text not null
    check (
      package_code in ('before_baby', 'after_baby')
    ),

  -- Store a fingerprint, not the redeemable code itself.
  code_hash text not null unique
    check (code_hash ~ '^[a-f0-9]{64}$'),

  status text not null default 'available'
    check (status in ('available', 'redeemed', 'void')),

  created_at timestamptz not null default now(),

  redeemed_at timestamptz,

  redeemed_by uuid
    references auth.users(id)
    on delete restrict,

  redeemed_member_id uuid
    references public.members(id)
    on delete restrict,

  constraint program_gifts_redemption_check
    check (
      (
        status = 'redeemed'
        and redeemed_at is not null
        and redeemed_by is not null
        and redeemed_member_id is not null
      )
      or
      (
        status in ('available', 'void')
        and redeemed_at is null
        and redeemed_by is null
        and redeemed_member_id is null
      )
    )
);

alter table public.program_gifts enable row level security;

revoke all on table public.program_gifts
  from public, anon, authenticated;

grant select, insert, update on table public.program_gifts
  to service_role;

create function public.fulfil_paid_purchase(
  p_order_id uuid,
  p_gift_code_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  new_member_id uuid;
  new_gift_id uuid;
  existing_members integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Server purchase processing required.';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Purchase order not found.';
  end if;

  -- Repeated notifications must not create another
  -- membership, gift or hat order.
  if purchase.status = 'fulfilled' then
    select id
    into new_gift_id
    from public.program_gifts
    where order_id = purchase.id;

    return jsonb_build_object(
      'status', 'fulfilled',
      'member_id', purchase.member_id,
      'gift_id', new_gift_id,
      'purchase_kind', purchase.purchase_kind
    );
  end if;

  if purchase.status <> 'paid' then
    return jsonb_build_object(
      'status', purchase.status
    );
  end if;

  if purchase.paid_at is null
    or purchase.paid_amount is distinct from purchase.expected_amount
    or purchase.stripe_checkout_session_id is null
    or purchase.stripe_payment_intent_id is null
    or purchase.currency <> 'aud'
  then
    raise exception 'Verified payment is required.';
  end if;

  if purchase.refunded_amount > 0 then
    update public.purchase_orders
    set status = 'review',
        review_code = 'refund_before_fulfilment',
        hat_status = 'hold'
    where id = purchase.id;

    return jsonb_build_object('status', 'review');
  end if;

  if purchase.purchase_kind = 'self' then
    -- Serialise program purchases for the same email.
    perform pg_advisory_xact_lock(
      hashtextextended(purchase.purchaser_email, 0)
    );

    select count(*)
    into existing_members
    from public.members
    where email = purchase.purchaser_email;

    if existing_members > 0 then
      update public.purchase_orders
      set status = 'review',
          review_code = 'existing_membership',
          hat_status = 'hold'
      where id = purchase.id;

      return jsonb_build_object('status', 'review');
    end if;

    insert into public.members (
      name,
      email,
      status,
      program_package,
      purchase_order_id,
      created_by,
      auth_user_id
    )
    values (
      purchase.purchaser_name,
      purchase.purchaser_email,
      'active',
      purchase.package_code,
      purchase.id,
      null,
      null
    )
    returning id into new_member_id;

    -- Do not allow an ambiguous email match if a separate
    -- administrator action created a member concurrently.
    select count(*)
    into existing_members
    from public.members
    where email = purchase.purchaser_email;

    if existing_members <> 1 then
      raise exception 'Membership email requires review.';
    end if;

    -- The existing member trigger creates the package's
    -- entitlements within this same transaction.
    update public.purchase_orders
    set member_id = new_member_id,
        status = 'fulfilled',
        fulfilled_at = clock_timestamp(),
        hat_status = 'ready',
        review_code = null
    where id = purchase.id;

  elsif purchase.purchase_kind = 'gift' then
    if p_gift_code_hash is null
      or p_gift_code_hash !~ '^[a-f0-9]{64}$'
    then
      raise exception 'A valid gift code fingerprint is required.';
    end if;

    insert into public.program_gifts (
      order_id,
      package_code,
      code_hash
    )
    values (
      purchase.id,
      purchase.package_code,
      p_gift_code_hash
    )
    returning id into new_gift_id;

    -- The recipient supplies delivery details at redemption.
    -- No membership or hat dispatch is created here.
    update public.purchase_orders
    set status = 'fulfilled',
        fulfilled_at = clock_timestamp(),
        review_code = null
    where id = purchase.id;

  elsif purchase.purchase_kind = 'hat' then
    update public.purchase_orders
    set status = 'fulfilled',
        fulfilled_at = clock_timestamp(),
        hat_status = 'ready',
        review_code = null
    where id = purchase.id;

  else
    raise exception 'Invalid purchase type.';
  end if;

  return jsonb_build_object(
    'status', 'fulfilled',
    'member_id', new_member_id,
    'gift_id', new_gift_id,
    'purchase_kind', purchase.purchase_kind
  );
end;
$$;

revoke all on function public.fulfil_paid_purchase(uuid, text)
  from public, anon, authenticated;

grant execute on function public.fulfil_paid_purchase(uuid, text)
  to service_role;

commit;