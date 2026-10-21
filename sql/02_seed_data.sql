-- Synthetic demo/test records only. Safe to rerun; existing matching records are retained.
-- Run sql/01_schema_and_security.sql first, then this file, then sql/staff_functions.sql.
-- Link real Supabase Auth accounts to scholars.user_id only after creating the accounts.
insert into public.scholarship_programs
  (program_name, required_gwa, max_gwa, min_units, max_failed, max_incomplete, max_dropped, deadline, active)
values
  ('Excellence Scholar', 2.00, 2.00, 18, 0, 0, 0, '2026-11-06 17:00:00+08', true),
  ('Access Scholar', 2.50, 2.50, 15, 0, 0, 1, '2026-11-06 17:00:00+08', true)
on conflict (program_name) do update set
  required_gwa = excluded.required_gwa,
  max_gwa = excluded.max_gwa,
  min_units = excluded.min_units,
  max_failed = excluded.max_failed,
  max_incomplete = excluded.max_incomplete,
  max_dropped = excluded.max_dropped,
  deadline = excluded.deadline,
  active = excluded.active;

insert into public.scholars (student_id, full_name, degree_program, year_level, scholarship_id, status)
select v.student_id, v.full_name, 'BSIT', '3', p.id, 'Active'
from (values
  ('B01','Test Scholar B01','Excellence Scholar'),
  ('B02','Test Scholar B02','Excellence Scholar'),
  ('B03','Test Scholar B03','Access Scholar'),
  ('B04','Test Scholar B04','Access Scholar'),
  ('B05','Test Scholar B05','Excellence Scholar'),
  ('B06','Test Scholar B06','Access Scholar')
) as v(student_id, full_name, program_name)
join public.scholarship_programs p on p.program_name = v.program_name
on conflict (student_id) do update set
  full_name = excluded.full_name,
  degree_program = excluded.degree_program,
  year_level = excluded.year_level,
  scholarship_id = excluded.scholarship_id,
  status = excluded.status;

-- Records model the required boundary/deficiency scenarios. B01's exact-deadline
-- timestamp is intentionally future-dated to test the deadline boundary.
insert into public.grade_submissions
  (scholar_id, academic_year, semester, gwa, units_enrolled, failed_subjects,
   incomplete_subjects, dropped_subjects, evidence_reference, submitted_at,
   submission_status, compliance_status, deficiency_reasons)
select sc.id, '2026-2027', 1, v.gwa, v.units, v.failed, v.inc, v.dropped,
       'synthetic-evidence-' || v.student_id || '.pdf',
       v.submitted_at::timestamptz, v.submission_status, 'Pending', array[]::text[]
from (values
  ('B01',2.00,18,0,0,0,'2026-11-06 17:00:00+08','Pending'),
  ('B02',2.01,18,0,0,0,'2026-11-06 16:00:00+08','Pending'),
  ('B03',2.50,15,0,0,1,'2026-11-06 16:00:00+08','Pending'),
  ('B04',2.50,14,0,1,0,'2026-11-06 16:00:00+08','Pending'),
  ('B05',1.75,18,1,0,0,'2026-11-06 17:01:00+08','Pending'),
  ('B06',2.25,15,0,0,0,now()::text,'Pending')
) as v(student_id,gwa,units,failed,inc,dropped,submitted_at,submission_status)
join public.scholars sc on sc.student_id = v.student_id
on conflict (scholar_id, academic_year, semester) do nothing;
