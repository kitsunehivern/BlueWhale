drop function if exists public.ensure_user_row(text);

create or replace function public.ensure_user_row(
  p_user_id text
)
returns void
language plpgsql
as $$
begin
  insert into public.users (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;
end;
$$;
