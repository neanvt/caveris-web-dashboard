-- Check RLS policies for 'users' and 'manager_centre_assignments'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('users', 'manager_centre_assignments')
ORDER BY tablename, policyname;
