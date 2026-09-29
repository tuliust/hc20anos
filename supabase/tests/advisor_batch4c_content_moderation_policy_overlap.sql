-- Final P3 content-policy contract after permissive-policy consolidation.
do $$
declare
  target_tables regclass[] := array[
    'public.photos'::regclass,
    'public.photo_comments'::regclass,
    'public.photo_tags'::regclass,
    'public.photo_likes'::regclass,
    'public.photo_removal_requests'::regclass,
    'public.memories'::regclass,
    'public.polls'::regclass,
    'public.poll_options'::regclass,
    'public.poll_votes'::regclass
  ];
begin
  if not (select bool_and(relrowsecurity) from pg_class where oid=any(target_tables)) then
    raise exception 'FAIL content_rls_must_remain_enabled';
  end if;

  if exists (
    select 1 from pg_policy
    where polrelid=any(target_tables)
      and polname in (
        'admin_panel_write','admin_panel_select','photos_owner_read','photos_moderator_write',
        'photo_comments_owner_read','photo_comments_moderator_update',
        'photo_tags_owner_read','photo_tags_moderator_write',
        'photo_likes_admin_all','photo_likes_auth_insert','photo_likes_owner_delete',
        'removal_requests_owner_read','removal_requests_moderator_write',
        'memories_owner_read','memories_moderator_update','poll_votes_auth_insert','poll_votes_owner_read'
      )
  ) then
    raise exception 'FAIL legacy_content_policy_remains';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos'
      and policyname='p3_auth_select'
      and qual ilike '%uploaded_by_user_id%auth.uid%'
      and qual ilike '%moderator%'
      and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos'
      and policyname='p3_auth_update'
      and qual ilike '%moderator%' and with_check ilike '%moderator%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_comments'
      and policyname='p3_auth_select'
      and qual ilike '%user_id%auth.uid%' and qual ilike '%moderator%' and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_tags'
      and policyname='p3_auth_select'
      and qual ilike '%created_by_user_id%auth.uid%' and qual ilike '%moderator%' and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_likes'
      and policyname='p3_auth_insert' and with_check ilike '%user_id%auth.uid%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_likes'
      and policyname='p3_auth_delete' and qual ilike '%user_id%auth.uid%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_removal_requests'
      and policyname='p3_auth_select' and qual ilike '%requester_user_id%auth.uid%' and qual ilike '%moderator%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='memories'
      and policyname='p3_auth_select' and qual ilike '%user_id%auth.uid%' and qual ilike '%moderator%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='poll_votes'
      and policyname='p3_auth_insert' and with_check ilike '%user_id%auth.uid%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='poll_votes'
      and policyname='p3_auth_select' and qual ilike '%user_id%auth.uid%'
  ) then
    raise exception 'FAIL content_owner_or_moderator_path_changed';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos'
      and policyname='photos_public_read' and roles=array['anon'::name] and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_comments'
      and policyname='photo_comments_public_read' and roles=array['anon'::name] and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_tags'
      and policyname='photo_tags_public_read' and roles=array['anon'::name] and qual ilike '%approved%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photo_likes'
      and policyname='photo_likes_public_read' and roles=array['anon'::name] and qual='true'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='polls'
      and policyname='polls_public_read' and roles=array['anon'::name] and qual ilike '%open%closed%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='poll_options'
      and policyname='poll_options_public_read' and roles=array['anon'::name] and qual ilike '%open%closed%'
  ) then
    raise exception 'FAIL intentional_public_read_path_changed';
  end if;
end;
$$;
