-- ============================================================
-- Staff RPC functions for Scholarship Monitoring System
-- Run this in Supabase SQL Editor if Verify/Evaluate/Approve/Hold fail
-- Matches exam policies: Excellence + Access Scholar
-- ============================================================

-- Ensure policy columns exist (safe if already present)
ALTER TABLE public.scholarship_programs
  ADD COLUMN IF NOT EXISTS max_gwa NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS min_units INTEGER,
  ADD COLUMN IF NOT EXISTS max_failed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_incomplete INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_dropped INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Backfill from common column names if present
UPDATE public.scholarship_programs
SET max_gwa = COALESCE(max_gwa, required_gwa, 2.00),
    min_units = COALESCE(min_units, 18),
    max_failed = COALESCE(max_failed, 0),
    max_incomplete = COALESCE(max_incomplete, 0),
    max_dropped = COALESCE(max_dropped, CASE WHEN program_name ILIKE '%Access%' THEN 1 ELSE 0 END),
    deadline = COALESCE(deadline, '2026-11-06 17:00:00+08'::timestamptz)
WHERE max_gwa IS NULL OR min_units IS NULL OR deadline IS NULL;

-- Excellence / Access seed (adjust if your unique constraint differs)
INSERT INTO public.scholarship_programs (program_name, max_gwa, min_units, max_failed, max_incomplete, max_dropped, deadline, active)
VALUES
  ('Excellence Scholar', 2.00, 18, 0, 0, 0, '2026-11-06 17:00:00+08', true),
  ('Access Scholar', 2.50, 15, 0, 0, 1, '2026-11-06 17:00:00+08', true)
ON CONFLICT DO NOTHING;

-- Helper: is current user staff?
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
  );
$$;

-- ========== VERIFY / RETURN ==========
CREATE OR REPLACE FUNCTION public.staff_verify_submission(
  p_submission_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Only Scholarship Staff can verify submissions.';
  END IF;

  IF p_decision NOT IN ('Verified', 'Returned') THEN
    RAISE EXCEPTION 'Decision must be Verified or Returned.';
  END IF;

  IF p_decision = 'Returned' AND (p_reason IS NULL OR length(trim(p_reason)) = 0) THEN
    RAISE EXCEPTION 'A reason is required when returning a submission.';
  END IF;

  UPDATE public.grade_submissions
  SET
    submission_status = p_decision,
    verification_reason = CASE WHEN p_decision = 'Returned' THEN p_reason ELSE NULL END,
    verified_by = auth.uid(),
    verified_at = now(),
    -- clear evaluation/decision when returned so scholar can resubmit cleanly
    compliance_status = CASE WHEN p_decision = 'Returned' THEN 'Pending' ELSE compliance_status END,
    deficiency_reasons = CASE WHEN p_decision = 'Returned' THEN ARRAY[]::text[] ELSE deficiency_reasons END,
    evaluated_by = CASE WHEN p_decision = 'Returned' THEN NULL ELSE evaluated_by END,
    evaluated_at = CASE WHEN p_decision = 'Returned' THEN NULL ELSE evaluated_at END
  WHERE id = p_submission_id
  RETURNING submission_status INTO v_status;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE WHEN p_decision = 'Verified' THEN 'VERIFY_SUBMISSION' ELSE 'RETURN_SUBMISSION' END,
    'grade_submission',
    p_submission_id,
    jsonb_build_object('decision', p_decision, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true, 'status', v_status);
END;
$$;

-- ========== EVALUATE COMPLIANCE ==========
CREATE OR REPLACE FUNCTION public.staff_evaluate_submission(p_submission_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  pol record;
  reasons text[] := ARRAY[]::text[];
  result_status text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Only Scholarship Staff can evaluate submissions.';
  END IF;

  SELECT gs.*, sc.scholarship_id
  INTO s
  FROM public.grade_submissions gs
  JOIN public.scholars sc ON sc.id = gs.scholar_id
  WHERE gs.id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF s.submission_status IS DISTINCT FROM 'Verified' THEN
    RAISE EXCEPTION 'Only verified submissions can be evaluated. Current status: %.', s.submission_status;
  END IF;

  SELECT * INTO pol
  FROM public.scholarship_programs
  WHERE id = s.scholarship_id AND COALESCE(active, true) = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active scholarship policy assigned to this scholar.';
  END IF;

  -- Policy checks (exam rules)
  IF s.gwa > COALESCE(pol.max_gwa, pol.required_gwa, 2.00) THEN
    reasons := array_append(reasons,
      format('GWA %s exceeds maximum %s.',
        to_char(s.gwa, 'FM990.00'),
        to_char(COALESCE(pol.max_gwa, pol.required_gwa, 2.00), 'FM990.00')));
  END IF;

  IF s.units_enrolled < COALESCE(pol.min_units, 18) THEN
    reasons := array_append(reasons,
      format('Units enrolled (%s) are below the minimum (%s).',
        s.units_enrolled, COALESCE(pol.min_units, 18)));
  END IF;

  IF s.failed_subjects > COALESCE(pol.max_failed, 0) THEN
    reasons := array_append(reasons,
      format('Failed subjects (%s) exceed allowed (%s).',
        s.failed_subjects, COALESCE(pol.max_failed, 0)));
  END IF;

  IF s.incomplete_subjects > COALESCE(pol.max_incomplete, 0) THEN
    reasons := array_append(reasons,
      format('Incomplete grades (%s) exceed allowed (%s).',
        s.incomplete_subjects, COALESCE(pol.max_incomplete, 0)));
  END IF;

  IF s.dropped_subjects > COALESCE(pol.max_dropped, 0) THEN
    reasons := array_append(reasons,
      format('Dropped subjects (%s) exceed allowed (%s).',
        s.dropped_subjects, COALESCE(pol.max_dropped, 0)));
  END IF;

  IF pol.deadline IS NOT NULL AND s.submitted_at > pol.deadline THEN
    reasons := array_append(reasons,
      format('Submission is late (after %s Asia/Manila).',
        to_char(pol.deadline AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD HH24:MI')));
  END IF;

  IF array_length(reasons, 1) IS NULL THEN
    result_status := 'Compliant';
  ELSE
    result_status := 'With Deficiency';
  END IF;

  UPDATE public.grade_submissions
  SET
    compliance_status = result_status,
    deficiency_reasons = reasons,
    evaluated_by = auth.uid(),
    evaluated_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'EVALUATE_COMPLIANCE',
    'grade_submission',
    p_submission_id,
    jsonb_build_object('status', result_status, 'reasons', to_jsonb(reasons))
  );

  RETURN jsonb_build_object('ok', true, 'status', result_status, 'reasons', reasons);
END;
$$;

-- ========== RENEWAL DECISION ==========
CREATE OR REPLACE FUNCTION public.staff_decide_renewal(
  p_submission_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Only Scholarship Staff can record renewal decisions.';
  END IF;

  IF p_decision NOT IN ('Approved', 'Held') THEN
    RAISE EXCEPTION 'Decision must be Approved or Held.';
  END IF;

  SELECT * INTO s FROM public.grade_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF s.submission_status IS DISTINCT FROM 'Verified' THEN
    RAISE EXCEPTION 'Submission must be verified before renewal decision.';
  END IF;

  IF s.compliance_status IS NULL OR s.compliance_status = 'Pending' THEN
    RAISE EXCEPTION 'Evaluate compliance before recording a renewal decision.';
  END IF;

  IF p_decision = 'Approved' AND s.compliance_status IS DISTINCT FROM 'Compliant' THEN
    RAISE EXCEPTION 'Cannot approve renewal for a non-compliant submission.';
  END IF;

  IF p_decision = 'Held' AND (p_reason IS NULL OR length(trim(p_reason)) = 0) THEN
    RAISE EXCEPTION 'A reason is required when holding renewal.';
  END IF;

  -- Upsert renewal decision
  INSERT INTO public.renewal_decisions (submission_id, decision, reason, decided_by, decided_at)
  VALUES (p_submission_id, p_decision, p_reason, auth.uid(), now())
  ON CONFLICT (submission_id) DO UPDATE
  SET decision = EXCLUDED.decision,
      reason = EXCLUDED.reason,
      decided_by = EXCLUDED.decided_by,
      decided_at = EXCLUDED.decided_at;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE WHEN p_decision = 'Approved' THEN 'RENEWAL_APPROVED' ELSE 'RENEWAL_HELD' END,
    'grade_submission',
    p_submission_id,
    jsonb_build_object('decision', p_decision, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true, 'decision', p_decision);
END;
$$;

-- Grants for authenticated users (RLS + is_staff still enforce)
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_verify_submission(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_evaluate_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_decide_renewal(uuid, text, text) TO authenticated;
