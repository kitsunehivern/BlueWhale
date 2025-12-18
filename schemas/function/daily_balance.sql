drop function if exists public.daily_balance(text, bigint);

create or replace function public.daily_balance(
  p_user_id text,
  p_amount bigint
)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_today_utc date := (now() at time zone 'utc')::date;
  v_new_balance bigint;
begin
  perform public.ensure_user_row(p_user_id);

  perform 1
  from public.users
  where user_id = p_user_id
  for update;

  if (
    select (daily_claimed_at at time zone 'utc')::date
    from public.users
    where user_id = p_user_id
  ) = v_today_utc then
    raise exception 'DAILY_ALREADY_CLAIMED';
  end if;

  update public.users
  set balance = greatest(balance + p_amount, 0),
      daily_claimed_at = now()
  where user_id = p_user_id
  returning balance into v_new_balance;

  return v_new_balance;
end;
$$;
