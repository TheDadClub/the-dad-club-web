begin;

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  stripe_environment text not null default 'sandbox'
    check (stripe_environment in ('sandbox', 'live')),

  package_code text not null
    check (
      package_code in (
        'before_baby',
        'after_baby',
        'hat'
      )
    ),

  purchase_kind text not null
    check (purchase_kind in ('self', 'gift', 'hat')),

  currency text not null default 'aud'
    check (currency = 'aud'),

  expected_amount integer not null,

  purchaser_name text not null
    check (
      char_length(trim(purchaser_name)) between 1 and 100
    ),

  purchaser_email text not null
    check (
      purchaser_email = lower(trim(purchaser_email))
      and char_length(purchaser_email) between 3 and 254
    ),

  -- A signed-in purchaser, if applicable.
  -- Paying does not itself verify ownership of an email.
  purchaser_auth_user_id uuid
    references auth.users(id) on delete set null,

  -- The member receiving program access.
  -- Gift purchases remain unassigned until redemption.
  member_id uuid
    references public.members(id) on delete restrict,

  stripe_price_id text not null
    check (stripe_price_id ~ '^price_[A-Za-z0-9]+$'),

  stripe_checkout_session_id text unique,

  stripe_payment_intent_id text unique,

  status text not null default 'awaiting_payment'
    check (
      status in (
        'awaiting_payment',
        'paid',
        'fulfilled',
        'review',
        'expired',
        'refunded'
      )
    ),

  paid_amount integer
    check (paid_amount >= 0),

  refunded_amount integer not null default 0
    check (refunded_amount >= 0),

  paid_at timestamptz,
  fulfilled_at timestamptz,

  -- Restricted operational information for hat delivery.
  shipping_details jsonb
    check (
      shipping_details is null
      or jsonb_typeof(shipping_details) = 'object'
    ),

  hat_status text not null default 'not_ready'
    check (
      hat_status in (
        'not_ready',
        'ready',
        'dispatched',
        'hold'
      )
    ),

  hat_dispatched_at timestamptz,

  -- Short internal code only, not raw Stripe responses.
  review_code text
    check (
      review_code is null
      or char_length(review_code) <= 100
    ),

  constraint purchase_orders_package_kind_check
    check (
      (
        package_code = 'hat'
        and purchase_kind = 'hat'
      )
      or
      (
        package_code in ('before_baby', 'after_baby')
        and purchase_kind in ('self', 'gift')
      )
    ),

  constraint purchase_orders_expected_amount_check
    check (
      (package_code = 'before_baby' and expected_amount = 24900)
      or
      (package_code = 'after_baby' and expected_amount = 17900)
      or
      (package_code = 'hat' and expected_amount = 6500)
    ),

  constraint purchase_orders_refund_limit_check
    check (
      refunded_amount = 0
      or (
        paid_amount is not null
        and refunded_amount <= paid_amount
      )
    ),

  constraint purchase_orders_paid_state_check
    check (
      status not in ('paid', 'fulfilled', 'refunded')
      or (
        paid_at is not null
        and paid_amount = expected_amount
        and stripe_checkout_session_id is not null
      )
    ),

  constraint purchase_orders_fulfilled_state_check
    check (
      status <> 'fulfilled'
      or fulfilled_at is not null
    ),

  constraint purchase_orders_dispatched_state_check
    check (
      hat_status <> 'dispatched'
      or hat_dispatched_at is not null
    ),

  constraint purchase_orders_hat_member_check
    check (
      package_code <> 'hat'
      or member_id is null
    )
);

create index purchase_orders_created_at_idx
  on public.purchase_orders (created_at desc, id desc);

create index purchase_orders_member_id_idx
  on public.purchase_orders (member_id)
  where member_id is not null;

create index purchase_orders_purchaser_email_idx
  on public.purchase_orders (purchaser_email);

create index purchase_orders_review_idx
  on public.purchase_orders (created_at)
  where status = 'review';

create table public.stripe_event_receipts (
  event_id text primary key
    check (event_id ~ '^evt_[A-Za-z0-9]+$'),

  received_at timestamptz not null default now(),

  stripe_environment text not null
    check (stripe_environment in ('sandbox', 'live')),

  event_type text not null
    check (char_length(event_type) between 1 and 150),

  stripe_object_id text not null
    check (char_length(stripe_object_id) between 1 and 255),

  order_id uuid
    references public.purchase_orders(id) on delete restrict,

  status text not null default 'pending'
    check (status in ('pending', 'processed', 'review')),

  processed_at timestamptz,

  review_code text
    check (
      review_code is null
      or char_length(review_code) <= 100
    ),

  constraint stripe_event_receipts_processed_check
    check (
      (status = 'processed') = (processed_at is not null)
    )
);

create index stripe_event_receipts_order_id_idx
  on public.stripe_event_receipts (order_id);

create index stripe_event_receipts_pending_idx
  on public.stripe_event_receipts (received_at)
  where status = 'pending';

create function public.update_purchase_order_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create trigger update_purchase_order_timestamp_before_update
before update on public.purchase_orders
for each row
execute function public.update_purchase_order_timestamp();

alter table public.purchase_orders enable row level security;
alter table public.stripe_event_receipts enable row level security;

revoke all on table public.purchase_orders
  from public, anon, authenticated;

revoke all on table public.stripe_event_receipts
  from public, anon, authenticated;

grant select, insert, update on table public.purchase_orders
  to service_role;

grant select, insert, update on table public.stripe_event_receipts
  to service_role;

revoke all on function public.update_purchase_order_timestamp()
  from public, anon, authenticated;

commit;