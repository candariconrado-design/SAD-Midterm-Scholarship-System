# Setup Guide

## 1. Create a Supabase project
1. Create a new Supabase project for this examination.
2. Open **Project Settings → API** (or **API Keys**).
3. Copy the Project URL and anon/publishable key.
4. In this repository, open `js/supabase.js` and replace the two placeholder values.
5. Never put a service-role key or account password in frontend code or screenshots.

## 2. Create the database
1. Open **SQL Editor** in Supabase.
2. Use the database SQL supplied separately for this project.
3. Review the script and confirm that it is intended for a new examination project before running it.
4. Run the SQL, then confirm that the two required scholarship policy records exist.
5. Do not run a setup script against a database that contains data you need to keep.

## 3. Create test accounts and assign roles
1. In Supabase, open **Authentication → Users** and create one staff test account and at least one scholar test account.
2. The database setup should create the profile associated with each Auth account.
3. Assign the staff test account the Scholarship Staff role using the database instructions supplied with the SQL. Do not allow users to choose or change their own role.
4. Link the scholar Auth account to its scholar record using the database instructions supplied with the SQL.
5. Use fictional test data only. Share test-account access privately with the instructor, not in this public repository.

## 4. Run and host the site
- For local testing, serve the repository with a simple static web server. Authentication and database operations require a configured Supabase project.
- For GitHub Pages, open repository **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
- Wait for deployment and open the Pages URL.
- If sign-in redirects fail, add the deployed URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs**.

## 5. Test before submission
Run TC01–TC10 in `docs/TEST-CASES.md`. Record the actual result, pass/fail, and evidence reference for every test. Report defects honestly; do not mark a test as passed without running it.

## Important limitations
- The evidence field currently stores a grade-document reference, not an uploaded file.
- The system is an examination MVP. It does not connect to the Registrar system, send SMS, process scholarship payments, or alter official grades.
- Do not publish real student records, passwords, or private test-account details in the repository.
