# SAD Midterm Scholarship System

A browser-based Student Scholarship Monitoring and Academic Compliance System for the Systems Analysis and Design laboratory examination.

## Technology
- HTML, CSS, JavaScript
- Supabase Authentication and PostgreSQL
- GitHub Pages for static hosting (deployment must be confirmed in repository settings)

## Roles
- **Scholar:** submits a semester academic summary, views status, and corrects returned submissions.
- **Scholarship Staff:** registers scholars, verifies submissions, evaluates policy compliance, records renewal decisions, and reviews audit history.

## Scholarship rules
- **Excellence Scholar:** maximum GWA 2.00, at least 18 units, zero failed/INC/dropped subjects.
- **Access Scholar:** maximum GWA 2.50, at least 15 units, zero failed/INC subjects, and at most one dropped subject.
- **Submission deadline:** November 6, 2026 at 5:00 PM Asia/Manila.

The Registrar remains the source of official grades. This system monitors submitted summaries and scholarship compliance; it does not edit official grades or release scholarship payments.

## Repository map
- `index.html` — sign-in page
- `dashboard.html` — scholar/staff dashboard and workflow screens
- `css/style.css` — styling
- `js/supabase.js` — Supabase URL and public anon/publishable key
- `js/auth.js` — sign-in
- `js/dashboard.js` — submission, verification, evaluation, renewal, dashboard, filtering, and audit history
- `sql/01_schema_and_security.sql` — schema, indexes, profile trigger, and RLS policies
- `sql/02_seed_data.sql` — policy records and synthetic B01–B06 test data
- `sql/staff_functions.sql` — staff-only verification, evaluation, and renewal functions
- `docs/ANALYSIS-REPORT.md` — analysis and design draft
- `docs/DIAGRAMS.md` — use-case and ERD diagrams in Mermaid
- `docs/TEST-CASES.md` — TC01–TC10 and synthetic scenarios
- `docs/SETUP.md` — setup and test instructions

## Setup
Follow `docs/SETUP.md`. On a new Supabase project, run the three SQL files in the order listed there. Replace the URL and public anon/publishable key in `js/supabase.js`. Never place a service-role key, secret key, or password in frontend code.

## Test status
The code and SQL require end-to-end testing in the configured Supabase project. Record actual results and evidence for TC01–TC10 before claiming successful tests. A source file or UI screen alone is not proof that a database workflow passed.

## Known limitation
The evidence field stores a document reference; actual private file upload/storage is not implemented. GitHub Pages deployment and Supabase connectivity must be verified in the browser before being described as live and functional.
