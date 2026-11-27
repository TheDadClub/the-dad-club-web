
begin;

create function public.record_outreach_communication(
  p_lease_token uuid,
  p_contact_type text,
  p_contact_id uuid,
  p_direction text,
  p_provider_message_id text,
  p_internet_message_id text,
  p_conversation_id text,
  p_subject text,
  p_contact_email text,
  p_occurred_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_settings public.outreach_sync_settings%rowtype;
  v_contact_email text;
  v_inserted integer;
  v_email text := lower(trim(p_contact_email));

begin

  -- Lock the settings row and validate lease ownership.
  select *
  into v_settings
  from public.outreach_sync_settings
  where id = 1
  for update;

  if not found
    or v_settings.enabled is not true
    or p_lease_token is null
    or v_settings.lease_token is distinct from p_lease_token
    or v_settings.lease_expires_at is null
    or v_settings.lease_expires_at <= clock_timestamp()
  then
    raise exception 'Outreach synchronisation lease is invalid.';
  end if;

  -- Validate the communication.
  if p_contact_type is null
    or p_contact_type not in ('healthcare', 'venue')
    or p_contact_id is null
  then
    raise exception 'Invalid outreach contact.';
  end if;

  if p_direction is null
    or p_direction not in ('outbound', 'inbound')
  then
    raise exception 'Invalid communication direction.';
  end if;

  if p_provider_message_id is null
    or char_length(trim(p_provider_message_id))
      not between 1 and 2048
  then
    raise exception 'Invalid provider message identifier.';
  end if;

  if v_email is null
    or char_length(v_email) not between 3 and 254
    or position('@' in v_email) <= 1
  then
    raise exception 'Invalid contact email.';
  end if;

  if p_occurred_at is null
    or p_occurred_at < v_settings.sync_from_at
    or p_occurred_at > clock_timestamp() + interval '5 minutes'
  then
    raise exception 'Invalid communication timestamp.';
  end if;

  -- Verify and lock the relevant contact.
  if p_contact_type = 'healthcare' then

    select lower(trim(email))
    into v_contact_email
    from public.healthcare_referrals
    where id = p_contact_id
    for update;

  else

    select lower(trim(email))
    into v_contact_email
    from public.venue_outreach_contacts
    where id = p_contact_id
    for update;

  end if;

  if not found
    or v_contact_email is distinct from v_email
  then
    raise exception 'Outreach contact email mismatch.';
  end if;

  -- Incoming correspondence must belong to a
  -- previously recorded outbound conversation.
  if p_direction = 'inbound' then

    if p_conversation_id is null
      or not exists (
        select 1
        from public.outreach_communications c
        where c.mailbox_email = v_settings.mailbox_email
          and c.direction = 'outbound'
          and c.conversation_id = p_conversation_id
          and c.contact_email = v_email
          and c.occurred_at <= p_occurred_at
          and (
            (
              p_contact_type = 'healthcare'
              and c.healthcare_referral_id = p_contact_id
            )
            or
            (
              p_contact_type = 'venue'
              and c.venue_outreach_contact_id = p_contact_id
            )
          )
      )
    then
      raise exception 'No matching outbound conversation.';
    end if;

  end if;

  -- Record the communication.
  insert into public.outreach_communications (
    healthcare_referral_id,
    venue_outreach_contact_id,
    mailbox_email,
    direction,
    provider,
    provider_message_id,
    internet_message_id,
    conversation_id,
    subject,
    contact_email,
    occurred_at
  )
  values (
    case
      when p_contact_type = 'healthcare'
        then p_contact_id
      else null
    end,
    case
      when p_contact_type = 'venue'
        then p_contact_id
      else null
    end,
    v_settings.mailbox_email,
    p_direction,
    'microsoft_graph',
    p_provider_message_id,
    p_internet_message_id,
    p_conversation_id,
    left(p_subject, 500),
    v_email,
    p_occurred_at
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  -- Duplicate messages must not modify the contact.
  if v_inserted = 0 then
    return false;
  end if;

  -- Update the healthcare contact.
  if p_contact_type = 'healthcare' then

    update public.healthcare_referrals
    set
      last_contacted_at = case
        when p_direction = 'outbound'
          then greatest(last_contacted_at, p_occurred_at)
        else last_contacted_at
      end,

      last_response_at = case
        when p_direction = 'inbound'
          then greatest(last_response_at, p_occurred_at)
        else last_response_at
      end,

      status = case
        when p_direction = 'outbound'
          and status = 'Not contacted'
          then 'Emailed'

        when p_direction = 'inbound'
          and status in ('Not contacted', 'Emailed')
          then 'Responded'

        else status
      end,

      updated_at = clock_timestamp()

    where id = p_contact_id;

  else

    -- Update the venue outreach contact.
    update public.venue_outreach_contacts
    set
      last_contacted_at = case
        when p_direction = 'outbound'
          then greatest(last_contacted_at, p_occurred_at)
        else last_contacted_at
      end,

      last_response_at = case
        when p_direction = 'inbound'
          then greatest(last_response_at, p_occurred_at)
        else last_response_at
      end,

      status = case
        when p_direction = 'outbound'
          and status = 'Not contacted'
          then 'Emailed'

        when p_direction = 'inbound'
          and status in ('Not contacted', 'Emailed')
          then 'Responded'

        else status
      end,

      updated_at = clock_timestamp()

    where id = p_contact_id;

  end if;

  return true;

end;
$$;

revoke all
  on function public.record_outreach_communication(
    uuid, text, uuid, text, text,
    text, text, text, text, timestamptz
  )
  from public, anon, authenticated, service_role;

grant execute
  on function public.record_outreach_communication(
    uuid, text, uuid, text, text,
    text, text, text, text, timestamptz
  )
  to service_role;

commit;
