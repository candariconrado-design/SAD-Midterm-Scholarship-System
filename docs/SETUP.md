# Setup Guide

## 1. Configure Supabase connection
1. Open the Supabase project used by this system.
2. Go to **Project Settings → API Keys**.
3. Copy the **Project URL** and the **publishable/anon key**.
4. Put those two public values in js/supabase.js.
5. Never place a service-role key, secret key, database password, or user password in GitHub/browser code.

## 2. Install the separate Supabase SQL script
The database code is supplied separately from the GitHub application files. Do not put SQL scripts inside the GitHub front-end folders.

1. Open **Supabase Dashboard → SQL Editor**.
2. Click **New query**.
3. Open the separate file named SAD_Midterm_Supabase_Setup.sql.
4. Copy the complete contents and paste them into the SQL Editor.
5. Click **Run** and wait for the success result.
6. The script creates or confirms the required tables, policies, triggers, staff RPC functions, scholarship policies, and six synthetic B01–B06 test records.
7. If your Supabase project contains important records, make a backup first. The script is written for this project's schema and should not be used against an unrelated database.

Do not run older copies of sql/01_schema_and_security.sql, sql/02_seed_data.sql, or sql/staff_functions.sql. The old staff_functions.sql had an insert that omitted required_gwa and could stop the script.

## 3. Create test accounts and link scholars
1. Open **Authentication → Users → Add user**.
2. Create one Scholarship Staff account and the scholar test accounts you need. Use synthetic/test email addresses and strong temporary passwords.
3. The database trigger creates a profiles row with role scholar automatically for every new Auth account.
4. To promote the staff test account, copy its **User UID** from Authentication → Users, then run this in the Supabase SQL Editor, replacing the UUID and display name:

   ```sql
   update public.profiles
   set full_name = 'Scholarship Staff', role = 'staff'
   where id = 'PASTE-STAFF-USER-UUID-HERE';
   ```

5. For each scholar account, copy its Auth **User UID**. Register the matching scholar in the Staff Dashboard and paste the UID in **Supabase Auth User UID**. This links the login to the scholar record.
6. Sign out and sign in again after changing a role.

## 4. Run and host the website
- GitHub Pages: open repository **Settings → Pages → Build and deployment**.
- Select **Deploy from a branch**, choose main and /(root), then save.
- Wait for the deployment and open the Pages URL shown in repository settings.
- Add the deployed URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs** if required.

## 5. Test the system
Run TC01–TC10 from docs/TEST-CASES.md against the configured website and Supabase database. Record the actual result, pass/fail, and screenshot evidence for every test. Do not mark a test passed until it has actually been run. Use only synthetic records.

## Important scope notes
- The evidence field stores a document reference only. Actual private file upload/storage is not implemented.
- The Registrar remains the source of official grades. This application does not alter official grades or release scholarship payments.
- No live Registrar API, SMS gateway, machine learning, payment module, or full appeal workflow is required by this examination.
- B01–B06 are synthetic test records, not official student grades.
- The examination deadline is November 6, 2026 at 5:00 PM Asia/Manila. The exact deadline is on time; submissions after it are late.
- Test results remain Not Run until you execute the tests and capture evidence.
