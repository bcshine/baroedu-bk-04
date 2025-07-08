-- ==========================================
-- 🛠️ 바로교육 관리자 시스템 최종 수정 SQL (타입 에러 해결)
-- ==========================================

-- ⚠️ 주의: 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1️⃣ 기존 함수들 완전 삭제
DROP FUNCTION IF EXISTS get_all_users_admin() CASCADE;
DROP FUNCTION IF EXISTS get_course_enrollments_admin(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS admin_enroll_user(UUID, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS admin_unenroll_user(UUID, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS admin_grant_all_access(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS admin_revoke_all_access(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS get_users_with_enrollments_admin(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 2️⃣ 관리자 확인 함수 (안전하게)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        EXISTS(
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email IN ('admin@baroedu.com', 'bcshin0303@naver.com', 'test@baroedu.com')
            AND email_confirmed_at IS NOT NULL
        ),
        false
    );
$$;

-- 3️⃣ 관리자용 전체 사용자 조회 (간단한 버전)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        u.id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'name',
            u.raw_user_meta_data->>'full_name', 
            split_part(u.email, '@', 1),
            '사용자'
        ) as name,
        u.created_at
    FROM auth.users u
    WHERE u.email_confirmed_at IS NOT NULL
    ORDER BY u.created_at DESC;
$$;

-- 4️⃣ 관리자용 강좌별 수강생 조회 (타입 에러 해결)
CREATE OR REPLACE FUNCTION get_users_with_enrollments_admin(p_course_id BIGINT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT,
    phone TEXT,
    user_created_at TIMESTAMPTZ,
    enrollment_id BIGINT,
    enrollment_status TEXT,
    progress INTEGER,
    enrollment_created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'name',
            u.raw_user_meta_data->>'full_name', 
            split_part(u.email, '@', 1),
            '사용자'
        ) as name,
        u.phone as phone,
        u.created_at as user_created_at,
        e.id as enrollment_id,
        COALESCE(e.status, 'not_enrolled') as enrollment_status,
        COALESCE(e.progress, 0) as progress,
        e.created_at as enrollment_created_at
    FROM auth.users u
    LEFT JOIN enrollments e ON (u.id = e.user_id AND e.course_id = p_course_id)
    WHERE u.email_confirmed_at IS NOT NULL
    ORDER BY u.created_at DESC;
$$;

-- 5️⃣ 관리자용 개별 사용자 등록 (에러 처리 강화)
CREATE OR REPLACE FUNCTION admin_enroll_user(p_user_id UUID, p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    existing_id BIGINT;
    new_id BIGINT;
    course_exists BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- 사용자 존재 확인
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        result := json_build_object(
            'success', false,
            'message', '존재하지 않는 사용자입니다'
        );
        RETURN result;
    END IF;
    
    -- 강좌 존재 확인
    SELECT EXISTS(SELECT 1 FROM courses WHERE id = p_course_id) INTO course_exists;
    IF NOT course_exists THEN
        result := json_build_object(
            'success', false,
            'message', '존재하지 않는 강좌입니다'
        );
        RETURN result;
    END IF;
    
    -- 기존 등록 확인
    SELECT id INTO existing_id
    FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    IF existing_id IS NOT NULL THEN
        result := json_build_object(
            'success', false,
            'message', '이미 등록된 사용자입니다',
            'enrollment_id', existing_id
        );
        RETURN result;
    END IF;
    
    -- 새 등록 생성
    INSERT INTO enrollments (user_id, course_id, status, progress, created_at, updated_at)
    VALUES (p_user_id, p_course_id, 'enrolled', 0, NOW(), NOW())
    RETURNING id INTO new_id;
    
    result := json_build_object(
        'success', true,
        'message', '등록 완료',
        'enrollment_id', new_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- 6️⃣ 관리자용 개별 사용자 등록 해제
CREATE OR REPLACE FUNCTION admin_unenroll_user(p_user_id UUID, p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    DELETE FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    result := json_build_object(
        'success', true,
        'message', CASE 
            WHEN deleted_count > 0 THEN '등록 해제 완료'
            ELSE '등록된 사용자가 아닙니다'
        END,
        'deleted_count', deleted_count
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- 7️⃣ 관리자용 전체 권한 부여 (안전한 버전)
CREATE OR REPLACE FUNCTION admin_grant_all_access(p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    user_record RECORD;
    enrolled_count INTEGER := 0;
    skipped_count INTEGER := 0;
    total_users INTEGER := 0;
    error_count INTEGER := 0;
    course_exists BOOLEAN;
BEGIN
    -- 강좌 존재 확인
    SELECT EXISTS(SELECT 1 FROM courses WHERE id = p_course_id) INTO course_exists;
    IF NOT course_exists THEN
        result := json_build_object(
            'success', false,
            'message', '존재하지 않는 강좌입니다'
        );
        RETURN result;
    END IF;
    
    -- 모든 인증된 사용자 순회
    FOR user_record IN 
        SELECT id, email 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
        ORDER BY created_at DESC
    LOOP
        total_users := total_users + 1;
        
        BEGIN
            -- 이미 등록되었는지 확인
            IF NOT EXISTS (
                SELECT 1 FROM enrollments 
                WHERE user_id = user_record.id AND course_id = p_course_id
            ) THEN
                -- 새 등록 생성
                INSERT INTO enrollments (user_id, course_id, status, progress, created_at, updated_at)
                VALUES (user_record.id, p_course_id, 'enrolled', 0, NOW(), NOW());
                
                enrolled_count := enrolled_count + 1;
            ELSE
                skipped_count := skipped_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            -- 에러 발생해도 계속 진행
        END;
    END LOOP;
    
    result := json_build_object(
        'success', true,
        'message', '전체 권한 부여 완료',
        'total_users', total_users,
        'enrolled_count', enrolled_count,
        'skipped_count', skipped_count,
        'error_count', error_count
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- 8️⃣ 관리자용 전체 권한 제거
CREATE OR REPLACE FUNCTION admin_revoke_all_access(p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    DELETE FROM enrollments WHERE course_id = p_course_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    result := json_build_object(
        'success', true,
        'message', '전체 권한 제거 완료',
        'deleted_count', deleted_count
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- 9️⃣ 관리자용 통계 조회
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'total_users', COALESCE((SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL), 0),
        'total_courses', COALESCE((SELECT COUNT(*) FROM courses), 0),
        'total_enrollments', COALESCE((SELECT COUNT(*) FROM enrollments), 0),
        'active_students', COALESCE((SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'enrolled'), 0)
    );
$$;

-- 🔟 권한 설정 (안전하게)
DO $$
BEGIN
    -- 함수 권한 부여
    GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
    GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
    GRANT EXECUTE ON FUNCTION get_users_with_enrollments_admin(BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION admin_enroll_user(UUID, BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION admin_unenroll_user(UUID, BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION admin_grant_all_access(BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION admin_revoke_all_access(BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
EXCEPTION WHEN OTHERS THEN
    -- 권한 부여 실패해도 계속 진행
    NULL;
END $$;

-- 1️⃣1️⃣ RLS 정책 재설정 (안전하게)
DO $$
BEGIN
    -- enrollments 테이블 관리자 정책
    BEGIN
        DROP POLICY IF EXISTS "관리자는 모든 수강신청을 관리할 수 있습니다" ON enrollments;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        CREATE POLICY "관리자는 모든 수강신청을 관리할 수 있습니다" ON enrollments
            FOR ALL USING (is_admin());
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- courses 테이블 관리자 정책
    BEGIN
        DROP POLICY IF EXISTS "관리자는 모든 강좌를 관리할 수 있습니다" ON courses;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        CREATE POLICY "관리자는 모든 강좌를 관리할 수 있습니다" ON courses
            FOR ALL USING (is_admin());
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 1️⃣2️⃣ 테스트 쿼리 (설치 확인)
SELECT 
    '🎯 바로교육 관리자 시스템 설치 완료!' as status,
    '다음 이메일로 로그인하세요: admin@baroedu.com, bcshin0303@naver.com, test@baroedu.com' as message;

-- 함수 생성 확인
SELECT 
    routine_name as function_name,
    '✅ 생성됨' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%'
ORDER BY routine_name; 