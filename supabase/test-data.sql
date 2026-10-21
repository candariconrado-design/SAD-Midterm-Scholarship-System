-- OPTIONAL TEST-ONLY SEED DATA. Run only in a development/test Supabase project.
-- These are synthetic records, not real student data.
insert into public.scholars(student_id,full_name,program,policy_id)
select x.student_id,x.full_name,'BSIT',p.id
from (values
 ('TEST-B01','Synthetic Test Scholar B01','Excellence Scholar'),
 ('TEST-B02','Synthetic Test Scholar B02','Excellence Scholar'),
 ('TEST-B03','Synthetic Test Scholar B03','Access Scholar'),
 ('TEST-B04','Synthetic Test Scholar B04','Access Scholar'),
 ('TEST-B05','Synthetic Test Scholar B05','Excellence Scholar'),
 ('TEST-B06','Synthetic Test Scholar B06','Access Scholar')
) as x(student_id,full_name,policy_name)
join public.scholarship_policies p on p.policy_name=x.policy_name
on conflict(student_id) do update set full_name=excluded.full_name,program=excluded.program,policy_id=excluded.policy_id;

insert into public.academic_submissions
(scholar_id,academic_year,semester,gwa,units_completed,failed_count,incomplete_count,dropped_count,evidence_reference,submitted_at,verification_status,compliance_status)
select s.id,'2026-2027',1,x.gwa,x.units,x.failed,x.inc_count,x.dropped,
       'TEST-ONLY: '||x.student_id||' evidence reference',
       x.submitted_at::timestamptz,x.verification_status,'Pending'
from (values
 ('TEST-B01',2.00,18,0,0,0,'2026-11-06 17:00:00+08','Pending Verification'),
 ('TEST-B02',2.01,18,0,0,0,'2026-11-06 16:59:00+08','Pending Verification'),
 ('TEST-B03',2.50,15,0,0,1,'2026-11-06 16:59:00+08','Pending Verification'),
 ('TEST-B04',2.50,14,0,1,0,'2026-11-06 16:59:00+08','Pending Verification'),
 ('TEST-B05',1.75,18,1,0,0,'2026-11-06 17:01:00+08','Pending Verification'),
 ('TEST-B06',2.25,15,0,0,0,'2026-11-06 16:59:00+08','Pending Verification')
) as x(student_id,gwa,units,failed,inc_count,dropped,submitted_at,verification_status)
join public.scholars s on s.student_id=x.student_id
on conflict(scholar_id,academic_year,semester) do nothing;

-- Verify B01-B05 using the staff UI, then evaluate them. Keep B06 pending
-- to confirm that evaluation/renewal are blocked until verification is complete.
