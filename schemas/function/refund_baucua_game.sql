drop function if exists public.refund_baucua_game(integer);

create or replace function public.refund_baucua_game(
  p_game_id integer
)
returns void
language plpgsql
as $$
declare
  v_game public.baucua_games%rowtype;
begin
  select * into v_game
  from public.baucua_games
  where id = p_game_id
  for update;

  if not found then
    return;
  end if;

  if v_game.status <> 'active'::public.baucua_status then
    return;
  end if;

  update public.baucua_games
  set status = 'refunded'::public.baucua_status,
      refunded_at = now()
  where id = p_game_id;

  with per_user as (
    select user_id, sum(amount)::bigint as refund
    from public.baucua_bets
    where game_id = p_game_id
    group by user_id
  )
  update public.users u
  set balance = u.balance + p.refund
  from per_user p
  where u.user_id = p.user_id;
end;
$$;
