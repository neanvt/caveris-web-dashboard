-- Ensure date columns in exams table are DATE type (not TIMESTAMP)
-- This ensures dates are stored without time components

-- Check if columns exist and are correct type
DO $$ 
BEGIN
    -- Add exam_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exams' AND column_name = 'exam_date') THEN
        ALTER TABLE exams ADD COLUMN exam_date DATE;
    END IF;
    
    -- Add start_date if it doesn't exist (it should already exist based on your screenshot)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exams' AND column_name = 'start_date') THEN
        ALTER TABLE exams ADD COLUMN start_date DATE;
    END IF;
    
    -- Add end_date if it doesn't exist (it should already exist based on your screenshot)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exams' AND column_name = 'end_date') THEN
        ALTER TABLE exams ADD COLUMN end_date DATE;
    END IF;
END $$;

-- If columns exist but are TIMESTAMP, convert them to DATE
-- Note: This will truncate any time information
ALTER TABLE exams 
    ALTER COLUMN start_date TYPE DATE,
    ALTER COLUMN end_date TYPE DATE;

-- Only alter exam_date if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'exams' AND column_name = 'exam_date') THEN
        ALTER TABLE exams ALTER COLUMN exam_date TYPE DATE;
    END IF;
END $$;

-- Add comments to columns
COMMENT ON COLUMN exams.exam_date IS 'Primary exam date (DATE only, no time)';
COMMENT ON COLUMN exams.start_date IS 'Exam start date for multi-day exams (DATE only, no time)';
COMMENT ON COLUMN exams.end_date IS 'Exam end date for multi-day exams (DATE only, no time)';
