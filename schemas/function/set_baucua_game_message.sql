drop function if exists public.set_baucua_game_message(integer, text);

create or replace function public.set_baucua_game_message(
  p_game_id integer,
  p_message_id text
)
returns void
language plpgsql
as $$
begin
  update public.baucua_games
  set message_id = p_message_id
  where id = p_game_id;
end;
$$;
