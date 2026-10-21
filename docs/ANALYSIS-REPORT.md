# Systems Analysis and Design — Midterm Laboratory Examination
## Student Scholarship Monitoring and Academic Compliance System

## A1. Problem Analysis

### Problem statement
Scholarship staff need a consistent way to collect semester academic summaries, verify supporting evidence, apply the correct scholarship policy, and record renewal decisions. Manual processing can cause delays, inconsistent rule application, and limited traceability. This system supports monitoring and decisions but does not replace the registrar's official records or release payments.

### Cause and effect
| Cause | Effect |
|---|---|
| Academic summaries arrive through different channels | Records may be incomplete or difficult to track |
| Policy rules are checked manually | Similar cases may be evaluated inconsistently |
| Evidence verification is not clearly recorded | Staff may evaluate unverified information |
| Renewal decisions lack a central history | It is difficult to explain who made a decision and when |

### Scope
- Two roles: Scholar and Scholarship Staff.
- Scholar submits GWA, units, failed/INC/dropped counts, and an evidence reference.
- Staff verifies or returns submissions with a reason.
- Staff evaluates verified submissions against the assigned policy stored in the database.
- Staff records renewal as Approved or Held.
- Dashboard counts, search/filter, role access, and audit history.

### Exclusions
- Editing official registrar grades.
- Automatic release or processing of scholarship payments.
- Replacing the registrar's student information system.
- Public access to confidential academic records.

### Development tasks
1. Model the database, policy records, and access rules.
2. Implement authentication and role-based authorization.
3. Build submission, verification, compliance evaluation, and renewal workflows.
4. Test policy boundaries, validation, role isolation, and audit history.

### Risks and responses
| Risk | Response |
|---|---|
| Incorrect role configuration exposes records | Use database Row Level Security and test both roles |
| Incorrect or missing evidence | Require a reference and let staff return submissions with a reason |

## A2. Stakeholders and Elicitation

### Stakeholders
1. Scholar — submits academic summary and tracks status.
2. Scholarship Staff — verifies records and evaluates compliance.
3. Registrar — remains the source of official academic records.
4. Scholarship Program Coordinator — defines policies and reviews renewal outcomes.

### Actors
The system actors are Scholar and Scholarship Staff. The registrar and program coordinator are stakeholders, but are not separate application roles in this MVP.

### Open-ended elicitation questions
1. How do scholars currently submit semester academic records?
2. How does staff confirm that evidence is acceptable?
3. What should staff do when a submission is incomplete or unreadable?
4. How should the system communicate a policy deficiency to a scholar?
5. What information is required before a renewal decision can be made?
6. What audit information must be retained for later review?

## A3. Requirements and Business Rules

### Functional requirements
- FR-01: The system shall authenticate users before displaying protected pages or data.
- FR-02: The system shall enforce Scholar and Scholarship Staff access through database authorization.
- FR-03: A scholar shall submit GWA, units, failed/INC/dropped counts, and an evidence reference.
- FR-04: The system shall reject GWA outside 1.00–5.00, negative counts, non-integer counts, and duplicate semester submissions.
- FR-05: Staff shall verify a pending submission or return it with a reason.
- FR-06: A returned submission shall be correctable and resubmittable for verification.
- FR-07: Staff shall evaluate only verified submissions using the scholar's active database policy.
- FR-08: The system shall show Compliant or With Deficiency and list all failed policy checks.
- FR-09: Staff shall approve renewal only for compliant submissions or hold a renewal with a reason.
- FR-10: The system shall display dashboard metrics and retain actor/time audit history for key actions.

### Nonfunctional requirements
- NFR-01 Security: protected tables use Row Level Security; non-staff cannot execute staff workflow functions.
- NFR-02 Integrity: duplicate scholar/year/semester submissions are prevented by a database unique constraint.
- NFR-03 Usability: validation and return/deficiency reasons are shown in understandable language.
- NFR-04 Auditability: verification, evaluation, and renewal actions store actor and timestamp.

### Business rules
- BR-01 Excellence Scholar: max GWA 2.00, minimum 18 units, zero failed, zero INC, zero dropped.
- BR-02 Access Scholar: max GWA 2.50, minimum 15 units, zero failed, zero INC, at most one dropped.
- BR-03 GWA must be between 1.00 and 5.00; lower is better; counts and units are nonnegative integers.
- BR-04 Deadline is November 6, 2026, 5:00 PM Asia/Manila. Exactly at the deadline is on time; later is late.
- BR-05 Missing/unverified evidence blocks evaluation. After verification, late submission or any failed condition results in With Deficiency; all checks passing results in Compliant.
- BR-06 Only Scholarship Staff may verify/evaluate/decide; only Compliant submissions can be approved. Held decisions require a reason.

## A4. Use Case Diagram

Actors: Scholar and Scholarship Staff.
System boundary: Student Scholarship Monitoring and Academic Compliance System.

Scholar use cases:
- Sign in
- Submit Academic Summary
- View Submission Status
- Correct Returned Submission

Scholarship Staff use cases:
- Sign in
- Register Scholar
- Verify Submission
- Evaluate Compliance
- View Deficiency Reasons
- Record Renewal Decision
- View Dashboard and Audit History

Required UML relationships to draw:
- Evaluate Compliance <<include>> Check Assigned Policy.
- Evaluate Compliance <<include>> Check Submission Deadline.
- View Deficiency Reasons <<extend>> Evaluate Compliance when policy checks fail.

## A5. Detailed Use Cases

### UC-01 Submit Grades / Academic Summary
- Primary actor: Scholar
- Trigger: Scholar selects Submit Academic Summary.
- Preconditions: User is authenticated, linked to a scholar record, and has no submission for the same academic year and semester.
- Main flow:
  1. Scholar opens the submission form.
  2. System shows the academic summary fields.
  3. Scholar enters GWA, units, failed/INC/dropped counts, and evidence reference.
  4. System validates ranges, integer counts, required evidence, and duplicate term.
  5. System saves the record as Pending Verification with a timestamp.
  6. System records the submission event in audit history.
  7. System displays confirmation and submission status.
- Alternative/exception flows: Invalid GWA/counts are rejected with a message. Missing evidence is rejected. Duplicate term is rejected. If staff returned the record, scholar corrects and resubmits it to Pending Verification.
- Postcondition: A valid record is saved for staff verification.
- Linked requirements: FR-01, FR-03, FR-04, FR-06; BR-03, BR-04.

### UC-02 Evaluate Compliance
- Primary actor: Scholarship Staff
- Trigger: Staff selects Evaluate for a verified submission.
- Preconditions: Staff is authenticated and the submission is Verified.
- Main flow:
  1. Staff opens the submission.
  2. System loads the active policy assigned to the scholar from the database.
  3. System checks GWA, units, failed, INC, dropped, and submission deadline.
  4. System collects all failed checks and reasons.
  5. System sets Compliant if no checks fail; otherwise With Deficiency.
  6. System saves the result, evaluator, timestamp, and audit entry.
  7. System displays the status and deficiency reasons.
- Alternative/exception flows: Pending or Returned submissions cannot be evaluated. Missing active policy blocks evaluation. Unauthorized users are rejected.
- Postcondition: Compliance status and reasons are saved.
- Linked requirements: FR-02, FR-07, FR-08, FR-10; BR-01, BR-02, BR-04, BR-05.

### ERD (logical relationships)
- AUTH_USERS 1 — 1 PROFILES
- AUTH_USERS 0..1 — 0..1 SCHOLARS (linked login)
- SCHOLARSHIP_POLICIES 1 — many SCHOLARS
- SCHOLARS 1 — many ACADEMIC_SUBMISSIONS
- ACADEMIC_SUBMISSIONS 1 — 0..1 RENEWAL_DECISIONS
- AUTH_USERS 1 — many AUDIT_LOGS

Primary keys: profiles.user_id; scholarship_policies.id; scholars.id; academic_submissions.id; renewal_decisions.id; audit_logs.id. Foreign keys connect profiles/scholars to auth users, scholars to policy, submissions to scholar, and decisions to submission.

## A6. Requirements Traceability (initial draft)

| FR | Actor | Use case | BR | Implemented screen/function | Test | Expected result |
|---|---|---|---|---|---|---|
| FR-03 | Scholar | Submit Academic Summary | BR-03 | Dashboard submission form | TC07 | Valid data saves; invalid values rejected |
| FR-05 | Scholarship Staff | Verify Submission | BR-05 | Staff dashboard / staff_verify_submission | TC06 | Pending can be verified or returned with reason |
| FR-07 | Scholarship Staff | Evaluate Compliance | BR-01–05 | staff_evaluate_submission database function | TC01–TC06 | Correct policy-based status and reasons |
| FR-09 | Scholarship Staff | Record Renewal Decision | BR-06 | Staff dashboard / staff_decide_renewal | TC10 | Only compliant record can be approved |

## Implementation status and limitations

The repository includes the sign-in page, role-based dashboard, scholar submission and correction form, staff registration and review interface, dashboard metrics, search/filter controls, and audit-history interface. These screens still require configuration and end-to-end testing against the Supabase project before they can be described as fully working.

- The evidence field stores a grade-document reference; actual file upload/private storage is not implemented.
- Create and record actual results for TC01–TC10 after configuring Supabase. Do not claim tests passed before they are run.
- Confirm that the final database schema, frontend table/field names, and role policies match before running the SQL or demonstrating the system.
