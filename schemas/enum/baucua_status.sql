drop type if exists public.baucua_status;

create type public.baucua_status as enum ('active', 'settled', 'refunded');
