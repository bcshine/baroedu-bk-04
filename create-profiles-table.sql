-- 1단계: profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2단계: auth.users 데이터를 profiles로 복사
INSERT INTO public.profiles (id, email, name, created_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email_confirmed_at::text, email),
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3단계: profiles 테이블에 RLS 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 읽을 수 있음
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트할 수 있음  
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 프로필을 읽을 수 있음 (서비스 키 사용)
CREATE POLICY "Admin can read all profiles" ON public.profiles
    FOR SELECT USING (true);

-- 4단계: 확인용 쿼리
SELECT 'Profiles 테이블 생성 완료' as status;
SELECT COUNT(*) as profile_count FROM public.profiles; 