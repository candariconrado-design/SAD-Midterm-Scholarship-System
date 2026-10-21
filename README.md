# SAD Midterm Scholarship System

A web-based Student Scholarship Monitoring and Academic Compliance System for the Systems Analysis and Design laboratory examination.

## Technology
- HTML, CSS, JavaScript
- Supabase Auth and PostgreSQL with Row Level Security
- GitHub Pages for static hosting (optional)

## Roles
- **Scholar:** submits semester academic summary and evidence reference, views status, and corrects returned submissions.
- **Scholarship Staff:** registers scholars, verifies submissions, evaluates compliance using database policy records, records renewal decisions, and views audit history.

## Academic policy
The registrar remains the source of official grades. This application tracks submitted summaries and compliance; it does not change official grades or release scholarship payments.

## Deadline
November 6, 2026 at 5:00 PM Asia/Manila.

## Important files
- index.html — login page
- dashboard.html — role-based dashboard
- css/style.css — responsive styling
- js/supabase.js — Supabase client configuration
- js/auth.js — sign-in/sign-out
- js/dashboard.js — scholar and staff workflows
- supabase/schema.sql — database tables, security policies, policy data, and staff-only workflow functions
- supabase/test-data.sql — optional synthetic records B01–B06 for a development/test database only
- docs/SETUP.md — setup instructions
- docs/ANALYSIS-REPORT.md — analysis and design report draft
- docs/DIAGRAMS.md — Mermaid use case and ERD diagrams
- docs/TEST-CASES.md — test cases TC01–TC10

## Setup
Follow docs/SETUP.md. First run supabase/schema.sql in a new Supabase project, then set the project URL and anon/publishable key in js/supabase.js. Do not put a service-role key in frontend code.

## Known limitations
- Evidence is currently stored as a document reference; actual file upload/private storage is not included.
- Test the project using synthetic data and complete all TC01–TC10 results before submission.
- The front end and database scripts have been added to the repository, but they still require configuration and end-to-end testing in your Supabase project.
