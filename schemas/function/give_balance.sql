drop function if exists public.give_balance(text, text, bigint);

create or replace function public.give_balance(
  p_from_user_id text,
  p_to_user_id text,
  p_amount bigint
)
returns table (from_balance bigint, to_balance bigint)
language plpgsql
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'AMOUNT_NON_POSITIVE';
  end if;

  if p_from_user_id = p_to_user_id then
    raise exception 'GIVE_SAME_USER';
  end if;

  perform public.ensure_user_row(p_from_user_id);
  perform public.ensure_user_row(p_to_user_id);

  if p_from_user_id < p_to_user_id then
    perform 1 from public.users where user_id = p_from_user_id for update;
    perform 1 from public.users where user_id = p_to_user_id   for update;
  else
    perform 1 from public.users where user_id = p_to_user_id   for update;
    perform 1 from public.users where user_id = p_from_user_id for update;
  end if;

  if (select balance from public.users where user_id = p_from_user_id) < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.users
  set balance = balance - p_amount
  where user_id = p_from_user_id;

  update public.users
  set balance = balance + p_amount
  where user_id = p_to_user_id;

  return query
  select
    (select balance from public.users where user_id = p_from_user_id),
    (select balance from public.users where user_id = p_to_user_id);
end;
$$;
