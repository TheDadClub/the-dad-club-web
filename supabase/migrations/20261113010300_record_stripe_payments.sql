begin;

create function public.record_stripe_payment(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_price_id text,
  p_quantity integer,
  p_amount integer,
  p_currency text,
  p_livemode boolean,
  p_customer_email text,
  p_shipping_details jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  receipt public.stripe_event_receipts%rowtype;
  environment text;
  problem text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Server payment processing required.';
  end if;

  if p_event_id is null
    or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type is null
    or p_event_type not in (
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded'
    )
    or p_order_id is null
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_[A-Za-z0-9_]+$'
    or p_payment_intent_id is null
    or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
    or p_livemode is null
  then
    raise exception 'Invalid payment reference.';
  end if;

  environment := case
    when p_livemode then 'live'
    else 'sandbox'
  end;

  insert into public.stripe_event_receipts (
    event_id,
    stripe_environment,
    event_type,
    stripe_object_id
  )
  values (
    p_event_id,
    environment,
    p_event_type,
    p_checkout_session_id
  )
  on conflict (event_id) do nothing;

  select *
  into receipt
  from public.stripe_event_receipts
  where event_id = p_event_id
  for update;

  if receipt.stripe_environment is distinct from environment
    or receipt.event_type is distinct from p_event_type
    or receipt.stripe_object_id is distinct from p_checkout_session_id
    or (
      receipt.order_id is not null
      and receipt.order_id is distinct from p_order_id
    )
  then
    raise exception 'Payment notification reference mismatch.';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = p_order_id
  for update;

  if not found then
    update public.stripe_event_receipts
    set status = 'review',
        review_code = 'order_not_found'
    where event_id = p_event_id;

    return 'review';
  end if;

  if receipt.status = 'processed' then
    return purchase.status;
  end if;

  if receipt.status = 'review' then
    return 'review';
  end if;

  if purchase.stripe_environment is distinct from environment then
    problem := 'payment_environment_mismatch';

  elsif purchase.stripe_price_id is distinct from p_price_id then
    problem := 'payment_price_mismatch';

  elsif p_quantity is distinct from 1 then
    problem := 'payment_quantity_mismatch';

  elsif purchase.expected_amount is distinct from p_amount then
    problem := 'payment_amount_mismatch';

  elsif purchase.currency is distinct from p_currency then
    problem := 'payment_currency_mismatch';

  elsif lower(trim(p_customer_email))
    is distinct from purchase.purchaser_email then
    problem := 'payment_email_mismatch';

  elsif purchase.stripe_checkout_session_id is not null
    and purchase.stripe_checkout_session_id
      is distinct from p_checkout_session_id then
    problem := 'checkout_session_mismatch';

  elsif purchase.stripe_payment_intent_id is not null
    and purchase.stripe_payment_intent_id
      is distinct from p_payment_intent_id then
    problem := 'payment_intent_mismatch';

  elsif purchase.purchase_kind <> 'gift' and (
    p_shipping_details is null
    or jsonb_typeof(p_shipping_details) is distinct from 'object'
    or p_shipping_details #>> '{address,country}'
      is distinct from 'AU'
    or coalesce(
      char_length(trim(p_shipping_details ->> 'name')),
      0
    ) = 0
    or coalesce(
      char_length(trim(
        p_shipping_details #>> '{address,line1}'
      )),
      0
    ) = 0
    or coalesce(
      char_length(trim(
        p_shipping_details #>> '{address,postal_code}'
      )),
      0
    ) = 0
  ) then
    problem := 'shipping_details_missing';

  elsif purchase.status = 'review'
    and purchase.review_code
      is distinct from 'checkout_creation_unconfirmed' then
    problem := coalesce(
      purchase.review_code,
      'existing_order_review'
    );
  end if;

  if problem is not null then
    update public.stripe_event_receipts
    set order_id = purchase.id,
        status = 'review',
        review_code = problem
    where event_id = p_event_id;

    -- Do not undo an already fulfilled or refunded order.
    update public.purchase_orders
    set status = 'review',
        review_code = problem
    where id = purchase.id
      and status not in ('fulfilled', 'refunded');

    return 'review';
  end if;

  -- A later notification must not reopen a refunded order
  -- or repeat completed fulfilment.
  if purchase.status not in ('fulfilled', 'refunded') then
    update public.purchase_orders
    set status = 'paid',
        stripe_checkout_session_id = p_checkout_session_id,
        stripe_payment_intent_id = p_payment_intent_id,
        paid_amount = p_amount,
        paid_at = coalesce(paid_at, clock_timestamp()),
        shipping_details = case
          when purchase_kind = 'gift' then null
          else p_shipping_details
        end,
        review_code = null
    where id = purchase.id;

    purchase.status := 'paid';
  end if;

  update public.stripe_event_receipts
  set order_id = purchase.id,
      status = 'processed',
      processed_at = clock_timestamp(),
      review_code = null
  where event_id = p_event_id;

  return purchase.status;
end;
$$;

revoke all on function public.record_stripe_payment(
  text, text, uuid, text, text, text,
  integer, integer, text, boolean, text, jsonb
) from public, anon, authenticated;

grant execute on function public.record_stripe_payment(
  text, text, uuid, text, text, text,
  integer, integer, text, boolean, text, jsonb
) to service_role;

commit;