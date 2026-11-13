begin;

alter table public.purchase_orders
  add column refund_review_required boolean
    not null default false,
  add column refund_updated_at timestamptz;

create table public.purchase_refunds (
  stripe_refund_id text primary key
    check (stripe_refund_id ~ '^re_[A-Za-z0-9]+$'),

  order_id uuid not null
    references public.purchase_orders(id)
    on delete restrict,

  stripe_charge_id text not null
    check (stripe_charge_id ~ '^ch_[A-Za-z0-9]+$'),

  stripe_payment_intent_id text not null
    check (stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$'),

  stripe_environment text not null
    check (stripe_environment in ('sandbox', 'live')),

  amount integer not null check (amount > 0),

  currency text not null default 'aud'
    check (currency = 'aud'),

  status text not null
    check (
      status in (
        'pending',
        'requires_action',
        'succeeded',
        'failed',
        'canceled'
      )
    ),

  stripe_created_at timestamptz not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  last_event_created bigint not null
    check (last_event_created > 0),

  last_event_id text not null
    references public.stripe_event_receipts(event_id)
    on delete restrict
);

create index purchase_refunds_order_id_idx
  on public.purchase_refunds (order_id);

alter table public.purchase_refunds
  enable row level security;

revoke all on table public.purchase_refunds
  from public, anon, authenticated;

grant select, insert, update on table public.purchase_refunds
  to service_role;

commit;