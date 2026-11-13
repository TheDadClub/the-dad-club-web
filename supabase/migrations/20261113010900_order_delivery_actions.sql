begin;

alter table public.purchase_orders
  add column hat_tracking_reference text
    check (
      hat_tracking_reference is null
      or char_length(hat_tracking_reference) <= 200
    );

create table public.purchase_order_actions (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.purchase_orders(id)
    on delete restrict,

  actor_id uuid not null
    references auth.users(id)
    on delete restrict,

  action text not null
    check (
      action in (
        'hat_dispatched',
        'refund_review_recorded'
      )
    ),

  created_at timestamptz not null default now(),

  notes text not null default ''
    check (char_length(notes) <= 2000),

  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object')
);

create index purchase_order_actions_order_idx
  on public.purchase_order_actions (
    order_id,
    created_at desc
  );

alter table public.purchase_order_actions
  enable row level security;

revoke all on table public.purchase_order_actions
  from public, anon, authenticated;

grant select, insert on table public.purchase_order_actions
  to service_role;

create function public.dispatch_purchase_hat(
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
    or purchase.refunded_amount <> 0
    or purchase.hat_status <> 'ready'
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
      'tracking_reference', nullif(tracking, '')
    )
  );

  return purchase.id;
end;
$$;

revoke all on function public.dispatch_purchase_hat(
  uuid, uuid, text, boolean
) from public, anon, authenticated;

grant execute on function public.dispatch_purchase_hat(
  uuid, uuid, text, boolean
) to service_role;

commit;