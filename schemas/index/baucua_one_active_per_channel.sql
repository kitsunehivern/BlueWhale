drop index if exists baucua_one_active_per_channel;

create unique index baucua_one_active_per_channel
on public.baucua_games (channel_id)
where status = 'active'::public.baucua_status;
