-- 4C: remove only administrative policies already fully covered by an
-- equivalent authenticated admin ALL policy. Public, owner, voter, and
-- moderator access paths remain unchanged.

drop policy if exists admin_panel_select on public.photos;
drop policy if exists photos_admin_read on public.photos;

drop policy if exists admin_panel_select on public.photo_comments;
drop policy if exists photo_comments_admin_delete on public.photo_comments;

drop policy if exists admin_panel_select on public.photo_tags;
drop policy if exists photo_tags_admin_read on public.photo_tags;

drop policy if exists admin_panel_select on public.photo_likes;

drop policy if exists admin_panel_select on public.photo_removal_requests;
drop policy if exists removal_requests_admin_read on public.photo_removal_requests;

drop policy if exists admin_panel_select on public.memories;
drop policy if exists memories_admin_delete on public.memories;

drop policy if exists admin_panel_select on public.polls;
drop policy if exists polls_admin_all on public.polls;

drop policy if exists admin_panel_select on public.poll_options;
drop policy if exists poll_options_admin_all on public.poll_options;

drop policy if exists admin_panel_select on public.poll_votes;
drop policy if exists poll_votes_admin_read on public.poll_votes;
