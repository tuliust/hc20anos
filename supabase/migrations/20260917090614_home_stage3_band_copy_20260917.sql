update public.home_page_content
set info_dinner_subtitle_template = 'Banda a confirmar, dependendo do número de participantes',
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'
  and info_dinner_subtitle_template is distinct from 'Banda a confirmar, dependendo do número de participantes';
