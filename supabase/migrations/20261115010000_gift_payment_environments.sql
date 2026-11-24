begin;

create or replace function public.gift_purchase_is_redeemable(
  p_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      purchase_kind = 'gift'
      and stripe_environment in ('sandbox', 'live')
      and status = 'fulfilled'
      and paid_at is not null
      and paid_amount = expected_amount
      and stripe_checkout_session_id is not null
      and stripe_payment_intent_id is not null
      and not refund_review_required
      and refunded_amount < expected_amount
      and (
        refunded_amount = 0
        or (
          refund_resolution = 'continue_order'
          and refund_reviewed_at is not null
          and refund_updated_at is not null
          and refund_reviewed_at >= refund_updated_at
        )
      )
    from public.purchase_orders
    where id = p_order_id
  ), false);
$$;

revoke all on function public.gift_purchase_is_redeemable(uuid)
  from public, anon, authenticated;

grant execute on function public.gift_purchase_is_redeemable(uuid)
  to service_role;

-- Require the server to supply the expected environment.
drop function if exists public.redeem_program_gift(
  text, uuid, text, jsonb, text, timestamptz, jsonb
);

create or replace function public.redeem_program_gift(
  p_code_hash text,
  p_auth_user_id uuid,
  p_name text,
  p_shipping_details jsonb,
  p_terms_version text,
  p_terms_accepted_at timestamptz,
  p_terms_snapshot jsonb,
  p_stripe_environment text
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

  if p_stripe_environment is null
    or p_stripe_environment not in ('sandbox', 'live')
  then
    raise exception 'A valid payment environment is required.';
  end if;

  if p_code_hash is null
    or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_auth_user_id is null
    or p_name is null
    or char_length(trim(p_name)) not between 1 and 100
  then
    raise exception 'Invalid redemption details.';
  end if;

  if p_terms_version is null
    or char_length(trim(p_terms_version)) not between 1 and 64
    or p_terms_accepted_at is null
    or p_terms_accepted_at > clock_timestamp() + interval '1 minute'
    or p_terms_accepted_at < clock_timestamp() - interval '16 minutes'
    or p_terms_snapshot is null
    or jsonb_typeof(p_terms_snapshot) is distinct from 'object'
    or (p_terms_snapshot ->> 'version')
      is distinct from p_terms_version
    or jsonb_typeof(p_terms_snapshot -> 'sections')
      is distinct from 'array'
  then
    raise exception 'Valid recipient terms acceptance required.';
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

  select *
  into purchase
  from public.purchase_orders
  where id = gift.order_id
  for update;

  if not found then
    raise exception 'Gift is not available to redeem.';
  end if;

  select *
  into gift
  from public.program_gifts
  where code_hash = p_code_hash
  for update;

  if not found then
    raise exception 'Gift is not available to redeem.';
  end if;

  if purchase.stripe_environment
      is distinct from p_stripe_environment
    or not public.gift_purchase_is_redeemable(purchase.id)
    or gift.package_code is distinct from purchase.package_code
  then
    raise exception 'Gift is not available to redeem.';
  end if;

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
      -- Preserve the original acceptance on repeated requests.
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
      redeemed_member_id = new_member_id,
      recipient_terms_version = p_terms_version,
      recipient_terms_accepted_at = p_terms_accepted_at,
      recipient_terms_snapshot = p_terms_snapshot
  where id = gift.id;

  update public.purchase_orders
  set member_id = new_member_id,
      shipping_details = delivery,
      hat_status = case
        when purchase.hat_status = 'hold' then 'hold'
        else 'ready'
      end
  where id = purchase.id;

  return new_member_id;
end;
$$;

revoke all on function public.redeem_program_gift(
  text, uuid, text, jsonb, text, timestamptz, jsonb, text
) from public, anon, authenticated;

grant execute on function public.redeem_program_gift(
  text, uuid, text, jsonb, text, timestamptz, jsonb, text
) to service_role;

notify pgrst, 'reload schema';

commit;