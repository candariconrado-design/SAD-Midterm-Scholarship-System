# Setup Guide

## 1. Configure Supabase connection
1. Open the Supabase project used by this system.
2. Go to **Project Settings → API Keys**.
3. Copy the **Project URL** and the **publishable/anon key**.
4. Put those two public values in js/supabase.js.
5. Never place a service-role key, secret key, database password, or user password in GitHub/browser code.

## 2. Install the Supabase database code
The SQL migration and seed code are supplied separately from the GitHub application files, as requested, so SQL is not mixed into the front-end source repository.

- For a new Supabase project: first install the schema, then the synthetic seed records, then the security/workflow migration supplied with the project instructions.
- For an existing project that already has the tables and synthetic data: run only the migration supplied for the existing schema.
- Do not run an initial schema script on top of a database containing records you need to keep.
- Run SQL from **Supabase Dashboard → SQL Editor → New query**. Paste the complete script, click **Run**, and confirm the success message.
- The separate SQL instructions explain which script to run and in what order. Do not run the old staff_functions.sql file from earlier copies; its seed insert omits the required required_gwa field.

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

5. For a scholar account, copy its Auth **User UID**. Register the scholar in the Staff Dashboard and paste the UID in **Supabase Auth User UID**. If the scholar record already exists, update its user_id in the Supabase Table Editor or SQL Editor.
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
