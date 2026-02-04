-- Add exam_id and shift_id columns to manager_centre_assignments table
-- This allows tracking which exam and shift the manager is assigned to for each centre

-- Step 1: Add the exam_id column (nullable initially)
ALTER TABLE manager_centre_assignments
ADD COLUMN IF NOT EXISTS exam_id UUID;

-- Step 2: Add the shift_id column (nullable initially)
ALTER TABLE manager_centre_assignments
ADD COLUMN IF NOT EXISTS shift_id UUID;

-- Step 3: Add foreign key constraint to exams table
ALTER TABLE manager_centre_assignments 
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_exam;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_exam
FOREIGN KEY (exam_id) REFERENCES exams(id)
ON DELETE CASCADE;

-- Step 4: Add foreign key constraint to master_shifts table
ALTER TABLE manager_centre_assignments 
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_shift;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_shift
FOREIGN KEY (shift_id) REFERENCES master_shifts(id)
ON DELETE CASCADE;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_manager_centre_assignments_exam_id
ON manager_centre_assignments(exam_id);

CREATE INDEX IF NOT EXISTS idx_manager_centre_assignments_shift_id
ON manager_centre_assignments(shift_id);

-- Step 6: Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'manager_centre_assignments'
  AND column_name IN ('exam_id', 'shift_id');

-- Step 7: Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'manager_centre_assignments'
ORDER BY ordinal_position;
