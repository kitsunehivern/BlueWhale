drop function if exists public.settle_baucua_game(integer, public.baucua_symbol[]);

create or replace function public.settle_baucua_game(
  p_game_id integer,
  p_dices public.baucua_symbol[]
)
returns table (user_id text, net_change bigint)
language plpgsql
set search_path = public
as $$
declare
  v_game public.baucua_games%rowtype;
begin
  select * into v_game
  from public.baucua_games
  where id = p_game_id
  for update;

  if not found or v_game.status <> 'active'::public.baucua_status then
    return;
  end if;

  update public.baucua_games
  set status = 'settled'::public.baucua_status,
      dices = p_dices,
      settled_at = now()
  where id = p_game_id;

  return query
  with dice_counts as (
    select face, count(*) as c
    from unnest(p_dices) as face
    group by face
  ),
  bet_results as (
    select
      b.user_id,
      b.amount,
      coalesce(dc.c, 0) as match_count
    from public.baucua_bets b
    left join dice_counts dc on b.symbol = dc.face
    where b.game_id = p_game_id
  ),
  user_settlement as (
    select
      br.user_id,
      sum(
        case
          when br.match_count > 0 then br.amount * (1 + br.match_count)
          else 0
        end
      )::bigint as total_credit,
      sum(
        case
          when br.match_count > 0 then br.amount * br.match_count
          else -br.amount
        end
      )::bigint as net_change
    from bet_results br
    group by br.user_id
  ),
  update_users as (
    update public.users u
    set balance = u.balance + s.total_credit
    from user_settlement s
    where u.user_id = s.user_id
    returning u.user_id
  )
  select s.user_id, s.net_change
  from user_settlement s;
end;
$$;
