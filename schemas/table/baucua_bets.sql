drop table if exists public.baucua_bets;

create table if not exists public.baucua_bets (
  id serial primary key,
  game_id integer not null,
  user_id text not null,
  symbol baucua_symbol not null,
  amount bigint not null,
  created_at timestamptz not null default now()
);
