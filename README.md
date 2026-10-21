# SAD Midterm Scholarship System

A browser-based Student Scholarship Monitoring and Academic Compliance System for the Systems Analysis and Design laboratory examination.

## Technology
- HTML, CSS, and JavaScript
- Supabase Authentication and PostgreSQL
- GitHub Pages for static hosting, if available

## Roles
- **Scholar:** submits a semester academic summary, views submission status, and corrects returned submissions.
- **Scholarship Staff:** registers scholars, verifies submissions, evaluates compliance using assigned scholarship policies, records renewal decisions, and views audit history.

## Academic policy
The Registrar remains the source of official grades. This system monitors submitted academic summaries and scholarship compliance. It does not change official grades or release scholarship payments.

## Required policy rules
- **Excellence Scholar:** maximum GWA 2.00, at least 18 units, no failed subjects, no INC grades, and no dropped subjects.
- **Access Scholar:** maximum GWA 2.50, at least 15 units, no failed subjects, no INC grades, and at most one dropped subject.
- Submission deadline: November 6, 2026 at 5:00 PM, Asia/Manila time.

## Main files
- `index.html` — sign-in page
- `dashboard.html` — scholar and staff dashboard
- `css/style.css` — page styling
- `js/supabase.js` — Supabase project URL and anon/publishable key
- `js/auth.js` — sign-in workflow
- `js/dashboard.js` — submission, verification, evaluation, renewal, dashboard, and history workflows
- `docs/ANALYSIS-REPORT.md` — analysis and design report
- `docs/DIAGRAMS.md` — use case diagram and ERD
- `docs/TEST-CASES.md` — required test cases TC01–TC10
- `docs/SETUP.md` — setup and run instructions

## Setup
Follow `docs/SETUP.md`. The database SQL is supplied separately and should be run in the project's Supabase SQL Editor. Replace the placeholders in `js/supabase.js` with the project's URL and anon/publishable key. Never put a service-role key or password in frontend code.

## Testing status
The source code requires configuration and end-to-end testing in the user's Supabase project. Do not report a test as passed until it has actually been run and evidence has been recorded. Use synthetic student records only.

## Known limitation
The evidence field stores a grade-document reference; actual file upload/private storage is not included in this MVP.
