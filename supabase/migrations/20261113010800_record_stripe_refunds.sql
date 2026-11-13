begin;

create function public.record_stripe_refund(
  p_event_id text,
  p_event_type text,
  p_event_created bigint,
  p_order_id uuid,
  p_refund_id text,
  p_charge_id text,
  p_payment_intent_id text,
  p_charge_amount integer,
  p_amount integer,
  p_currency text,
  p_status text,
  p_livemode boolean,
  p_refund_created_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  receipt public.stripe_event_receipts%rowtype;
  previous_refund public.purchase_refunds%rowtype;
  environment text;
  refunded_total integer;
  pending_exists boolean;
  changed boolean := false;
  problem text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Server refund processing required.';
  end if;

  if p_event_id is null
    or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type is null
    or p_event_type not in (
      'refund.created',
      'refund.updated',
      'refund.failed'
    )
    or p_event_created is null
    or p_event_created <= 0
    or p_order_id is null
    or p_refund_id is null
    or p_refund_id !~ '^re_[A-Za-z0-9]+$'
    or p_charge_id is null
    or p_charge_id !~ '^ch_[A-Za-z0-9]+$'
    or p_payment_intent_id is null
    or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
    or p_livemode is null
    or p_refund_created_at is null
    or p_status is null
    or p_status not in (
      'pending', 'requires_action', 'succeeded', 'failed', 'canceled'
    )
    or p_amount is null
    or p_amount <= 0
    or p_charge_amount is null
    or p_amount > p_charge_amount
  then
    raise exception 'Invalid refund details.';
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
    p_refund_id
  )
  on conflict (event_id) do nothing;

  select *
  into receipt
  from public.stripe_event_receipts
  where event_id = p_event_id
  for update;

  if receipt.stripe_environment is distinct from environment
    or receipt.event_type is distinct from p_event_type
    or receipt.stripe_object_id is distinct from p_refund_id
    or (
      receipt.order_id is not null
      and receipt.order_id is distinct from p_order_id
    )
  then
    raise exception 'Refund notification reference mismatch.';
  end if;

  if receipt.status = 'processed' then
    return 'recorded';
  end if;

  if receipt.status = 'review' then
    return 'review';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = p_order_id
  for update;

  if not found then
    update public.stripe_event_receipts
    set status = 'review',
        review_code = 'refund_order_not_found'
    where event_id = p_event_id;

    return 'review';
  end if;

  if purchase.stripe_environment is distinct from environment then
    problem := 'refund_environment_mismatch';

  elsif purchase.currency is distinct from p_currency then
    problem := 'refund_currency_mismatch';

  elsif purchase.expected_amount is distinct from p_charge_amount then
    problem := 'refund_original_amount_mismatch';

  elsif purchase.stripe_payment_intent_id is not null
    and purchase.stripe_payment_intent_id
      is distinct from p_payment_intent_id then
    problem := 'refund_payment_mismatch';
  end if;

  if problem is not null then
    update public.stripe_event_receipts
    set order_id = purchase.id,
        status = 'review',
        review_code = problem
    where event_id = p_event_id;

    return 'review';
  end if;

  select *
  into previous_refund
  from public.purchase_refunds
  where stripe_refund_id = p_refund_id
  for update;

  if not found then
    insert into public.purchase_refunds (
      stripe_refund_id,
      order_id,
      stripe_charge_id,
      stripe_payment_intent_id,
      stripe_environment,
      amount,
      currency,
      status,
      stripe_created_at,
      last_event_created,
      last_event_id
    )
    values (
      p_refund_id,
      purchase.id,
      p_charge_id,
      p_payment_intent_id,
      environment,
      p_amount,
      p_currency,
      p_status,
      p_refund_created_at,
      p_event_created,
      p_event_id
    );

    changed := true;

  else
    if previous_refund.order_id is distinct from purchase.id
      or previous_refund.stripe_charge_id is distinct from p_charge_id
      or previous_refund.stripe_payment_intent_id
        is distinct from p_payment_intent_id
      or previous_refund.amount is distinct from p_amount
      or previous_refund.currency is distinct from p_currency
      or previous_refund.stripe_environment is distinct from environment
    then
      raise exception 'Refund record reference mismatch.';
    end if;

    -- Do not let older notifications or stale pending
    -- snapshots overwrite a completed refund state.
    if p_event_created >= previous_refund.last_event_created
      and not (
        previous_refund.status in ('failed', 'canceled')
        and p_status not in ('failed', 'canceled')
      )
      and not (
        previous_refund.status = 'succeeded'
        and p_status in ('pending', 'requires_action')
      )
    then
      changed := previous_refund.status is distinct from p_status;

      update public.purchase_refunds
      set status = p_status,
          updated_at = clock_timestamp(),
          last_event_created = p_event_created,
          last_event_id = p_event_id
      where stripe_refund_id = p_refund_id;
    end if;
  end if;

  select coalesce(sum(amount), 0)::integer
  into refunded_total
  from public.purchase_refunds
  where order_id = purchase.id
    and status = 'succeeded';

  if refunded_total > purchase.expected_amount then
    raise exception 'Refund total exceeds the purchase amount.';
  end if;

  select exists (
    select 1
    from public.purchase_refunds
    where order_id = purchase.id
      and status in ('pending', 'requires_action')
  )
  into pending_exists;

  if changed
    or purchase.refunded_amount is distinct from refunded_total
  then
    update public.purchase_orders
    set status = 'review',
        stripe_payment_intent_id = p_payment_intent_id,
        paid_amount = coalesce(paid_amount, p_charge_amount),
        paid_at = coalesce(paid_at, clock_timestamp()),
        refunded_amount = refunded_total,
        refund_review_required = true,
        refund_updated_at = clock_timestamp(),
        hat_status = case
          when hat_status = 'dispatched' then 'dispatched'
          else 'hold'
        end,
        review_code = case
          when pending_exists then 'refund_pending_check_order'
          when refunded_total = expected_amount
            then 'full_refund_check_access_and_delivery'
          when refunded_total > 0
            then 'partial_refund_check_access_and_delivery'
          else 'refund_failed_or_cancelled_check_order'
        end
    where id = purchase.id;

    -- Stop an unused, fully refunded gift being redeemed.
    if refunded_total = purchase.expected_amount then
      update public.program_gifts
      set status = 'void'
      where order_id = purchase.id
        and status = 'available';
    end if;

    -- Do not send an initial purchase certificate after
    -- a refund has already placed the order under review.
    update public.purchase_confirmation_emails
    set status = 'skipped',
        accepted_at = null,
        provider_id = null
    where order_id = purchase.id
      and status = 'pending';
  end if;

  update public.stripe_event_receipts
  set order_id = purchase.id,
      status = 'processed',
      processed_at = clock_timestamp(),
      review_code = null
  where event_id = p_event_id;

  return 'recorded';
end;
$$;

revoke all on function public.record_stripe_refund(
  text, text, bigint, uuid, text, text, text,
  integer, integer, text, text, boolean, timestamptz
) from public, anon, authenticated;

grant execute on function public.record_stripe_refund(
  text, text, bigint, uuid, text, text, text,
  integer, integer, text, text, boolean, timestamptz
) to service_role;

commit;