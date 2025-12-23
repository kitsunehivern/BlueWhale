drop function if exists public.get_baucua_stats();

create or replace function public.get_baucua_stats()
returns table (
  games bigint,
  bets bigint,
  stag bigint,
  calabash bigint,
  cock bigint,
  fish bigint,
  crab bigint,
  prawn bigint
)
language sql
stable
as $$
with settled_games as (
  select id, dices
  from public.baucua_games
  where status = 'settled'
),
games_count as (
  select count(*)::bigint as games
  from settled_games
),
bets_count as (
  select count(*)::bigint as bets
  from public.baucua_bets b
  join settled_games g on g.id = b.game_id
),
dice_faces as (
  select unnest(g.dices) as faces
  from settled_games g
  where g.dices is not null
),
face_counts as (
  select faces, count(*)::bigint as c
  from dice_faces
  group by faces
)
select
  (select games from games_count) as games,
  (select bets from bets_count) as bets,
  coalesce((select c from face_counts where faces = 'stag'), 0) as stag,
  coalesce((select c from face_counts where faces = 'calabash'), 0) as calabash,
  coalesce((select c from face_counts where faces = 'cock'), 0) as cock,
  coalesce((select c from face_counts where faces = 'fish'), 0) as fish,
  coalesce((select c from face_counts where faces = 'crab'), 0) as crab,
  coalesce((select c from face_counts where faces = 'prawn'), 0) as prawn;
$$;
