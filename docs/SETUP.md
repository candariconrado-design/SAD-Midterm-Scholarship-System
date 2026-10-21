# Setup Guide

## 1. Create a Supabase project
1. Create a new project in Supabase for this midterm project.
2. Open **Project Settings → API** (or API Keys).
3. Copy the Project URL and the anon/publishable key.
4. Edit `js/supabase.js` and replace both placeholder values. Never use the `service_role` key in the browser.

## 2. Create the database
1. Open **SQL Editor** in Supabase.
2. Open `supabase/schema.sql` in this GitHub repository.
3. Copy the complete SQL into the SQL Editor and run it.
4. Confirm the policy records were inserted.

## 3. Create user accounts
1. In Supabase, open **Authentication → Users** and create an account for the staff member and scholar test users.
2. The database trigger creates a profile with the default `scholar` role.
3. To grant the trusted staff account the staff role, run this in the SQL Editor after replacing the email:
   ```sql
   update public.profiles
   set role = 'staff'
   where user_id = (
     select id from auth.users where email = 'staff@example.com'
   );
   ```
   Only the project owner/instructor should do this. Do not let users choose their own role.
4. To link a scholar login to a scholar record, create a scholar record as staff or use SQL Editor. Example after changing the values:
   ```sql
   insert into public.scholars (user_id, student_id, full_name, program, policy_id)
   select u.id, '2026-0001', 'Sample Scholar', 'BSIT',
          p.id
   from auth.users u
   cross join public.scholarship_policies p
   where u.email = 'scholar@example.com'
     and p.policy_name = 'Access Scholar';
   ```

### Link an existing scholar login to a scholar record
If you registered a scholar in the staff dashboard first, link their already-created Supabase Auth account in the SQL Editor:
```sql
update public.scholars
set user_id = (select id from auth.users where email = 'scholar@example.com')
where student_id = '2026-0001';
```
Use the actual email and student ID. A scholar login must be linked to a record before they can submit.

### Optional synthetic test records
In a development/test project only, run supabase/test-data.sql after schema.sql to create B01–B06. These are test-only records with no linked scholar accounts. Staff can verify B01–B05 and evaluate them; keep B06 pending to test the verification gate. Do not seed test records into a production database.

## 4. Open and host the site
- For quick testing, use a local static server or open `index.html` in a browser. Authentication/database access requires the Supabase project to be configured.
- For GitHub Pages: repository **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Wait for deployment, then open the Pages URL.
- Add the deployed site URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs** if needed.

## 5. Important notes
- The MVP stores an evidence document reference, not an uploaded file. Use a private storage bucket and storage policies if actual file upload is required.
- The deadline is November 6, 2026 at 5:00 PM Asia/Manila.
- This is a school MVP. Run every test in `docs/TEST-CASES.md` and capture screenshots before submission.
- Do not publish real student records or passwords in the public repository.
