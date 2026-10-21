# Functional Test Cases

Use synthetic records only. Record the input, expected result, actual result, pass/fail, and screenshot for each test.

| Test ID | Scenario | Expected result |
|---|---|---|
| TC01 | Excellence Scholar: GWA 2.00, 18 units, no failed/INC/dropped, submitted exactly by deadline | After verification and evaluation, Compliant. Boundary value 2.00 passes. |
| TC02 | Excellence Scholar: GWA 2.01, 18 units, no other deficiency | With Deficiency, with a GWA reason. |
| TC03 | Access Scholar: GWA 2.50, 15 units, 0 failed, 0 INC, 1 dropped | Compliant because Access policy permits one dropped subject. |
| TC04 | Access Scholar: GWA 2.50, 14 units, 0 failed, 1 INC, 0 dropped | With Deficiency, listing insufficient units and INC. |
| TC05 | Excellence Scholar: GWA 1.75, 18 units, 1 failed, submitted one minute after deadline | With Deficiency, listing failed subject and late submission. |
| TC06 | Attempt to evaluate a Pending Verification or Returned submission | Evaluation is blocked; renewal cannot be approved. |
| TC07 | Duplicate scholar/year/semester or GWA 0.50 / negative count | Duplicate and invalid values are rejected. |
| TC08 | Scholar tries to view another scholar's record or perform staff actions | Row Level Security blocks access; staff RPC rejects non-staff users. |
| TC09 | Staff returns a submission with reason; scholar corrects and resubmits | Corrected submission returns to Pending Verification; audit history records workflow actions. |
| TC10 | Staff approves compliant submission and attempts to approve deficient submission | Compliant renewal can be Approved; deficient approval is rejected; staff may Hold with reason. |

## Required synthetic dataset (2026–2027, Semester 1)

| ID | Policy | GWA | Units | Failed | INC | Dropped | Timing / state | Expected |
|---|---|---:|---:|---:|---:|---:|---|---|
| B01 | Excellence | 2.00 | 18 | 0 | 0 | 0 | At deadline | Compliant |
| B02 | Excellence | 2.01 | 18 | 0 | 0 | 0 | On time | With Deficiency: GWA |
| B03 | Access | 2.50 | 15 | 0 | 0 | 1 | On time | Compliant |
| B04 | Access | 2.50 | 14 | 0 | 1 | 0 | On time | With Deficiency: units + INC |
| B05 | Excellence | 1.75 | 18 | 1 | 0 | 0 | One minute late | With Deficiency: failed + late |
| B06 | Access | 2.25 | 15 | 0 | 0 | 0 | Pending verification | Evaluation/approval blocked |

Note: To test exact deadline timing reliably, use a controlled test database or test-only timestamp. Do not alter real student records to simulate dates.
