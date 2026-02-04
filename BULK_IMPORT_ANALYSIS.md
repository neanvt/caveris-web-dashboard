# Bulk Import & Template Download Analysis

## Current Implementation Status

### ✅ Candidates (Reference Implementation)

**Location:** `/src/app/admin/candidates/candidates-content.tsx`

**Features:**

1. **Template Download with Pre-fill**
   - Exam selection dropdown (filters by selected date)
   - Date selection for exam
   - Pre-fills exam details in template if exam is selected
   - Dynamic filename based on selection
   - Sample data with 2 rows showing mandatory vs optional fields
   - Headers marked with asterisks (\*) for mandatory fields

2. **CSV Import**
   - Comprehensive validation (mandatory fields, date formats)
   - Batch processing (200 rows per batch)
   - Progress tracking with UI updates
   - Error reporting per row
   - Success/failure statistics
   - Auto-refresh data on success

3. **Download Implementation**
   - Simple Blob + URL.createObjectURL
   - Direct click and cleanup
   - Filename: `candidate_import_${examCode}_${examName}_${date}.csv` or `candidate_import_sample.csv`

### ⚠️ Verifiers (Partially Implemented)

**Location:** `/src/app/admin/verifiers/verifiers-content.tsx`

**Current Status:**

- ✅ Has bulk import modal
- ✅ Has template download button
- ✅ Has exam selection for template generation
- ✅ Has date selection
- ✅ Generates assignment rows (Centre x Shift combinations)
- ❌ **ISSUE:** Download uses old method causing filename problems
- ❌ **ISSUE:** BOM implementation inconsistent

**What Needs Fixing:**

1. Update `downloadSampleCSV()` to match candidates pattern
2. Ensure proper BOM for UTF-8
3. Fix filename to be descriptive

### ⚠️ Managers (Basic Implementation)

**Location:** `/src/app/admin/managers/managers-content.tsx`

**Current Status:**

- ✅ Has bulk import modal
- ✅ Has template download button
- ✅ Basic CSV parsing
- ❌ **ISSUE:** Download uses old method causing filename problems
- ❌ **MISSING:** No exam/assignment pre-fill options
- ❌ **MISSING:** No progress tracking during import
- ❌ **MISSING:** Limited error reporting

**What Needs Adding:**

1. Update `downloadSampleCSV()` to match candidates pattern
2. Add progress tracking UI
3. Improve error reporting
4. Consider adding exam assignment options (if needed)

## Recommended Standardized Download Pattern

```typescript
const downloadSampleCSV = () => {
  const headers = ["field1*", "field2*", "field3"]; // * for mandatory
  const sample1 = ["value1", "value2", "value3"];
  const sample2 = ["value1", "", ""]; // Show optional fields can be empty

  const csv = [headers.join(","), sample1.join(","), sample2.join(",")].join(
    "\n",
  );
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.setAttribute("download", "descriptive_filename.csv");

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

## Implementation Plan

### Phase 1: Fix Verifiers Download ✅

- [x] Update downloadSampleCSV to use standardized pattern
- [x] Add proper BOM (\ufeff)
- [x] Fix filename generation
- [x] Test download in browser

### Phase 2: Fix Managers Download

- [ ] Update downloadSampleCSV to use standardized pattern
- [ ] Add proper BOM (\ufeff)
- [ ] Make filename descriptive
- [ ] Test download in browser

### Phase 3: Enhance Managers Import (Optional)

- [ ] Add progress tracking UI (like candidates)
- [ ] Improve error display
- [ ] Consider adding assignment options

## Key Differences Between Modules

| Feature                   | Candidates             | Verifiers             | Managers |
| ------------------------- | ---------------------- | --------------------- | -------- |
| **Exam Selection**        | Yes (for template)     | Yes (for assignments) | No       |
| **Date Selection**        | Yes                    | Yes                   | No       |
| **Assignment Generation** | Yes (complex)          | Yes (Centre x Shift)  | No       |
| **Progress Tracking**     | Yes (batch processing) | Basic                 | Basic    |
| **Error Reporting**       | Detailed per row       | Detailed per row      | Basic    |
| **Template Pre-fill**     | Exam details           | Exam + Assignments    | None     |

## Notes

- All three modules use the same CSV parsing logic
- Candidates has the most sophisticated implementation
- Verifiers is close but has download issues
- Managers is simplest (no exam/assignment context needed)
