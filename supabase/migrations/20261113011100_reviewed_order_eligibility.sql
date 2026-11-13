begin;

create function public.gift_purchase_is_redeemable(
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
      and stripe_environment = 'sandbox'
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
      or purchase.refund_review_required
      or purchase.refunded_amount <> 0
      or new.email is distinct from purchase.purchaser_email
      or new.auth_user_id is not null
      or new.created_by is not null
    then
      raise exception 'Membership does not match the paid purchase.';
    end if;

  elsif purchase.purchase_kind = 'gift' then
    if not public.gift_purchase_is_redeemable(purchase.id)
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

create or replace function public.dispatch_purchase_hat(
  p_order_id uuid,
  p_actor_id uuid,
  p_tracking_reference text,
  p_confirm boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  tracking text := trim(coalesce(p_tracking_reference, ''));
  dispatched_time timestamptz := clock_timestamp();
begin
  if auth.role() is distinct from 'service_role'
    or p_actor_id is null
    or not exists (
      select 1
      from public.admin_users
      where user_id = p_actor_id
    )
  then
    raise exception 'Administrator access required.';
  end if;

  if p_confirm is distinct from true
    or char_length(tracking) > 200
  then
    raise exception 'Please confirm dispatch details.';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if purchase.status <> 'fulfilled'
    or purchase.refund_review_required
    or purchase.hat_status <> 'ready'
    or purchase.refunded_amount >= purchase.expected_amount
    or (
      purchase.refunded_amount > 0
      and (
        purchase.refund_resolution is distinct from 'continue_order'
        or purchase.refund_reviewed_at is null
        or purchase.refund_updated_at is null
        or purchase.refund_reviewed_at < purchase.refund_updated_at
      )
    )
  then
    raise exception 'This hat order is not ready for dispatch.';
  end if;

  if purchase.shipping_details is null
    or purchase.shipping_details #>> '{address,country}'
      is distinct from 'AU'
    or coalesce(
      char_length(trim(
        purchase.shipping_details #>> '{address,line1}'
      )),
      0
    ) = 0
  then
    raise exception 'Delivery details require review.';
  end if;

  if purchase.purchase_kind = 'gift'
    and not exists (
      select 1
      from public.program_gifts
      where order_id = purchase.id
        and status = 'redeemed'
    )
  then
    raise exception 'Gift redemption is required before dispatch.';
  end if;

  update public.purchase_orders
  set hat_status = 'dispatched',
      hat_dispatched_at = dispatched_time,
      hat_tracking_reference = nullif(tracking, '')
  where id = purchase.id;

  insert into public.purchase_order_actions (
    order_id,
    actor_id,
    action,
    details
  )
  values (
    purchase.id,
    p_actor_id,
    'hat_dispatched',
    jsonb_build_object(
      'previous_hat_status', purchase.hat_status,
      'dispatched_at', dispatched_time,
      'tracking_reference', nullif(tracking, ''),
      'refunded_amount', purchase.refunded_amount,
      'refund_resolution', purchase.refund_resolution
    )
  );

  return purchase.id;
end;
$$;

commit;