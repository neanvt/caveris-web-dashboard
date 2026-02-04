CREATE TABLE IF NOT EXISTS verifier_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id UUID NOT NULL REFERENCES users(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  centre_id UUID REFERENCES master_centres(id), -- Optional if global
  shift_id UUID REFERENCES master_shifts(id),   -- Optional
  assignment_date DATE,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
