-- Run after the 4C migration. Verifies only exact duplicate admin paths were
-- removed, while public, owner, contributor, moderator, and admin paths remain.
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
  if not (select bool_and(relrowsecurity) from pg_class where oid = any(target_tables)) then
    raise exception 'FAIL content_rls_must_remain_enabled';
  end if;

  if exists (
    select 1 from pg_policy
    where polrelid = any(target_tables)
      and polname in (
        'admin_panel_select', 'photos_admin_read', 'photo_comments_admin_delete',
        'photo_tags_admin_read', 'removal_requests_admin_read', 'memories_admin_delete',
        'polls_admin_all', 'poll_options_admin_all', 'poll_votes_admin_read'
      )
  ) then raise exception 'FAIL_duplicate_content_admin_policy_remains'; end if;

  -- Admin management stays available through the existing ALL policy. Likes
  -- use their existing admin ALL policy because no admin_panel_write existed.
  if (select count(*) from pg_policy where polrelid = any(target_tables)
      and polname = 'admin_panel_write' and polcmd = '*') <> 8
     or not exists (select 1 from pg_policy where polrelid='public.photo_likes'::regclass
       and polname='photo_likes_admin_all' and polcmd='*'
       and pg_get_expr(polqual,polrelid) ilike '%is_admin%'
       and pg_get_expr(polwithcheck,polrelid) ilike '%is_admin%') then
    raise exception 'FAIL content_admin_all_paths_changed';
  end if;

  -- Keep owner/author, contributor, and moderation routes with their original
  -- commands and row checks (including UPDATE USING + WITH CHECK).
  if not exists (select 1 from pg_policy where polrelid='public.photos'::regclass and polname='photos_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%uploaded_by_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photos'::regclass and polname='photos_moderator_write' and polcmd='w' and pg_get_expr(polqual,polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck,polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_comments'::regclass and polname='photo_comments_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_comments'::regclass and polname='photo_comments_moderator_update' and polcmd='w' and pg_get_expr(polqual,polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck,polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_tags'::regclass and polname='photo_tags_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%created_by_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_tags'::regclass and polname='photo_tags_moderator_write' and polcmd='w' and pg_get_expr(polqual,polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck,polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_likes'::regclass and polname='photo_likes_auth_insert' and polcmd='a' and pg_get_expr(polwithcheck,polrelid) ilike '%user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_likes'::regclass and polname='photo_likes_owner_delete' and polcmd='d' and pg_get_expr(polqual,polrelid) ilike '%user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_removal_requests'::regclass and polname='removal_requests_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_removal_requests'::regclass and polname='removal_requests_moderator_write' and polcmd='w' and pg_get_expr(polqual,polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck,polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.memories'::regclass and polname='memories_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.memories'::regclass and polname='memories_moderator_update' and polcmd='w' and pg_get_expr(polqual,polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck,polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.poll_votes'::regclass and polname='poll_votes_auth_insert' and polcmd='a' and pg_get_expr(polwithcheck,polrelid) ilike '%user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.poll_votes'::regclass and polname='poll_votes_owner_read' and polcmd='r' and pg_get_expr(polqual,polrelid) ilike '%user_id%auth.uid%') then
    raise exception 'FAIL content_owner_or_moderator_path_changed';
  end if;

  -- Public reads are deliberately retained on approved/open content; the
  -- photo-likes public table read remains flagged for a separate privacy review.
  if not exists (select 1 from pg_policy where polrelid='public.photos'::regclass and polname='photos_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid) ilike '%approved%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_comments'::regclass and polname='photo_comments_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid) ilike '%approved%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_tags'::regclass and polname='photo_tags_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid) ilike '%approved%')
     or not exists (select 1 from pg_policy where polrelid='public.photo_likes'::regclass and polname='photo_likes_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid)='true')
     or not exists (select 1 from pg_policy where polrelid='public.polls'::regclass and polname='polls_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid) ilike '%open%closed%')
     or not exists (select 1 from pg_policy where polrelid='public.poll_options'::regclass and polname='poll_options_public_read' and polcmd='r' and 0=any(polroles) and pg_get_expr(polqual,polrelid) ilike '%open%closed%') then
    raise exception 'FAIL intentional_public_read_path_changed';
  end if;
end;
$$;
