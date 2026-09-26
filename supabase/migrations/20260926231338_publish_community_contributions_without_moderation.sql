-- Publish submitted photos and memories immediately, without a moderation queue.
-- Photo tags, comments, and removal requests keep their existing workflows.
create or replace function public.publish_community_contribution()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status := 'approved';
  new.approved_by_admin_id := null;
  new.approved_at := now();
  return new;
end;
$$;

drop trigger if exists trg_publish_photos_immediately on public.photos;
create trigger trg_publish_photos_immediately
before insert on public.photos
for each row execute function public.publish_community_contribution();

drop trigger if exists trg_publish_memories_immediately on public.memories;
create trigger trg_publish_memories_immediately
before insert on public.memories
for each row execute function public.publish_community_contribution();

-- Keep the registered-member, validation, sanitization, and rate-limit checks.
create or replace function public.submit_memory(
  p_event_id uuid,
  p_person_id uuid,
  p_memory_text text,
  p_is_anonymous boolean default false
) returns public.memories
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.memories;
  v_memory_text text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid()) then
    raise exception 'profile_registration_required';
  end if;
  v_memory_text := public.sanitize_plain_text(p_memory_text, 420);
  if length(coalesce(v_memory_text, '')) < 10 then
    raise exception 'memory_too_short';
  end if;
  perform public.enforce_rate_limit('memory_submit', 5, 3600, auth.uid()::text);
  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'event_not_found';
  end if;
  if p_person_id is not null and not exists (select 1 from public.people where id = p_person_id and is_visible) then
    raise exception 'person_not_available';
  end if;
  insert into public.memories(event_id, user_id, person_id, author_name, memory_text, is_anonymous, status, is_featured)
  values (p_event_id, auth.uid(), p_person_id, public.content_actor_name(), v_memory_text, coalesce(p_is_anonymous, false), 'approved', false)
  returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.submit_memory(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.submit_memory(uuid, uuid, text, boolean) to authenticated;

-- Submitted polls are immediately visible and voteable. Preserve all existing safeguards.
create or replace function public.submit_poll(
  p_event_id uuid,
  p_question text,
  p_options jsonb
) returns public.polls
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll public.polls;
  v_question text;
  v_options text[];
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid()) then
    raise exception 'profile_registration_required';
  end if;
  v_question := public.sanitize_plain_text(p_question, 180);
  if length(coalesce(v_question, '')) < 8 then
    raise exception 'poll_question_too_short';
  end if;
  if coalesce(jsonb_typeof(p_options), '') <> 'array' then
    raise exception 'poll_options_invalid';
  end if;
  if jsonb_array_length(p_options) not between 2 and 8 then
    raise exception 'poll_options_invalid';
  end if;
  select array_agg(public.sanitize_plain_text(value, 100) order by ordinal)
    into v_options
    from jsonb_array_elements_text(p_options) with ordinality as option(value, ordinal);
  if coalesce(cardinality(v_options), 0) < 2 or array_position(v_options, null) is not null or exists (select 1 from unnest(v_options) as submitted_option(value) where length(btrim(value)) < 1) then
    raise exception 'poll_options_invalid';
  end if;
  if (select count(distinct lower(value)) from unnest(v_options) as submitted_option(value)) <> cardinality(v_options) then
    raise exception 'poll_options_duplicate';
  end if;
  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'event_not_found';
  end if;
  perform public.enforce_rate_limit('poll_submit', 3, 86400, auth.uid()::text);
  insert into public.polls(event_id, question, status, allow_multiple_votes)
  values (p_event_id, v_question, 'open', false)
  returning * into v_poll;
  insert into public.poll_options(poll_id, option_text, sort_order)
  select v_poll.id, option, ordinal - 1
    from unnest(v_options) with ordinality as option(option, ordinal);
  return v_poll;
end;
$$;

revoke execute on function public.submit_poll(uuid, text, jsonb) from public, anon;
grant execute on function public.submit_poll(uuid, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
