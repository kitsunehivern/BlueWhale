drop function if exists public.update_user_balance(text, bigint);

create or replace function public.update_user_balance(
  p_user_id text,
  p_amount bigint
)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  new_balance bigint;
begin
  perform public.ensure_user_row(p_user_id);

  update public.users
  set balance = greatest(balance + p_amount, 0)
  where user_id = p_user_id
  returning balance into new_balance;

  return new_balance;
end;
$$;
