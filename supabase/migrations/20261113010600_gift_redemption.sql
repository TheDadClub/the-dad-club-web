begin;

create or replace function public.validate_member_purchase_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  verified_email text;
begin
  if new.purchase_order_id is null then
    return new;
  end if;

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

  if purchase.paid_at is null
    or purchase.paid_amount is distinct from purchase.expected_amount
    or purchase.refunded_amount <> 0
    or purchase.stripe_checkout_session_id is null
    or purchase.stripe_payment_intent_id is null
    or purchase.member_id is not null
    or new.program_package is distinct from purchase.package_code
    or new.status <> 'active'
  then
    raise exception 'Purchase is not available for membership creation.';
  end if;

  if purchase.purchase_kind = 'self' then
    if purchase.status <> 'paid'
      or new.email is distinct from purchase.purchaser_email
      or new.auth_user_id is not null
      or new.created_by is not null
    then
      raise exception 'Membership does not match the paid purchase.';
    end if;

  elsif purchase.purchase_kind = 'gift' then
    if purchase.status <> 'fulfilled'
      or new.auth_user_id is null
      or new.created_by is distinct from new.auth_user_id
    then
      raise exception 'Verified gift redemption required.';
    end if;

    select lower(trim(email))
    into verified_email
    from auth.users
    where id = new.auth_user_id
      and email_confirmed_at is not null;

    if verified_email is null
      or new.email is distinct from verified_email
      or not exists (
        select 1
        from public.program_gifts
        where order_id = purchase.id
          and status = 'available'
          and package_code = purchase.package_code
      )
    then
      raise exception 'Membership does not match the gift redemption.';
    end if;

  else
    raise exception 'This purchase does not include membership.';
  end if;

  return new;
end;
$$;

create function public.redeem_program_gift(
  p_code_hash text,
  p_auth_user_id uuid,
  p_name text,
  p_shipping_details jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gift public.program_gifts%rowtype;
  purchase public.purchase_orders%rowtype;
  verified_email text;
  new_member_id uuid;
  existing_members integer;
  delivery jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Server gift redemption required.';
  end if;

  if p_code_hash is null
    or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_auth_user_id is null
    or p_name is null
    or char_length(trim(p_name)) not between 1 and 100
  then
    raise exception 'Invalid redemption details.';
  end if;

  select lower(trim(email))
  into verified_email
  from auth.users
  where id = p_auth_user_id
    and email_confirmed_at is not null;

  if verified_email is null then
    raise exception 'A verified email address is required.';
  end if;

  select *
  into gift
  from public.program_gifts
  where code_hash = p_code_hash;

  if not found then
    raise exception 'Gift is not available to redeem.';
  end if;

  -- Use the same order-first locking sequence as fulfilment.
  select *
  into purchase
  from public.purchase_orders
  where id = gift.order_id
  for update;

  select *
  into gift
  from public.program_gifts
  where code_hash = p_code_hash
  for update;

  if purchase.status <> 'fulfilled'
    or purchase.purchase_kind <> 'gift'
    or purchase.stripe_environment <> 'sandbox'
    or purchase.refunded_amount <> 0
    or purchase.paid_at is null
    or purchase.paid_amount is distinct from purchase.expected_amount
    or gift.package_code is distinct from purchase.package_code
  then
    raise exception 'Gift is not available to redeem.';
  end if;

  -- Retrying a completed redemption by the same verified
  -- account returns its membership without granting access again.
  if gift.status = 'redeemed' then
    if gift.redeemed_by = p_auth_user_id
      and exists (
        select 1
        from public.members
        where id = gift.redeemed_member_id
          and auth_user_id = p_auth_user_id
          and status = 'active'
      )
    then
      return gift.redeemed_member_id;
    end if;

    raise exception 'Gift is not available to redeem.';
  end if;

  if gift.status <> 'available'
    or purchase.member_id is not null
  then
    raise exception 'Gift is not available to redeem.';
  end if;

  if p_shipping_details is null
    or jsonb_typeof(p_shipping_details) is distinct from 'object'
    or p_shipping_details #>> '{address,country}'
      is distinct from 'AU'
    or coalesce(
      char_length(trim(p_shipping_details ->> 'name')), 0
    ) not between 1 and 200
    or coalesce(
      char_length(trim(p_shipping_details #>> '{address,line1}')), 0
    ) not between 1 and 200
    or coalesce(
      char_length(p_shipping_details #>> '{address,line2}'), 0
    ) > 200
    or coalesce(
      char_length(trim(p_shipping_details #>> '{address,city}')), 0
    ) not between 1 and 100
    or coalesce(
      p_shipping_details #>> '{address,state}', ''
    ) not in ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')
    or coalesce(
      p_shipping_details #>> '{address,postal_code}', ''
    ) !~ '^[0-9]{4}$'
  then
    raise exception 'A valid Australian delivery address is required.';
  end if;

  delivery := jsonb_build_object(
    'name', trim(p_shipping_details ->> 'name'),
    'address', jsonb_build_object(
      'line1', trim(p_shipping_details #>> '{address,line1}'),
      'line2', trim(coalesce(
        p_shipping_details #>> '{address,line2}', ''
      )),
      'city', trim(p_shipping_details #>> '{address,city}'),
      'state', p_shipping_details #>> '{address,state}',
      'postal_code', p_shipping_details #>> '{address,postal_code}',
      'country', 'AU'
    )
  );

  perform pg_advisory_xact_lock(
    hashtextextended(verified_email, 0)
  );

  select count(*)
  into existing_members
  from public.members
  where email = verified_email
    or auth_user_id = p_auth_user_id;

  if existing_members > 0 then
    -- Preserve the gift and any existing membership.
    raise exception 'Existing membership requires assistance.';
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
    trim(p_name),
    verified_email,
    'active',
    gift.package_code,
    purchase.id,
    p_auth_user_id,
    p_auth_user_id
  )
  returning id into new_member_id;

  select count(*)
  into existing_members
  from public.members
  where email = verified_email;

  if existing_members <> 1 then
    raise exception 'Membership email requires review.';
  end if;

  update public.program_gifts
  set status = 'redeemed',
      redeemed_at = clock_timestamp(),
      redeemed_by = p_auth_user_id,
      redeemed_member_id = new_member_id
  where id = gift.id;

  update public.purchase_orders
  set member_id = new_member_id,
      shipping_details = delivery,
      hat_status = 'ready'
  where id = purchase.id;

  return new_member_id;
end;
$$;

revoke all on function public.redeem_program_gift(
  text, uuid, text, jsonb
) from public, anon, authenticated;

grant execute on function public.redeem_program_gift(
  text, uuid, text, jsonb
) to service_role;

commit;