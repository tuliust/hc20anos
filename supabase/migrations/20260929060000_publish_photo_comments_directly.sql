-- HC 20 Anos — comentários em fotos são publicados imediatamente.
-- Mantém autenticação, rate limit e a exigência de que a foto esteja aprovada.
-- Marcações de pessoas e solicitações de remoção continuam com seus fluxos próprios.

create or replace function public.submit_photo_comment(
  p_photo_id uuid,
  p_comment_text text
)
returns public.photo_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.photo_comments;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  perform public.enforce_rate_limit('photo_comment', 10, 60, auth.uid()::text);

  if not exists (
    select 1
    from public.photos p
    where p.id = p_photo_id
      and p.status = 'approved'
  ) then
    raise exception 'photo_not_available';
  end if;

  insert into public.photo_comments(
    photo_id,
    user_id,
    author_name,
    comment_text,
    status,
    approved_at
  )
  values(
    p_photo_id,
    auth.uid(),
    public.content_actor_name(),
    p_comment_text,
    'approved',
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

update public.content_moderation_settings
set auto_approve_comments = true,
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
