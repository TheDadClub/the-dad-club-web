begin;

alter table public.purchase_orders
  add column refund_resolution text
    check (
      refund_resolution is null
      or refund_resolution in ('continue_order', 'close_order')
    ),
  add column refund_reviewed_at timestamptz,
  add column refund_reviewed_by uuid
    references auth.users(id)
    on delete restrict;

create function public.review_purchase_refund(
  p_order_id uuid,
  p_actor_id uuid,
  p_expected_refund_at timestamptz,
  p_resolution text,
  p_access_decision text,
  p_hat_decision text,
  p_notes text,
  p_confirm boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.purchase_orders%rowtype;
  member_status text;
  gift_status text;
  review_time timestamptz := clock_timestamp();
  notes text := trim(coalesce(p_notes, ''));
  next_hat_status text;
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
    or char_length(notes) not between 10 and 2000
    or p_resolution is null
    or p_resolution not in ('continue_order', 'close_order')
    or p_access_decision is null
    or p_access_decision not in (
      'retain', 'removed_manually', 'not_applicable'
    )
    or p_hat_decision is null
    or p_hat_decision not in ('hold', 'release')
  then
    raise exception 'Please complete the review details.';
  end if;

  select *
  into purchase
  from public.purchase_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if purchase.status <> 'review'
    or not purchase.refund_review_required
    or purchase.refund_updated_at
      is distinct from p_expected_refund_at
  then
    raise exception 'The refund record has changed. Refresh before reviewing.';
  end if;

  if exists (
    select 1
    from public.purchase_refunds
    where order_id = purchase.id
      and status in ('pending', 'requires_action')
  ) then
    raise exception 'Wait until the pending refund is resolved.';
  end if;

  if purchase.paid_amount is null
    or purchase.paid_at is null
  then
    raise exception 'Payment details require further review.';
  end if;

  if p_resolution = 'close_order' then
    if purchase.refunded_amount <> purchase.paid_amount
      or p_hat_decision <> 'hold'
    then
      raise exception 'Closing requires a full refund and no further hat dispatch.';
    end if;

  else
    if purchase.refunded_amount >= purchase.paid_amount then
      raise exception 'A fully refunded order cannot continue.';
    end if;

    if purchase.fulfilled_at is null then
      raise exception 'This order needs fulfilment assistance before it can continue.';
    end if;
  end if;

  if purchase.member_id is null then
    if p_access_decision <> 'not_applicable' then
      raise exception 'There is no linked membership to review.';
    end if;

  else
    select status
    into member_status
    from public.members
    where id = purchase.member_id
    for update;

    if p_access_decision = 'removed_manually' then
      if member_status is distinct from 'archived'
        or exists (
          select 1
          from public.session_bookings
          where member_id = purchase.member_id
            and status = 'booked'
        )
      then
        raise exception 'Archive the member and review active bookings before recording access as removed.';
      end if;

    elsif p_access_decision = 'retain' then
      if member_status is distinct from 'active' then
        raise exception 'The linked membership is not active.';
      end if;

    else
      raise exception 'Record the linked membership decision.';
    end if;
  end if;

  if purchase.purchase_kind = 'gift' then
    select status
    into gift_status
    from public.program_gifts
    where order_id = purchase.id
    for update;

    if gift_status is null then
      raise exception 'Gift details require further review.';
    end if;
  end if;

  if purchase.hat_status = 'dispatched' then
    next_hat_status := 'dispatched';

  elsif p_resolution = 'close_order'
    or p_hat_decision = 'hold' then
    next_hat_status := 'hold';

  elsif purchase.purchase_kind = 'gift'
    and gift_status <> 'redeemed' then
    next_hat_status := 'not_ready';

  else
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

    next_hat_status := 'ready';
  end if;

  if purchase.purchase_kind = 'gift' then
    if p_resolution = 'close_order' then
      update public.program_gifts
      set status = 'void'
      where order_id = purchase.id
        and status = 'available';

    else
      -- Explicit approval can restore an unused gift
      -- after a failed or reversed refund.
      update public.program_gifts
      set status = 'available'
      where order_id = purchase.id
        and status = 'void';
    end if;
  end if;

  update public.purchase_orders
  set status = case
        when p_resolution = 'close_order' then 'refunded'
        else 'fulfilled'
      end,
      refund_review_required = false,
      refund_resolution = p_resolution,
      refund_reviewed_at = review_time,
      refund_reviewed_by = p_actor_id,
      hat_status = next_hat_status,
      review_code = null
  where id = purchase.id;

  insert into public.purchase_order_actions (
    order_id,
    actor_id,
    action,
    notes,
    details
  )
  values (
    purchase.id,
    p_actor_id,
    'refund_review_recorded',
    notes,
    jsonb_build_object(
      'resolution', p_resolution,
      'access_decision', p_access_decision,
      'hat_decision', p_hat_decision,
      'previous_hat_status', purchase.hat_status,
      'new_hat_status', next_hat_status,
      'refunded_amount', purchase.refunded_amount,
      'refund_snapshot_at', purchase.refund_updated_at,
      'reviewed_at', review_time
    )
  );

  return purchase.id;
end;
$$;

revoke all on function public.review_purchase_refund(
  uuid, uuid, timestamptz, text, text, text, text, boolean
) from public, anon, authenticated;

grant execute on function public.review_purchase_refund(
  uuid, uuid, timestamptz, text, text, text, text, boolean
) to service_role;

commit;