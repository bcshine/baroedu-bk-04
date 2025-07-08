-- ==========================================
-- 🔍 실제 데이터베이스 구조 확인 SQL
-- ==========================================

-- 1️⃣ courses 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 2️⃣ enrollments 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
ORDER BY ordinal_position;

-- 3️⃣ 외래키 관계 확인
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'courses' OR tc.table_name = 'enrollments');

-- 4️⃣ 샘플 데이터 확인
SELECT 'courses 테이블 샘플' as table_info;
SELECT id, title FROM courses LIMIT 3;

SELECT 'enrollments 테이블 샘플' as table_info;
SELECT id, user_id, course_id FROM enrollments LIMIT 3; 