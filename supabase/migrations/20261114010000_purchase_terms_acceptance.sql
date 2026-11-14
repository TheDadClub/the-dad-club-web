begin;

alter table public.purchase_orders
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_snapshot jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.purchase_orders'::regclass
      and conname = 'purchase_orders_terms_acceptance_check'
  ) then
    alter table public.purchase_orders
      add constraint purchase_orders_terms_acceptance_check
      check (
        (
          terms_version is null
          and terms_accepted_at is null
          and terms_snapshot is null
        )
        or
        (
          terms_version is not null
          and length(trim(terms_version)) between 1 and 64
          and terms_accepted_at is not null
          and terms_snapshot is not null
          and jsonb_typeof(terms_snapshot) = 'object'
          and coalesce(
            terms_snapshot ->> 'version' = terms_version,
            false
          )
          and coalesce(
            jsonb_typeof(
              terms_snapshot -> 'sections'
            ) = 'array',
            false
          )
        )
      );
  end if;
end;
$$;

comment on column public.purchase_orders.terms_version is
  'Terms version accepted when starting checkout. Null for older orders without recorded acceptance.';

comment on column public.purchase_orders.terms_accepted_at is
  'Server-recorded time of the accepted checkout submission, not payment completion.';

comment on column public.purchase_orders.terms_snapshot is
  'Copy of the terms presented for this purchase, including version and sections.';

commit;