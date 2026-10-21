-- SAD Midterm Scholarship System. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'scholar' check (role in ('scholar','staff')),
  created_at timestamptz not null default now()
);
create table if not exists public.scholarship_policies (
  id uuid primary key default gen_random_uuid(),
  policy_name text not null unique check (policy_name in ('Excellence Scholar','Access Scholar')),
  max_gwa numeric(3,2) not null check (max_gwa between 1.00 and 5.00),
  min_units integer not null check (min_units >= 0),
  allowed_failed integer not null check (allowed_failed >= 0),
  allowed_incomplete integer not null check (allowed_incomplete >= 0),
  allowed_dropped integer not null check (allowed_dropped >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.scholars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  student_id text not null unique,
  full_name text not null,
  program text not null,
  policy_id uuid not null references public.scholarship_policies(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.academic_submissions (
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references public.scholars(id) on delete cascade,
  academic_year text not null default '2026-2027',
  semester integer not null default 1 check (semester in (1,2,3)),
  gwa numeric(3,2) not null check (gwa between 1.00 and 5.00),
  units_completed integer not null check (units_completed >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  incomplete_count integer not null default 0 check (incomplete_count >= 0),
  dropped_count integer not null default 0 check (dropped_count >= 0),
  evidence_reference text not null check (length(trim(evidence_reference)) > 0),
  submitted_at timestamptz not null default now(),
  verification_status text not null default 'Pending Verification' check (verification_status in ('Pending Verification','Verified','Returned')),
  verification_reason text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  compliance_status text not null default 'Pending' check (compliance_status in ('Pending','Compliant','With Deficiency')),
  deficiency_reasons jsonb not null default '[]'::jsonb,
  evaluated_by uuid references auth.users(id),
  evaluated_at timestamptz,
  unique (scholar_id, academic_year, semester)
);
create table if not exists public.renewal_decisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.academic_submissions(id) on delete cascade,
  decision text not null check (decision in ('Approved','Held')),
  reason text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.scholarship_policies(policy_name,max_gwa,min_units,allowed_failed,allowed_incomplete,allowed_dropped)
values ('Excellence Scholar',2.00,18,0,0,0),('Access Scholar',2.50,15,0,0,1)
on conflict (policy_name) do update set max_gwa=excluded.max_gwa,min_units=excluded.min_units,
allowed_failed=excluded.allowed_failed,allowed_incomplete=excluded.allowed_incomplete,
allowed_dropped=excluded.allowed_dropped,active=true;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path=public
as $$ select role from public.profiles where user_id=auth.uid() $$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select coalesce(public.current_user_role()='staff',false) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 insert into public.profiles(user_id,full_name,role)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'scholar')
 on conflict(user_id) do nothing;
 return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.scholarship_policies enable row level security;
alter table public.scholars enable row level security;
alter table public.academic_submissions enable row level security;
alter table public.renewal_decisions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profile self or staff read" on public.profiles;
create policy "profile self or staff read" on public.profiles for select using(user_id=auth.uid() or public.is_staff());
drop policy if exists "profile self update name only" on public.profiles;
create policy "profile self update name only" on public.profiles for update using(user_id=auth.uid()) with check(user_id=auth.uid() and role='scholar');
drop policy if exists "policies visible to signed in users" on public.scholarship_policies;
create policy "policies visible to signed in users" on public.scholarship_policies for select to authenticated using(true);
drop policy if exists "staff manage policies" on public.scholarship_policies;
create policy "staff manage policies" on public.scholarship_policies for all to authenticated using(public.is_staff()) with check(public.is_staff());

drop policy if exists "scholar or staff read scholar records" on public.scholars;
create policy "scholar or staff read scholar records" on public.scholars for select to authenticated using(user_id=auth.uid() or public.is_staff());
drop policy if exists "staff manage scholar records" on public.scholars;
create policy "staff manage scholar records" on public.scholars for all to authenticated using(public.is_staff()) with check(public.is_staff());

drop policy if exists "scholar reads own submissions or staff reads all" on public.academic_submissions;
create policy "scholar reads own submissions or staff reads all" on public.academic_submissions for select to authenticated using(
 public.is_staff() or exists(select 1 from public.scholars s where s.id=scholar_id and s.user_id=auth.uid()));
drop policy if exists "scholar submits own academic record" on public.academic_submissions;
create policy "scholar submits own academic record" on public.academic_submissions for insert to authenticated with check(
 verification_status='Pending Verification' and compliance_status='Pending' and
 exists(select 1 from public.scholars s where s.id=scholar_id and s.user_id=auth.uid()));
drop policy if exists "scholar corrects returned submission" on public.academic_submissions;
create policy "scholar corrects returned submission" on public.academic_submissions for update to authenticated using(
 verification_status='Returned' and exists(select 1 from public.scholars s where s.id=scholar_id and s.user_id=auth.uid()))
with check(verification_status='Pending Verification' and compliance_status='Pending' and
 exists(select 1 from public.scholars s where s.id=scholar_id and s.user_id=auth.uid()));
drop policy if exists "staff manages submissions" on public.academic_submissions;
create policy "staff manages submissions" on public.academic_submissions for all to authenticated using(public.is_staff()) with check(public.is_staff());

drop policy if exists "scholar or staff read renewal decisions" on public.renewal_decisions;
create policy "scholar or staff read renewal decisions" on public.renewal_decisions for select to authenticated using(
 public.is_staff() or exists(select 1 from public.academic_submissions a join public.scholars s on s.id=a.scholar_id where a.id=submission_id and s.user_id=auth.uid()));
drop policy if exists "staff manage renewal decisions" on public.renewal_decisions;
create policy "staff manage renewal decisions" on public.renewal_decisions for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists "staff read audit logs" on public.audit_logs;
create policy "staff read audit logs" on public.audit_logs for select to authenticated using(public.is_staff());
drop policy if exists "authenticated can insert own audit log" on public.audit_logs;
create policy "authenticated can insert own audit log" on public.audit_logs for insert to authenticated with check(actor_id=auth.uid());

create or replace function public.staff_verify_submission(p_submission_id uuid,p_decision text,p_reason text default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v_status text;
begin
 if not public.is_staff() then raise exception 'Only Scholarship Staff can verify submissions.'; end if;
 if p_decision not in ('Verified','Returned') then raise exception 'Decision must be Verified or Returned.'; end if;
 select verification_status into v_status from public.academic_submissions where id=p_submission_id for update;
 if not found then raise exception 'Submission not found.'; end if;
 if v_status<>'Pending Verification' then raise exception 'Only pending submissions can be verified.'; end if;
 if p_decision='Returned' and coalesce(trim(p_reason),'')='' then raise exception 'A return reason is required.'; end if;
 update public.academic_submissions set verification_status=p_decision,
 verification_reason=case when p_decision='Returned' then trim(p_reason) else null end,
 verified_by=auth.uid(),verified_at=now() where id=p_submission_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(auth.uid(),'VERIFY_'||upper(replace(p_decision,' ','_')),'academic_submission',p_submission_id,jsonb_build_object('reason',p_reason));
end;
$$;

create or replace function public.staff_evaluate_submission(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare a public.academic_submissions%rowtype; pol public.scholarship_policies%rowtype;
reasons jsonb:='[]'::jsonb; v_late boolean; v_status text;
begin
 if not public.is_staff() then raise exception 'Only Scholarship Staff can evaluate compliance.'; end if;
 select * into a from public.academic_submissions where id=p_submission_id for update;
 if not found then raise exception 'Submission not found.'; end if;
 if a.verification_status<>'Verified' then raise exception 'Only verified submissions can be evaluated.'; end if;
 select p.* into pol from public.scholarship_policies p join public.scholars s on s.policy_id=p.id where s.id=a.scholar_id and p.active;
 if not found then raise exception 'No active scholarship policy is assigned.'; end if;
 v_late := a.submitted_at > timestamptz '2026-11-06 17:00:00+08';
 if a.gwa>pol.max_gwa then reasons:=reasons||jsonb_build_array(format('GWA %s exceeds maximum %s.',a.gwa,pol.max_gwa)); end if;
 if a.units_completed<pol.min_units then reasons:=reasons||jsonb_build_array(format('Units completed %s is below minimum %s.',a.units_completed,pol.min_units)); end if;
 if a.failed_count>pol.allowed_failed then reasons:=reasons||jsonb_build_array(format('Failed subjects %s exceeds allowed %s.',a.failed_count,pol.allowed_failed)); end if;
 if a.incomplete_count>pol.allowed_incomplete then reasons:=reasons||jsonb_build_array(format('INC count %s exceeds allowed %s.',a.incomplete_count,pol.allowed_incomplete)); end if;
 if a.dropped_count>pol.allowed_dropped then reasons:=reasons||jsonb_build_array(format('Dropped subjects %s exceeds allowed %s.',a.dropped_count,pol.allowed_dropped)); end if;
 if v_late then reasons:=reasons||jsonb_build_array('Submission was received after the November 6, 2026 5:00 PM Asia/Manila deadline.'); end if;
 v_status:=case when jsonb_array_length(reasons)=0 then 'Compliant' else 'With Deficiency' end;
 update public.academic_submissions set compliance_status=v_status,deficiency_reasons=reasons,evaluated_by=auth.uid(),evaluated_at=now() where id=p_submission_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(auth.uid(),'EVALUATE_COMPLIANCE','academic_submission',p_submission_id,jsonb_build_object('compliance_status',v_status,'reasons',reasons));
 return jsonb_build_object('status',v_status,'reasons',reasons);
end;
$$;

create or replace function public.staff_decide_renewal(p_submission_id uuid,p_decision text,p_reason text default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v_compliance text;
begin
 if not public.is_staff() then raise exception 'Only Scholarship Staff can decide renewal.'; end if;
 if p_decision not in ('Approved','Held') then raise exception 'Decision must be Approved or Held.'; end if;
 select compliance_status into v_compliance from public.academic_submissions where id=p_submission_id and verification_status='Verified' for update;
 if not found then raise exception 'Submission must be verified and evaluated first.'; end if;
 if v_compliance='Pending' then raise exception 'Evaluate compliance before making a renewal decision.'; end if;
 if p_decision='Approved' and v_compliance<>'Compliant' then raise exception 'Only Compliant submissions can be approved.'; end if;
 if p_decision='Held' and coalesce(trim(p_reason),'')='' then raise exception 'A reason is required when holding renewal.'; end if;
 insert into public.renewal_decisions(submission_id,decision,reason,decided_by)
 values(p_submission_id,p_decision,nullif(trim(p_reason),''),auth.uid())
 on conflict(submission_id) do update set decision=excluded.decision,reason=excluded.reason,decided_by=excluded.decided_by,decided_at=now();
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(auth.uid(),'RENEWAL_'||upper(p_decision),'academic_submission',p_submission_id,jsonb_build_object('decision',p_decision,'reason',p_reason));
end;
$$;
grant execute on function public.staff_verify_submission(uuid,text,text) to authenticated;
grant execute on function public.staff_evaluate_submission(uuid) to authenticated;
grant execute on function public.staff_decide_renewal(uuid,text,text) to authenticated;


-- On a scholar's correction, reset verification/evaluation fields and record a fresh submission time.
create or replace function public.reset_returned_submission_for_resubmission()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is not null and not public.is_staff() then
   if old.verification_status <> 'Returned' then
     raise exception 'Scholars may only edit a returned submission.';
   end if;
   if not exists(select 1 from public.scholars s where s.id=old.scholar_id and s.user_id=auth.uid()) then
     raise exception 'You can only correct your own submission.';
   end if;
   new.submitted_at := now();
   new.verification_status := 'Pending Verification';
   new.verification_reason := null;
   new.verified_by := null;
   new.verified_at := null;
   new.compliance_status := 'Pending';
   new.deficiency_reasons := '[]'::jsonb;
   new.evaluated_by := null;
   new.evaluated_at := null;
 end if;
 return new;
end;
$$;
drop trigger if exists reset_returned_submission on public.academic_submissions;
create trigger reset_returned_submission before update on public.academic_submissions
for each row execute procedure public.reset_returned_submission_for_resubmission();
