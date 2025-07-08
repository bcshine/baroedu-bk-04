-- ===============================================
-- Supabase SQL Editor용 외래키 제약 조건 해결
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

-- 2. enrollments 테이블 컬럼 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'profiles 테이블이 존재합니다.';
    ELSE
        RAISE NOTICE 'profiles 테이블이 존재하지 않습니다.';
    END IF;
END $$;

-- ===============================================
-- 해결 방안: profiles 테이블 생성 및 외래키 수정
-- ===============================================

-- profiles 테이블 생성 (없는 경우에만)
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

-- 기존 RLS 정책 제거 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

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

-- enrollments 테이블의 기존 외래키 제약 조건 제거
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- profiles 테이블로 외래키 재생성
ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- ===============================================
-- 확인 쿼리
-- ===============================================

-- 수정된 외래키 제약 조건 확인
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

-- profiles 테이블 데이터 확인
SELECT COUNT(*) as profile_count FROM profiles;

-- 현재 enrollments 데이터 확인
SELECT 
    e.id,
    e.user_id,
    e.course_id,
    e.created_at,
    c.title as course_title,
    p.email as user_email
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
LEFT JOIN profiles p ON e.user_id = p.id
ORDER BY e.created_at DESC
LIMIT 10;

SELECT '✅ 외래키 제약 조건 수정 완료!' as status; 