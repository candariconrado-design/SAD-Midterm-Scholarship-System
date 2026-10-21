# UML Use Case Diagram and ERD

These Mermaid diagrams are source diagrams. GitHub renders Mermaid in Markdown preview. Open this file on GitHub and use its preview to capture the diagrams for the examination report.

## Use Case Diagram

\`\`\`mermaid
flowchart LR
  Scholar([Scholar])
  Staff([Scholarship Staff])
  subgraph System["Student Scholarship Monitoring and Academic Compliance System"]
    Login([Sign in])
    Submit([Submit Academic Summary])
    Status([View Submission Status])
    Correct([Correct Returned Submission])
    Register([Register Scholar])
    Verify([Verify Submission])
    Evaluate([Evaluate Compliance])
    Policy([Check Assigned Policy])
    Deadline([Check Submission Deadline])
    Reasons([View Deficiency Reasons])
    Renewal([Record Renewal Decision])
    Dashboard([View Dashboard and Audit History])
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
  Evaluate -. "<<include>>" .-> Policy
  Evaluate -. "<<include>>" .-> Deadline
  Reasons -. "<<extend>> when checks fail" .-> Evaluate
\`\`\`

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : has
  AUTH_USERS o|--o| SCHOLARS : linked_login
  SCHOLARSHIP_POLICIES ||--o{ SCHOLARS : assigned_to
  SCHOLARS ||--o{ ACADEMIC_SUBMISSIONS : submits
  ACADEMIC_SUBMISSIONS ||--o| RENEWAL_DECISIONS : receives
  AUTH_USERS o|--o{ ACADEMIC_SUBMISSIONS : verifies_or_evaluates
  AUTH_USERS o|--o{ AUDIT_LOGS : performs
  PROFILES {
    uuid user_id PK
    text full_name
    text role
  }
  SCHOLARSHIP_POLICIES {
    uuid id PK
    text policy_name
    numeric max_gwa
    integer min_units
  }
  SCHOLARS {
    uuid id PK
    uuid user_id FK
    text student_id UK
    text full_name
    text program
    uuid policy_id FK
  }
  ACADEMIC_SUBMISSIONS {
    uuid id PK
    uuid scholar_id FK
    text academic_year
    integer semester
    numeric gwa
    integer units_completed
    text verification_status
    text compliance_status
  }
  RENEWAL_DECISIONS {
    uuid id PK
    uuid submission_id FK
    text decision
    uuid decided_by FK
  }
  AUDIT_LOGS {
    bigint id PK
    uuid actor_id FK
    text action
    timestamptz created_at
  }
\`\`\`

## Relationship notes
- One scholarship policy can be assigned to many scholars.
- One scholar can submit academic records across multiple academic terms.
- Each submission can have at most one current renewal decision.
- User roles are stored in profiles; application actions are restricted with Row Level Security and staff-only database functions.
