# Setup Guide

## 1. Configure Supabase
1. Create or open the Supabase project for this examination.
2. Open **Project Settings → API Keys** and copy the Project URL and public anon/publishable key.
3. Set those values in `js/supabase.js`.
4. Use only the public anon/publishable key in browser code. Never commit a service-role key, secret key, or account password.

## 2. Create the database (new project only)
Run these files in Supabase **SQL Editor**, in this order:
1. `sql/01_schema_and_security.sql` — creates tables, trigger, indexes, and Row Level Security policies.
2. `sql/02_seed_data.sql` — inserts the Excellence/Access policies and synthetic B01–B06 records.
3. `sql/staff_functions.sql` — installs the staff verification, compliance, and renewal RPC functions.

These are intended for a new examination database. Review them before running against an existing database, and do not run destructive changes against data you need to keep. If tables already exist, compare their columns and policies before applying the setup.

## 3. Create and link test accounts
1. In Supabase, open **Authentication → Users** and create a staff account and scholar account(s).
2. New Auth accounts receive a default `scholar` profile. Promote the designated staff account to `staff` in `public.profiles` using its Auth UUID from the dashboard.
3. Link each scholar's Auth UUID to the matching synthetic scholar row by setting `scholars.user_id`.
4. Sign out and sign back in after role changes.
5. Keep passwords and private account access details out of GitHub and screenshots. Share test access privately with the instructor if required.

## 4. Run and host
- For local testing, serve the repository with a static web server. Authentication and database actions require a correctly configured Supabase project.
- For GitHub Pages, open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
- Wait for deployment and open the Pages URL shown in repository settings.
- Add that deployed URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs** if authentication redirects require it.

## 5. Functional testing
Run TC01–TC10 from `docs/TEST-CASES.md`. Record the actual result, pass/fail, and evidence reference for each test. Do not mark a test passed until it has actually been run. Use only synthetic records.

## Limitations to disclose
- The evidence field stores a grade-document reference; actual private file upload/storage is not implemented.
- The app does not connect to the Registrar's system, send SMS, process scholarship payments, or alter official grades.
- B01–B06 are synthetic test records. Link Auth users to them only for controlled testing.
- Confirm the deployed website and Supabase connection work before reporting the system as operational.
