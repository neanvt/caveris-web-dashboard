# Manager & Verifier Bulk Upload - Duplicate Handling

## 🎯 Behavior

### **Email as Unique Key**

- Email is used as the unique identifier for users
- If a user with the same email already exists, **only the assignment is created**
- No duplicate user is created

---

## 📋 How It Works

### **During CSV Import:**

```
For each row in CSV:
  1. Check if user exists by EMAIL
     ├─ Query: SELECT id, role, full_name FROM users WHERE email = ?
     │
     ├─ If USER EXISTS:
     │  ├─ Use existing user's ID
     │  ├─ Log: "User with email X already exists as [role], skipping user creation"
     │  └─ Create assignment ONLY (skip user creation)
     │
     └─ If USER DOES NOT EXIST:
        ├─ Create new user with:
        │  ├─ Password hash & salt
        │  ├─ Role: "manager" (or "verifier")
        │  └─ is_active: true
        └─ Create assignment (if assignment columns present)
```

---

## 🔄 Scenarios

### **Scenario 1: Same Person as Manager and Verifier**

**CSV 1 - Managers:**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-1,shift-1
```

**Result:**

- ✅ User created with role "manager"
- ✅ Manager assignment created

**CSV 2 - Verifiers (later import):**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-2,shift-2
```

**Result:**

- ❌ User NOT created (email already exists)
- ✅ Verifier assignment created for existing user
- 📝 User remains with role "manager" (role is NOT updated)

---

### **Scenario 2: Same Manager, Multiple Centres**

**CSV:**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-1,shift-1
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-2,shift-1
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-3,shift-2
```

**Result:**

- ✅ User created once (first row)
- ✅ 3 assignments created (one for each row)

---

### **Scenario 3: Different People, Same Email (ERROR)**

**CSV:**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id
Rajesh Kumar,same@example.com,9876543210,exam-1,centre-1,shift-1
Priya Sharma,same@example.com,9876543211,exam-1,centre-2,shift-1
```

**Result:**

- ✅ Rajesh created
- ✅ Rajesh assignment created
- ❌ Priya NOT created (email already exists)
- ✅ Assignment created for Rajesh (not Priya!)
- ⚠️ **This is likely a data error in the CSV**

---

## ⚠️ Important Notes

### **1. Role is NOT Updated**

If a user exists with role "manager" and you import them as a "verifier":

- User role remains "manager"
- Assignment is created
- User does NOT become a verifier

### **2. Email Must Be Unique**

- Email is the primary unique key
- Phone can be different for same email
- If email exists, existing user is used

### **3. Assignment Creation**

- Assignments are ALWAYS created if assignment columns are present
- Even if user already exists
- This allows one user to have multiple assignments

---

## 🔍 Database Constraints

### **users table:**

```sql
email TEXT UNIQUE NOT NULL  -- Email must be unique
phone TEXT UNIQUE NOT NULL  -- Phone must be unique (but not checked during import)
role TEXT NOT NULL          -- Role is NOT updated if user exists
```

### **manager_assignments table:**

```sql
manager_id UUID REFERENCES users(id)
exam_id UUID REFERENCES exams(id)
centre_id UUID REFERENCES master_centres(id)
shift_id UUID REFERENCES master_shifts(id)
-- No unique constraint, so same manager can have multiple assignments
```

---

## 📊 Import Results

### **Success Count:**

- Only counts **NEW users created**
- Existing users reused do NOT increment count

### **Example:**

```
CSV has 10 rows:
- 3 unique emails (new users)
- 7 duplicate emails (existing users)

Result:
✅ Successfully imported 3 managers
✅ 10 assignments created
```

---

## 🎯 Best Practices

### **1. Ensure Unique Emails**

- Each person should have a unique email
- Don't use the same email for different people

### **2. Multiple Assignments**

- Same person (same email) can appear multiple times
- Each row creates a new assignment

### **3. Cross-Role Assignments**

- If you want someone to be both manager and verifier:
  - Import them as manager first
  - Import them as verifier later (only assignment created)
  - They remain a manager with verifier assignments

### **4. Data Validation**

- Verify emails are correct before import
- Check for accidental duplicate emails
- Ensure assignment IDs are valid UUIDs

---

## 🐛 Troubleshooting

### **"User created but assignment failed"**

**Cause:** Invalid exam_id, centre_id, or shift_id

**Solution:** Use the template generator to get valid IDs

---

### **"Wrong person got the assignment"**

**Cause:** Duplicate email in CSV for different people

**Solution:**

1. Fix emails in CSV
2. Delete incorrect assignments from database
3. Re-import with correct emails

---

### **"User has wrong role"**

**Cause:** User was imported as manager first, then as verifier

**Solution:**

- Manually update role in database if needed
- Or delete user and re-import with correct role

---

## ✅ Summary

**Email-Based Duplicate Detection:**

- ✅ Prevents duplicate users with same email
- ✅ Allows multiple assignments per user
- ✅ Works across manager and verifier imports
- ⚠️ Does NOT update user role if already exists
- ⚠️ Assumes email is unique per person

**This ensures data integrity while allowing flexible assignment management!**
