-- ==========================================
-- 🔍 바로교육 데이터베이스 완전 진단 SQL
-- ==========================================

-- 1️⃣ courses 테이블 구조 확인
SELECT 'courses 테이블 구조' as 검사항목;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 2️⃣ enrollments 테이블 구조 확인
SELECT 'enrollments 테이블 구조' as 검사항목;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
ORDER BY ordinal_position;

-- 3️⃣ courses 테이블 데이터 샘플 (ID와 제목만)
SELECT 'courses 테이블 데이터 샘플' as 검사항목;
SELECT 
    id,
    title,
    pg_typeof(id) as id_type,
    LENGTH(id::text) as id_length
FROM courses 
ORDER BY created_at DESC 
LIMIT 5;

-- 4️⃣ enrollments 테이블 데이터 샘플
SELECT 'enrollments 테이블 데이터 샘플' as 검사항목;
SELECT 
    id,
    user_id,
    course_id,
    pg_typeof(user_id) as user_id_type,
    pg_typeof(course_id) as course_id_type,
    LENGTH(user_id::text) as user_id_length,
    LENGTH(course_id::text) as course_id_length
FROM enrollments 
ORDER BY created_at DESC 
LIMIT 5;

-- 5️⃣ 외래키 관계 확인
SELECT 'enrollments 테이블 외래키 관계' as 검사항목;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'enrollments';

-- 6️⃣ RPC 함수 존재 확인
SELECT 'RPC 함수 목록' as 검사항목;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- 7️⃣ RLS 정책 확인
SELECT 'RLS 정책 확인' as 검사항목;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('courses', 'enrollments')
ORDER BY tablename, policyname;

-- 8️⃣ 실제 UUID 형식 검증
SELECT '유효한 UUID 형식 검증' as 검사항목;
SELECT 
    id,
    title,
    CASE 
        WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'VALID UUID' 
        ELSE 'INVALID UUID' 
    END as uuid_validation
FROM courses 
LIMIT 5;

-- 9️⃣ 숫자 ID가 있는지 확인
SELECT '숫자 ID 존재 여부' as 검사항목;
SELECT 
    id,
    title,
    CASE 
        WHEN id::text ~ '^[0-9]+$' 
        THEN 'NUMERIC ID (문제!)' 
        ELSE 'NON-NUMERIC ID' 
    END as id_type_check
FROM courses 
ORDER BY created_at DESC
LIMIT 10;

-- 🔟 auth.users와 enrollments 연결 확인
SELECT 'auth.users와 enrollments 연결 상태' as 검사항목;
SELECT 
    u.id as auth_user_id,
    u.email,
    e.user_id as enrollment_user_id,
    e.course_id,
    pg_typeof(e.user_id) as enrollment_user_id_type,
    pg_typeof(e.course_id) as enrollment_course_id_type
FROM auth.users u
LEFT JOIN enrollments e ON u.id = e.user_id
LIMIT 5;

-- 1️⃣1️⃣ 최종 요약
SELECT '최종 진단 요약' as 검사항목;
SELECT 
    'courses 테이블 레코드 수' as 항목,
    COUNT(*) as 개수
FROM courses
UNION ALL
SELECT 
    'enrollments 테이블 레코드 수' as 항목,
    COUNT(*) as 개수
FROM enrollments
UNION ALL
SELECT 
    'auth.users 레코드 수' as 항목,
    COUNT(*) as 개수
FROM auth.users;

SELECT '🎯 진단 완료!' as 상태; 