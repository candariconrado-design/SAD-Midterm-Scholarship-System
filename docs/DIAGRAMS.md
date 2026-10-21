# UML Use Case Diagram and ERD

These diagrams represent the scope and core data model required by the examination. GitHub renders Mermaid diagrams in the Markdown preview.

## Use Case Diagram

```mermaid
flowchart LR
  Scholar([Scholar])
  Staff([Scholarship Staff])
  subgraph System["Student Scholarship Monitoring and Academic Compliance System"]
    Login([Sign in])
    Submit([Submit Academic Summary])
    Status([View Submission Status])
    Correct([Correct Returned Submission])
    Register([Register Scholar and Assign Policy])
    Verify([Verify or Return Submission])
    Evaluate([Evaluate Compliance])
    Policy([Check Assigned Policy])
    Deadline([Check Submission Deadline])
    Reasons([View Deficiency Reasons])
    Renewal([Record Renewal Decision])
    Dashboard([View Dashboard, Search and Filter])
    History([View Decision and Audit History])
  end
  Scholar --> Login
  Scholar --> Submit
  Scholar --> Status
  Scholar --> Correct
  Staff --> Login
  Staff --> Register
  Staff --> Verify
  Staff --> Evaluate
  Staff --> Renewal
  Staff --> Dashboard
  Staff --> History
  Evaluate -. "<<include>>" .-> Policy
  Evaluate -. "<<include>>" .-> Deadline
  Reasons -. "<<extend>> when checks fail" .-> Evaluate
```

## Entity Relationship Diagram

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : has
  SCHOLARSHIP_PROGRAMS ||--o{ SCHOLARS : assigned_to
  SCHOLARS ||--o{ GRADE_SUBMISSIONS : submits
  GRADE_SUBMISSIONS ||--o{ COMPLIANCE_EVALUATIONS : evaluated_as
  GRADE_SUBMISSIONS ||--o{ RENEWAL_DECISIONS : receives
  AUTH_USERS o|--o{ GRADE_SUBMISSIONS : verifies
  AUTH_USERS ||--o{ RENEWAL_DECISIONS : decides
  AUTH_USERS ||--o{ AUDIT_LOGS : performs
  PROFILES {
    uuid id PK
    text full_name
    text role
  }
  SCHOLARSHIP_PROGRAMS {
    uuid id PK
    text program_name
    numeric required_gwa
    integer min_units
    boolean allow_failing_grade
    boolean active
  }
  SCHOLARS {
    uuid id PK
    text student_id UK
    text full_name
    text degree_program
    text year_level
    uuid scholarship_id FK
    text status
  }
  GRADE_SUBMISSIONS {
    uuid id PK
    uuid scholar_id FK
    text academic_year
    text semester
    numeric gwa
    integer units_enrolled
    integer failed_subjects
    integer incomplete_subjects
    integer dropped_subjects
    text evidence_reference
    timestamptz submitted_at
    text submission_status
    uuid verified_by FK
    timestamptz verified_at
  }
  COMPLIANCE_EVALUATIONS {
    uuid id PK
    uuid submission_id FK
    text compliance_result
    text deficiency_reasons
    timestamptz evaluated_at
  }
  RENEWAL_DECISIONS {
    uuid id PK
    uuid submission_id FK
    text decision
    text decision_reason
    uuid decided_by FK
    timestamptz decided_at
  }
  AUDIT_LOGS {
    bigint id PK
    uuid actor_id FK
    text action
    timestamptz created_at
  }
```

## Relationship notes
- Each authenticated account has a profile and role.
- A scholarship program can be assigned to many scholars.
- Each scholar can submit one record per academic year and semester; duplicate term submissions must be blocked.
- Each submission has verification status, compliance evaluation history, and renewal decision history.
- A submission can be Verified while its compliance result is With Deficiency and the scholarship award remains Active. These statuses are separate.
- Backend/database access rules must restrict scholars to their own records and reserve verification, evaluation, and renewal actions for Scholarship Staff.
