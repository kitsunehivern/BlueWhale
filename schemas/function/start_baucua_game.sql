drop function if exists public.start_baucua_game(text, text, integer);

create or replace function public.start_baucua_game(
  p_channel_id text,
  p_started_by text,
  p_duration_seconds integer
)
returns integer
language plpgsql
as $$
declare
  v_game_id integer;
begin
  insert into public.baucua_games (
    channel_id,
    started_by,
    ends_at
  )
  values (
    p_channel_id,
    p_started_by,
    now() + make_interval(secs => p_duration_seconds)
  )
  returning id into v_game_id;

  return v_game_id;

exception
  when unique_violation then
    raise exception 'BAUCUA_ALREADY_RUNNING';
end;
$$;
