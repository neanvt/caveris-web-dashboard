# Manager CSV Import with Centre Assignments - Implementation Guide

## ✅ What's Been Implemented

### 1. **Active by Default**

- ✅ New managers are created with `is_active: true`
- ✅ They can log in immediately after creation

### 2. **Duplicate Email Handling**

- ✅ Checks if manager already exists by email before creating
- ✅ Reuses existing manager ID if found
- ✅ Allows same manager to be assigned to multiple centres

### 3. **Automatic Centre Assignment Creation**

- ✅ Reads assignment columns from CSV
- ✅ Creates `manager_assignments` records automatically
- ✅ Links managers to exams, centres, and shifts

---

## 📋 CSV Format

### **Mandatory Columns:**

- `full_name` - Manager's full name
- `email` - Email address (must be unique)
- `phone` - Phone number

### **Optional Manager Columns:**

- `father_name` - Father's name
- `date_of_birth` - Date of birth (YYYY-MM-DD format)
- `address` - Address
- `city` - City

### **Optional Assignment Columns:**

- `assignment_exam_id` - UUID of the exam
- `assignment_centre_id` - UUID of the centre
- `assignment_shift_id` - UUID of the shift
- `assignment_date` - Assignment date (YYYY-MM-DD)

---

## 🎯 How to Use

### **Method 1: Simple Manager Import (No Assignments)**

Create a CSV with just manager details:

```csv
full_name,email,phone,father_name,date_of_birth,address,city
Rajesh Kumar,rajesh@example.com,9876543210,Ram Kumar,1985-05-15,123 MG Road,Mumbai
Priya Sharma,priya@example.com,9876543211,Vijay Sharma,1990-08-20,456 Park Street,Delhi
```

**Result:**

- ✅ Managers created with active status
- ✅ Can log in immediately
- ❌ No centre assignments (shows "No assignments")

---

### **Method 2: Manager Import with Assignments**

#### **Step 1: Generate Template**

1. Open the "Bulk Import" modal
2. Select an **Exam** from the dropdown
3. Pick an **Assignment Date**
4. Click **"Download Template Validated with Assignment"**

This generates a CSV with:

- One row for **every combination** of Centre × Shift
- Pre-filled assignment columns (exam_id, centre_id, shift_id, date)
- Empty manager columns (full_name, email, phone, etc.)

#### **Step 2: Fill Manager Details**

Open the downloaded CSV and fill in manager details for each row:

```csv
full_name,email,phone,father_name,date_of_birth,address,city,assignment_exam_name,assignment_exam_id,assignment_centre_name,assignment_centre_id,assignment_shift_code,assignment_shift_id,assignment_date
Rajesh Kumar,rajesh@example.com,9876543210,Ram Kumar,1985-05-15,123 MG Road,Mumbai,JEE Main 2024,abc-123,Centre A,centre-1,Morning,shift-1,2024-06-01
Rajesh Kumar,rajesh@example.com,9876543210,Ram Kumar,1985-05-15,123 MG Road,Mumbai,JEE Main 2024,abc-123,Centre B,centre-2,Afternoon,shift-2,2024-06-01
Priya Sharma,priya@example.com,9876543211,Vijay Sharma,1990-08-20,456 Park Street,Delhi,JEE Main 2024,abc-123,Centre C,centre-3,Morning,shift-1,2024-06-01
```

**Note:** Same manager can appear multiple times with different centre/shift assignments!

#### **Step 3: Import**

1. Upload the CSV
2. Click "Import Managers"

**Result:**

- ✅ Managers created (or reused if email exists)
- ✅ Centre assignments created for each row
- ✅ Assignments visible in the "Assignments" column

---

## 🔄 Import Logic Flow

```
For each CSV row:
  1. Check if manager exists by email
     - If YES: Use existing manager ID
     - If NO: Create new manager with password hash & salt

  2. Check if assignment columns are present
     - If YES: Create manager_assignment record
     - If NO: Skip assignment creation

  3. Continue to next row
```

---

## 📊 Database Schema

### **manager_assignments Table:**

```sql
CREATE TABLE manager_assignments (
    id UUID PRIMARY KEY,
    manager_id UUID REFERENCES users(id),
    exam_id UUID REFERENCES exams(id),
    centre_id UUID REFERENCES master_centres(id),
    shift_id UUID REFERENCES master_shifts(id),
    assignment_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Features

### **1. Duplicate Prevention**

- Same email = same manager (no duplicates)
- Multiple assignments for one manager = OK

### **2. Error Handling**

- User creation errors: Row skipped, error logged
- Assignment creation errors: User created, assignment skipped, error logged
- Partial success: Some rows succeed, some fail

### **3. Success Tracking**

- Success count = number of NEW managers created
- Existing managers reused don't increment count
- Assignments created silently (no separate count)

---

## 🎨 UI Display

### **Assignments Column:**

Shows all assignments for each manager:

```
Manager: Rajesh Kumar
Assignments:
  ├─ JEE Main 2024
  │  └─ Centre A • Morning
  ├─ JEE Main 2024
  │  └─ Centre B • Afternoon
```

### **Status Column:**

- 🟢 **Active** - Can log in
- ⚪ **Inactive** - Cannot log in

---

## 🔐 Security

### **Password Generation:**

- Default password: `{last4digits}Caveris`
- Example: Phone `9876543210` → Password `3210Caveris`
- Hashed with bcrypt (cost factor 10)
- Unique salt per user

### **Authentication:**

- Custom password hashing (not Supabase Auth)
- Password hash and salt stored in `users` table
- Users can log in immediately after creation

---

## 🐛 Troubleshooting

### **"No assignments" showing for imported managers**

**Cause:** CSV didn't include assignment columns

**Solution:**

1. Use the template generator
2. Ensure columns `assignment_exam_id`, `assignment_centre_id`, `assignment_shift_id` are present
3. Ensure values are valid UUIDs

---

### **"Duplicate email" errors**

**Cause:** Same manager listed multiple times in CSV

**Solution:** This is EXPECTED! The system will:

1. Create the manager once (first occurrence)
2. Reuse the manager for subsequent rows
3. Create assignments for each row

---

### **"Assignment failed" errors**

**Possible Causes:**

1. Invalid exam_id, centre_id, or shift_id (not valid UUIDs)
2. Referenced exam/centre/shift doesn't exist
3. Database foreign key constraint violation

**Solution:**

1. Use the template generator to get valid IDs
2. Verify exam/centre/shift exist in database
3. Check error message for details

---

## 📝 Example Scenarios

### **Scenario 1: One Manager, Multiple Centres**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id,assignment_date
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-1,shift-1,2024-06-01
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-2,shift-1,2024-06-01
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-3,shift-2,2024-06-01
```

**Result:**

- 1 manager created
- 3 assignments created
- Manager shows 3 assignments in UI

---

### **Scenario 2: Multiple Managers, One Centre Each**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id,assignment_date
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-1,shift-1,2024-06-01
Priya Sharma,priya@example.com,9876543211,exam-1,centre-2,shift-1,2024-06-01
Amit Singh,amit@example.com,9876543212,exam-1,centre-3,shift-2,2024-06-01
```

**Result:**

- 3 managers created
- 3 assignments created
- Each manager shows 1 assignment

---

### **Scenario 3: Mixed (Some with assignments, some without)**

```csv
full_name,email,phone,assignment_exam_id,assignment_centre_id,assignment_shift_id
Rajesh Kumar,rajesh@example.com,9876543210,exam-1,centre-1,shift-1
Priya Sharma,priya@example.com,9876543211,,,
Amit Singh,amit@example.com,9876543212,exam-1,centre-2,shift-1
```

**Result:**

- 3 managers created
- 2 assignments created (Rajesh and Amit)
- Priya shows "No assignments"

---

## 🎉 Summary

✅ **Managers are active by default**
✅ **Assignments are created automatically from CSV**
✅ **Same manager can have multiple assignments**
✅ **Duplicate emails are handled gracefully**
✅ **Template generator makes it easy**
✅ **Full error reporting**

**The system is now fully functional for bulk manager import with centre assignments!**
