# SAD Midterm Scholarship System

A web-based Student Scholarship Monitoring and Academic Compliance System for the Systems Analysis and Design laboratory examination.

## Technology
- HTML, CSS, JavaScript
- Supabase Auth and PostgreSQL with Row Level Security
- GitHub Pages can host the static front end

## Project status
Starter project setup. Follow `docs/SETUP.md` to configure Supabase before testing. Do not put a Supabase service-role key in browser code.

## Roles
- **Scholar:** submits semester academic summary and evidence reference, corrects returned submissions, and checks status.
- **Scholarship Staff:** registers scholars, verifies submissions, evaluates compliance using database policy records, and records renewal decisions.

## Academic policy
The registrar remains the source of official grades. This application tracks submitted summaries and compliance; it does not change official grades or release scholarship payments.

## Deadline
November 6, 2026 at 5:00 PM Asia/Manila.

## Files
- `index.html` — login page
- `dashboard.html` — role-based dashboard
- `css/style.css` — shared styling
- `js/supabase.js` — Supabase client configuration
- `js/auth.js` — sign-in/sign-out
- `js/dashboard.js` — scholar and staff actions
- `supabase/schema.sql` — database tables, policies, RPC functions, and policy seed data
- `docs/SETUP.md` — setup instructions
- `docs/ANALYSIS-REPORT.md` — analysis and design report outline
- `docs/TEST-CASES.md` — required test cases

## Security note
Use the Supabase project URL and **anon/publishable key** in `js/supabase.js`. Never put a service-role key or database password in frontend files. Staff accounts should be created by the project owner and assigned the `staff` role through a trusted database/admin process.
