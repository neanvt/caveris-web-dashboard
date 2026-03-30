# CAVERIS Web Dashboard – Scratchpad

## Changes Log

---

### 2026-03-30 – Reset Password Button in Edit Manager & Edit Verifier Modals

**Files Modified:**
- `src/components/admin/edit-manager-modal.tsx`
- `src/components/admin/edit-verifier-modal.tsx`

**What Changed:**
- Added a **"Reset Password"** button (orange, outlined) to the bottom-left of the Edit Manager and Edit Verifier modals.
- The button uses a `window.confirm()` prompt to confirm the action before proceeding.
- On confirmation, the handler:
  1. Generates the default password using `generateDefaultPassword(phone)` → format: `{last4digits}Caveris` (e.g., `3210Caveris`)
  2. Hashes the password using `hashPassword()` from `@/lib/password-utils`
  3. Updates the `users` table with the new `password_hash`, `password_salt`, and sets `force_password_change: true`
- On next login the user will be redirected to `/change-password` to set a new password (handled by existing login flow).
- Both Cancel and Update buttons are disabled while a password reset is in progress.

**Imports Added:**
- `KeyRound` from `lucide-react`
- `hashPassword`, `generateDefaultPassword` from `@/lib/password-utils`

**State Added:**
- `isResettingPassword: boolean` – controls loading state of the Reset Password button

**No DB schema changes required** – `force_password_change` column already exists in the `users` table.

---

### 2026-03-30 – Add Candidate + Biometric Enrollment + Testing Exam Constraints

**Files Modified:**
- `src/app/admin/candidates/candidates-content.tsx`

**What Changed:**
- **Candidate interface** extended with biometric fields: `fingerprint_template`, `fingerprint_image_url`, `iris_image_url`, `iris_vector` (all optional/nullable).
- **Candidate Detail Modal**: Added a "🧬 Biometric Enrollment" section at the bottom showing:
  - Fingerprint image (if captured) or a blank placeholder "Not enrolled"
  - Fingerprint template status badge (green "✓ Template captured" / gray "No template")
  - Iris image (if captured) or a blank placeholder "Not enrolled"
  - Iris vector status badge (blue "✓ Vector captured" / gray "No vector")
  - **Blank state respected**: if data is not yet captured, appropriate placeholder is shown without errors.

**DB Migration Required:**
Run `migrations/add_biometric_enrollment_columns.sql` in Supabase SQL Editor:
```sql
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS fingerprint_template   TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS iris_image_url         TEXT,
  ADD COLUMN IF NOT EXISTS iris_vector            TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_testing_exam
  ON exams (is_testing) WHERE is_testing = true;
```

**Single Testing Exam Constraint:**
Enforced at DB level (unique partial index) and API level (ExamEndpoints.cs returns 409 Conflict).

