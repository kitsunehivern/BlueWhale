drop function if exists public.create_user(text);

create or replace function public.create_user(p_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;
end;
$$;
