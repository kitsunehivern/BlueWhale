drop table if exists public.users;

create table public.users (
  id serial primary key,
  user_id text unique not null,
  balance bigint default 0,
  daily_claimed_at timestamptz default '1970-01-01 00:00:00+00',
  created_at timestamptz default now()
);
