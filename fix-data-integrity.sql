-- ===============================================
-- 데이터 정합성 문제 해결 SQL
-- ===============================================

-- 1. 현재 상황 파악
-- enrollments 테이블에서 profiles에 없는 사용자 ID 찾기
SELECT 
    e.user_id,
    COUNT(*) as enrollment_count,
    'Missing in profiles' as status
FROM enrollments e
LEFT JOIN profiles p ON e.user_id = p.id
WHERE p.id IS NULL
GROUP BY e.user_id
ORDER BY enrollment_count DESC;

-- 2. auth.users에 있지만 profiles에 없는 사용자 찾기
SELECT 
    au.id,
    au.email,
    'Missing in profiles but exists in auth.users' as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. enrollments에 있지만 auth.users에도 없는 orphaned 데이터 찾기
SELECT 
    e.user_id,
    COUNT(*) as enrollment_count,
    'Orphaned - not in auth.users' as status
FROM enrollments e
LEFT JOIN auth.users au ON e.user_id = au.id
WHERE au.id IS NULL
GROUP BY e.user_id;

-- ===============================================
-- 해결 방안 1: 누락된 사용자를 profiles에 추가
-- ===============================================

-- auth.users에 있는 모든 사용자를 profiles에 추가 (중복 방지)
INSERT INTO profiles (id, email, name)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- 해결 방안 2: orphaned enrollments 데이터 정리
-- ===============================================

-- auth.users에 없는 enrollments 데이터 삭제
DELETE FROM enrollments 
WHERE user_id NOT IN (
    SELECT id FROM auth.users
);

-- ===============================================
-- 해결 방안 3: 특정 사용자 ID 처리 (필요한 경우)
-- ===============================================

-- 특정 사용자 ID를 위한 더미 프로필 생성 (권장하지 않음)
-- INSERT INTO profiles (id, email, name)
-- VALUES (
--     '4b722d83-4a13-4792-a139-ad1a716e70c3',
--     'unknown@baroedu.com',
--     'Unknown User'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- 외래키 제약 조건 재생성
-- ===============================================

-- 기존 외래키 제거
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- 데이터 정합성 확인 후 외래키 재생성
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- orphaned enrollments 확인
    SELECT COUNT(*) INTO orphaned_count
    FROM enrollments e
    LEFT JOIN profiles p ON e.user_id = p.id
    WHERE p.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE EXCEPTION '아직 profiles에 없는 사용자가 %개 있습니다. 데이터를 정리해주세요.', orphaned_count;
    END IF;
    
    -- 외래키 제약 조건 추가
    ALTER TABLE enrollments 
    ADD CONSTRAINT enrollments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ 외래키 제약 조건이 성공적으로 추가되었습니다.';
END $$;

-- ===============================================
-- 최종 확인
-- ===============================================

-- 1. profiles 테이블 데이터 수 확인
SELECT COUNT(*) as profiles_count FROM profiles;

-- 2. enrollments 테이블 데이터 수 확인
SELECT COUNT(*) as enrollments_count FROM enrollments;

-- 3. 정상적으로 연결된 enrollments 확인
SELECT 
    COUNT(*) as valid_enrollments,
    COUNT(DISTINCT e.user_id) as unique_users
FROM enrollments e
INNER JOIN profiles p ON e.user_id = p.id;

-- 4. 외래키 제약 조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'enrollments';

-- 5. 최근 enrollments 데이터 샘플 확인
SELECT 
    e.id,
    e.user_id,
    p.email as user_email,
    e.course_id,
    c.title as course_title,
    e.created_at
FROM enrollments e
INNER JOIN profiles p ON e.user_id = p.id
LEFT JOIN courses c ON e.course_id = c.id
ORDER BY e.created_at DESC
LIMIT 5;

SELECT '✅ 데이터 정합성 문제 해결 완료!' as status; 