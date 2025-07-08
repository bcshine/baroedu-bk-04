-- ===============================================
-- 외래키 제약 조건 문제 해결 SQL
-- ===============================================

-- 1. 현재 외래키 제약 조건 확인
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

-- 2. enrollments 테이블 구조 확인
\d enrollments;

-- 3. 사용 가능한 사용자 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles');

-- 4. auth.users 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
    AND table_name = 'users';

-- 5. 현재 사용자 데이터 확인
SELECT id, email 
FROM auth.users 
WHERE id = 'b53bed35-12f8-4780-8dbe-9d251fb37e32';

-- 6. profiles 테이블이 있다면 확인
SELECT id 
FROM profiles 
WHERE id = 'b53bed35-12f8-4780-8dbe-9d251fb37e32';

-- ===============================================
-- 해결 방안 1: profiles 테이블이 있는 경우
-- ===============================================

-- 기존 외래키 제거
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- profiles 테이블로 외래키 재생성
ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- ===============================================
-- 해결 방안 2: profiles 테이블이 없는 경우
-- ===============================================

-- profiles 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자용 정책 추가
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com',
            'test@baroedu.com'
        )
    );

-- 기존 auth.users 데이터를 profiles로 복사
INSERT INTO profiles (id, email, name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email) as name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- enrollments 테이블 외래키 수정
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- ===============================================
-- 해결 방안 3: 외래키 제약 조건 완전 제거 (권장하지 않음)
-- ===============================================

-- 외래키 제약 조건 제거 (데이터 무결성을 위해 권장하지 않음)
-- ALTER TABLE enrollments 
-- DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- ===============================================
-- 현재 상황 확인 쿼리
-- ===============================================

-- 현재 enrollments 데이터 확인
SELECT 
    e.id,
    e.user_id,
    e.course_id,
    e.created_at,
    c.title as course_title
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
ORDER BY e.created_at DESC
LIMIT 10;

-- 관리자 RPC 함수 재생성을 위한 정리
DROP FUNCTION IF EXISTS admin_enroll_user(UUID, UUID);
DROP FUNCTION IF EXISTS admin_grant_all_access(UUID);
DROP FUNCTION IF EXISTS get_all_users_admin();
DROP FUNCTION IF EXISTS get_users_with_enrollments_admin(UUID);

-- 수정된 관리자 함수들을 다시 생성할 준비
SELECT 'Ready to recreate admin functions'; 