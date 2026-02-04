# Date Handling in CAVERIS Application

## Overview

All dates in the CAVERIS application are handled consistently to avoid timezone issues and ensure data integrity.

## Date Storage Format

- **Database**: All date columns use PostgreSQL `DATE` type (not `TIMESTAMP` or `TIMESTAMPTZ`)
- **Application**: Dates are stored and processed as strings in `YYYY-MM-DD` format
- **Timezone**: All dates are in IST (Indian Standard Time)

## Key Principles

### 1. No Time Components

- Dates are stored **without** time information
- This prevents timezone conversion issues
- Database columns are `DATE` type, not `TIMESTAMP`

### 2. String-Based Comparison

- Dates are compared as strings (`YYYY-MM-DD` format)
- Example: `"2026-01-30" >= "2026-01-29"` returns `true`
- This avoids JavaScript Date object timezone issues

### 3. Consistent Formatting

- **Storage**: `YYYY-MM-DD` (ISO 8601 format)
- **Display**: `DD/MM/YYYY` (Indian format)
- **Input**: HTML date inputs use `YYYY-MM-DD`

## Utility Functions

Located in `/src/lib/date-utils.ts`:

### `formatDateForDisplay(dateString: string): string`

Converts `YYYY-MM-DD` to `DD/MM/YYYY` for display

```typescript
formatDateForDisplay("2026-01-30"); // Returns "30/01/2026"
```

### `isDateBetween(date: string, startDate: string, endDate: string): boolean`

Checks if a date falls within a range (inclusive)

```typescript
isDateBetween("2026-01-30", "2026-01-29", "2026-01-31"); // Returns true
```

### `getCurrentDateIST(): string`

Gets current date in IST timezone as `YYYY-MM-DD`

```typescript
getCurrentDateIST(); // Returns "2026-01-30"
```

### Other Functions

- `formatDateLong()` - Long format (e.g., "30 January 2026")
- `dateToString()` - Convert Date object to string
- `parseDDMMYYYY()` - Parse DD/MM/YYYY to YYYY-MM-DD
- `isValidDateString()` - Validate date string
- `compareDates()` - Compare two dates

## Database Schema

### Exams Table

```sql
-- Date columns are DATE type (not TIMESTAMP)
ALTER TABLE exams
    ALTER COLUMN start_date TYPE DATE,
    ALTER COLUMN end_date TYPE DATE,
    ALTER COLUMN exam_date TYPE DATE;
```

### Why DATE Type?

- Stores only the date (no time component)
- Prevents timezone conversion issues
- Smaller storage footprint
- Clearer intent

## Best Practices

### ✅ DO

```typescript
// Use string comparison
if (selectedDate >= exam.start_date && selectedDate <= exam.end_date) {
  // ...
}

// Use utility functions
const displayDate = formatDateForDisplay(exam.start_date);

// Store dates as YYYY-MM-DD strings
const examDate = "2026-01-30";
```

### ❌ DON'T

```typescript
// Don't use Date objects for comparison (timezone issues)
const date1 = new Date(dateString1);
const date2 = new Date(dateString2);
if (date1 > date2) {
  // ❌ Can cause timezone issues
  // ...
}

// Don't use toLocaleDateString for storage
const dateStr = new Date().toLocaleDateString(); // ❌ Inconsistent format

// Don't store timestamps for date-only fields
const timestamp = new Date().toISOString(); // ❌ Includes time
```

## Migration Script

Run this in Supabase SQL Editor to ensure correct column types:

```sql
-- Ensure all date columns are DATE type
ALTER TABLE exams
    ALTER COLUMN start_date TYPE DATE,
    ALTER COLUMN end_date TYPE DATE;

-- Add exam_date if it doesn't exist
ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS exam_date DATE;
```

## Testing Dates

### Test Cases

1. **Single-day exam**: `start_date = end_date`
2. **Multi-day exam**: `start_date < end_date`
3. **Date filtering**: Verify dates are filtered correctly
4. **Display formatting**: Check DD/MM/YYYY format
5. **Timezone consistency**: Verify no UTC/IST conversion issues

### Example Test Data

```sql
INSERT INTO exams (exam_name, exam_code, start_date, end_date, exam_date)
VALUES
  ('NEET 2026', 'NEET-26', '2026-01-29', '2026-01-31', '2026-01-29'),
  ('JEE Main 2026', 'JEE-26', '2026-02-15', '2026-02-15', '2026-02-15');
```

## Common Pitfalls to Avoid

### 1. JavaScript Date Constructor

```typescript
// ❌ BAD: Can interpret as UTC or local time
new Date("2026-01-30");

// ✅ GOOD: Use string directly
const dateStr = "2026-01-30";
```

### 2. Date Arithmetic

```typescript
// ❌ BAD: Date object arithmetic
const tomorrow = new Date(date);
tomorrow.setDate(tomorrow.getDate() + 1);

// ✅ GOOD: String manipulation or utility function
// (Add utility function if needed)
```

### 3. Display Formatting

```typescript
// ❌ BAD: Inconsistent formatting
date.toLocaleDateString();

// ✅ GOOD: Use utility function
formatDateForDisplay(dateStr);
```

## Summary

- **Store**: `YYYY-MM-DD` strings in `DATE` columns
- **Compare**: String comparison (`>=`, `<=`, `===`)
- **Display**: Use `formatDateForDisplay()` for DD/MM/YYYY
- **Timezone**: All dates in IST, no time components
- **Utilities**: Use functions from `/src/lib/date-utils.ts`

This approach ensures:

- ✅ No timezone conversion issues
- ✅ Consistent date handling across the app
- ✅ Smaller database storage
- ✅ Clearer code intent
- ✅ Easier debugging
