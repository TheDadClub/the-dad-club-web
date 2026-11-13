begin;

alter table public.members
  add column program_package text
  not null default 'before_baby'
  constraint members_program_package_check
  check (
    program_package in ('before_baby', 'after_baby')
  );

create or replace function public.create_member_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_session integer;
begin
  case new.program_package
    when 'before_baby' then
      first_session := 1;
    when 'after_baby' then
      first_session := 3;
    else
      raise exception 'Invalid program package.';
  end case;

  insert into public.member_entitlements (
    member_id,
    session_number
  )
  select new.id, session_number
  from generate_series(first_session, 5) as session_number;

  return new;
end;
$$;

commit;