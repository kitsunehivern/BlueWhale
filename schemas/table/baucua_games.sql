drop table if exists public.baucua_games;

create table if not exists public.baucua_games (
  id serial primary key,
  channel_id text not null,
  started_by text not null,
  status baucua_status not null default 'active',
  message_id text,
  dices baucua_symbol[],
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  refunded_at timestamptz
);
