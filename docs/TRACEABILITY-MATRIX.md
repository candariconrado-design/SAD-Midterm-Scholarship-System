# Requirements Traceability Matrix

This matrix maps each functional requirement to the relevant actor/use case, business rule, implementation area, and functional test. Test outcomes must be filled in only after actual execution.

| Requirement | Actor | Use case | Business rule | Implementation area | Test ID | Expected result |
|---|---|---|---|---|---|---|
| FR-01 | Scholar and Staff | Sign in | — | `index.html`, `js/auth.js` | TC08 | Protected pages require authentication. |
| FR-02 | Scholar and Staff | Role-based access | BR-06 | `js/dashboard.js`, RLS policies, staff RPC functions | TC08 | Scholar cannot access another scholar's record or staff-only actions. |
| FR-03 | Scholar | Submit Academic Summary | BR-03 | Dashboard submission form and `submitAcademicSummary` | TC07 | Valid summary is saved as Pending. |
| FR-04 | Scholar | Validate Academic Summary | BR-03 | `numberValue`, database constraints, unique term constraint | TC07 | Invalid values and duplicate term are rejected. |
| FR-05 | Staff | Verify or Return Submission | BR-05, BR-06 | `staff_verify_submission` | TC06, TC09 | Pending record can be verified or returned with a reason. |
| FR-06 | Scholar | Correct Returned Submission | BR-05 | Correction form and resubmission flow | TC09 | Corrected submission returns to Pending. |
| FR-07 | Staff | Evaluate Compliance | BR-01 to BR-05 | `staff_evaluate_submission` | TC01–TC06 | Only verified submissions are evaluated against the assigned policy. |
| FR-08 | Both | View Compliance Result | BR-01 to BR-05 | `compliance_status`, `deficiency_reasons` | TC01–TC05 | Status and applicable deficiency reasons are displayed. |
| FR-09 | Staff | Record Renewal Decision | BR-06 | `staff_decide_renewal` | TC10 | Only compliant submissions can be approved; Held requires a reason. |
| FR-10 | Staff | View Dashboard and Audit History | BR-06 | Dashboard metrics, filters, and `loadAuditHistory` | TC09–TC10 | Dashboard metrics and actor/time history are displayed. |

## Execution result template

| Test ID | Actual result | Pass/Fail/Blocked | Evidence filename | Notes |
|---|---|---|---|---|
| TC01 | Not run | Not Run | — | Fill after actual test. |
| TC02 | Not run | Not Run | — | Fill after actual test. |
| TC03 | Not run | Not Run | — | Fill after actual test. |
| TC04 | Not run | Not Run | — | Fill after actual test. |
| TC05 | Not run | Not Run | — | Fill after actual test. |
| TC06 | Not run | Not Run | — | Fill after actual test. |
| TC07 | Not run | Not Run | — | Fill after actual test. |
| TC08 | Not run | Not Run | — | Fill after actual test. |
| TC09 | Not run | Not Run | — | Fill after actual test. |
| TC10 | Not run | Not Run | — | Fill after actual test. |

Do not mark tests as passed without executing them against the configured system. Use synthetic data only and do not include passwords, secret keys, or real student personal data.
