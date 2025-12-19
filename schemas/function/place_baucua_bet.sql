drop function if exists public.place_baucua_bet(integer, text, public.baucua_symbol, bigint);

create or replace function public.place_baucua_bet(
  p_game_id integer,
  p_user_id text,
  p_symbol public.baucua_symbol,
  p_amount bigint
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_game public.baucua_games%rowtype;
  v_balance bigint;
begin
  if p_amount <= 0 then
    raise exception 'AMOUNT_NON_POSITIVE';
  end if;

  select * into v_game
  from public.baucua_games
  where id = p_game_id
  for update;

  if not found or v_game.status <> 'active'::public.baucua_status then
    raise exception 'BAUCUA_BETTING_CLOSED';
  end if;

  if now() >= v_game.ends_at then
    raise exception 'BAUCUA_BETTING_CLOSED';
  end if;

  perform public.ensure_user_row(p_user_id);

  select balance into v_balance
  from public.users
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.users
  set balance = balance - p_amount
  where user_id = p_user_id;

  insert into public.baucua_bets (
    game_id,
    user_id,
    symbol,
    amount
  )
  values (
    p_game_id,
    p_user_id,
    p_symbol,
    p_amount
  );
end;
$$;
