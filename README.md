# SAD Midterm Scholarship System

A browser-based Student Scholarship Monitoring and Academic Compliance System for the Systems Analysis and Design laboratory examination.

## Technology
- HTML, CSS, JavaScript
- Supabase Authentication and PostgreSQL
- GitHub Pages for static hosting (deployment must be confirmed in repository settings)

## Roles
- **Scholar:** selects an academic year and semester, submits an academic summary, views status, and corrects returned submissions.
- **Scholarship Staff:** registers scholars, assigns a persisted scholarship policy, verifies submissions, evaluates policy compliance, records renewal decisions, and reviews audit history.

## Scholarship rules
- **Excellence Scholar:** maximum GWA 2.00, at least 18 units, zero failed/INC/dropped subjects.
- **Access Scholar:** maximum GWA 2.50, at least 15 units, zero failed/INC subjects, and at most one dropped subject.
- **Submission deadline:** November 6, 2026 at 5:00 PM Asia/Manila. Exactly at the deadline is on time; a later submission is late.

The Registrar remains the source of official grades. This system monitors submitted summaries and scholarship compliance; it does not edit official grades or release scholarship payments.

## Repository map
- index.html — sign-in page
- dashboard.html — scholar/staff dashboard and workflow screens
- css/style.css — styling
- js/supabase.js — Supabase Project URL and public publishable/anon key
- js/auth.js — sign-in
- js/dashboard.js — submissions, verification, evaluation, renewal, term-based metrics, search, filtering, and audit history
- docs/ANALYSIS-REPORT.md — analysis and design report
- docs/DIAGRAMS.md — use-case and ERD diagrams
- docs/TEST-CASES.md — TC01–TC10 and synthetic scenarios
- docs/TRACEABILITY-MATRIX.md — requirement-to-implementation mapping
- docs/SETUP.md — setup and test instructions

## Supabase setup
The database schema, seed records, RLS policies, triggers, and RPC functions are supplied in a separate SQL script, not mixed into this GitHub application repository. Follow docs/SETUP.md and the separate Supabase instructions. Never put a service-role key, secret key, or password in frontend code.

## Test status
Run TC01–TC10 against the configured website and Supabase project. Record actual results and evidence before claiming successful tests. A source file or UI screen alone is not proof that a database workflow passed.

## Known limitation
The evidence field stores a grade-document reference; actual private file upload/storage is not implemented. GitHub Pages deployment and Supabase connectivity must be verified in the browser before being described as live and functional.
