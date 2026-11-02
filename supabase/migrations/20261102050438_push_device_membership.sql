-- Prepared only. Mike applies to Camino before deploying the secured Edge Function.
begin;
alter table public.push_test_devices add column user_id uuid references auth.users(id);
create index push_test_devices_user_id_idx on public.push_test_devices(user_id);
alter table public.push_test_devices enable row level security;
revoke all on public.push_test_devices from public, anon, authenticated;
grant select, insert, update, delete on public.push_test_devices to service_role;

create table public.camino_push_test_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_sent_at timestamptz,
 send_day date,
 sends_today integer not null default 0 check (sends_today between 0 and 3)
);
alter table public.camino_push_test_limits enable row level security;
revoke all on public.camino_push_test_limits from public, anon, authenticated;
grant select, insert, update on public.camino_push_test_limits to service_role;

-- Service-only invoker: the caller must supply an identity already verified with Auth.
-- RLS membership is rechecked here; account then device locks prevent token rotation/races.
create function public.claim_camino_push_test(p_user_id uuid, p_token_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 quota public.camino_push_test_limits%rowtype;
 device public.push_test_devices%rowtype;
 stamp timestamptz := now();
 today date := (now() at time zone 'UTC')::date;
begin
 if not exists(select 1 from public.project_members where project_id='45343dda-fa24-4839-ac16-6b111da4ee28'::uuid and user_id=p_user_id) then
  return jsonb_build_object('error','membership_required');
 end if;
 insert into public.camino_push_test_limits(user_id) values(p_user_id) on conflict do nothing;
 select * into quota from public.camino_push_test_limits where user_id=p_user_id for update;
 select * into device from public.push_test_devices where token_hash=p_token_hash and user_id=p_user_id for update;
 if not found or device.expires_at<=stamp then return jsonb_build_object('error','device_not_registered'); end if;
 if quota.last_sent_at>stamp-interval '2 minutes' or device.last_sent_at>stamp-interval '2 minutes' then
  return jsonb_build_object('error','wait_two_minutes');
 end if;
 if (quota.send_day=today and quota.sends_today>=3) or (device.send_day=today and device.sends_today>=3) then
  return jsonb_build_object('error','daily_limit');
 end if;
 update public.camino_push_test_limits set last_sent_at=stamp,send_day=today,
  sends_today=case when send_day=today then sends_today+1 else 1 end where user_id=p_user_id;
 update public.push_test_devices set last_sent_at=stamp,send_day=today,
  sends_today=case when send_day=today then sends_today+1 else 1 end,
  last_delivery_status='scheduled',last_delivery_detail=null,last_delivery_updated_at=stamp
  where token_hash=p_token_hash and user_id=p_user_id;
 return jsonb_build_object('claimed',true);
end;
$$;
revoke all on function public.claim_camino_push_test(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_camino_push_test(uuid,text) to service_role;
commit;
