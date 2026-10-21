# Fix buttons that do not work

## Why Verify / Evaluate / Approve / Hold fail

Those buttons call **database functions (RPC)**:

- `staff_verify_submission`
- `staff_evaluate_submission`
- `staff_decide_renewal`

If the function is missing, outdated, or your login is not `role = staff`, the button shows an error.

## Fix steps

### 1. Confirm your account is Staff
In SQL Editor:

```sql
SELECT id, full_name, role FROM public.profiles WHERE id = auth.uid();
-- Or by email after looking up the Auth UUID:
-- SELECT * FROM public.profiles WHERE id = 'YOUR-USER-UUID';
```

`role` must be exactly `staff` (or `admin`).

```sql
UPDATE public.profiles SET role = 'staff', full_name = 'Scholarship Staff'
WHERE id = 'YOUR-STAFF-UUID';
```

Sign out and sign in again.

### 2. Install / refresh the RPC functions
1. Open **SQL Editor**
2. Paste the full contents of `sql/staff_functions.sql`
3. Run

### 3. Renewal table unique key (if Approve/Hold errors on conflict)

```sql
ALTER TABLE public.renewal_decisions
  ADD CONSTRAINT renewal_decisions_submission_id_key UNIQUE (submission_id);
```

(Only if the constraint does not already exist.)

### 4. When each button appears

| Button | Only shown when |
|--------|------------------|
| Verify / Return | Verification status = **Pending** |
| Evaluate | Status = **Verified** and compliance still **Pending** |
| Approve | Verified + compliance = **Compliant** |
| Hold | Verified + compliance already evaluated |

If a submission is still Pending, Evaluate/Approve will not appear — that is correct.

### 5. Read the red error message
After this update, failed buttons show the real database message at the top of the page (e.g. "Only verified submissions can be evaluated").

### 6. Browser console
Press F12 → Console. Any red JS error there also blocks buttons.
