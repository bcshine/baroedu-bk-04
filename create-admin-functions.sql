-- ==========================================
-- 🛡️ 관리자 전용 PostgreSQL 함수들 (RLS 우회)
-- ==========================================

-- 1. 관리자용 전체 사용자 조회 함수
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
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
        au.created_at
    FROM auth.users au
    WHERE au.email_confirmed_at IS NOT NULL
    ORDER BY au.created_at DESC;
$$;

-- 2. 관리자용 강좌별 수강 정보 조회 함수
CREATE OR REPLACE FUNCTION get_course_enrollments_admin(p_course_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    course_id BIGINT,
    status TEXT,
    progress INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        e.id,
        e.user_id,
        e.course_id,
        e.status,
        e.progress,
        e.created_at,
        e.updated_at
    FROM enrollments e
    WHERE e.course_id = p_course_id;
$$;

-- 3. 관리자용 사용자 등록 함수
CREATE OR REPLACE FUNCTION admin_enroll_user(p_user_id UUID, p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    existing_enrollment RECORD;
BEGIN
    -- 기존 등록 확인
    SELECT * INTO existing_enrollment
    FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    IF existing_enrollment.id IS NOT NULL THEN
        result := json_build_object(
            'success', false,
            'message', '이미 등록된 사용자입니다',
            'enrollment_id', existing_enrollment.id
        );
        RETURN result;
    END IF;
    
    -- 새 등록 생성
    INSERT INTO enrollments (user_id, course_id, status, progress, created_at)
    VALUES (p_user_id, p_course_id, 'enrolled', 0, NOW())
    RETURNING id INTO existing_enrollment;
    
    result := json_build_object(
        'success', true,
        'message', '등록 완료',
        'enrollment_id', existing_enrollment.id
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

-- 4. 관리자용 사용자 등록 해제 함수
CREATE OR REPLACE FUNCTION admin_unenroll_user(p_user_id UUID, p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    -- 등록 해제
    DELETE FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        result := json_build_object(
            'success', true,
            'message', '등록 해제 완료',
            'deleted_count', deleted_count
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', '등록된 사용자가 아닙니다',
            'deleted_count', 0
        );
    END IF;
    
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

-- 5. 관리자용 전체 권한 부여 함수
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
BEGIN
    -- 모든 인증된 사용자에게 권한 부여
    FOR user_record IN 
        SELECT id, email 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        total_users := total_users + 1;
        
        -- 이미 등록되었는지 확인
        IF NOT EXISTS (
            SELECT 1 FROM enrollments 
            WHERE user_id = user_record.id AND course_id = p_course_id
        ) THEN
            -- 새 등록 생성
            INSERT INTO enrollments (user_id, course_id, status, progress, created_at)
            VALUES (user_record.id, p_course_id, 'enrolled', 0, NOW());
            
            enrolled_count := enrolled_count + 1;
        ELSE
            skipped_count := skipped_count + 1;
        END IF;
    END LOOP;
    
    result := json_build_object(
        'success', true,
        'message', '전체 권한 부여 완료',
        'total_users', total_users,
        'enrolled_count', enrolled_count,
        'skipped_count', skipped_count
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

-- 6. 관리자용 전체 권한 제거 함수
CREATE OR REPLACE FUNCTION admin_revoke_all_access(p_course_id BIGINT)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    -- 모든 등록 해제
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

-- 7. 관리자용 사용자 및 수강 정보 조회 함수
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
        au.id as user_id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
        au.phone as phone,
        au.created_at as user_created_at,
        e.id as enrollment_id,
        e.status as enrollment_status,
        e.progress,
        e.created_at as enrollment_created_at
    FROM auth.users au
    LEFT JOIN enrollments e ON au.id = e.user_id AND e.course_id = p_course_id
    WHERE au.email_confirmed_at IS NOT NULL
    ORDER BY au.created_at DESC;
$$;

-- 함수들에 대한 권한 설정
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_course_enrollments_admin(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_enroll_user(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unenroll_user(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_all_access(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_all_access(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_enrollments_admin(BIGINT) TO authenticated;

-- 관리자 전용 RLS 정책 추가 (관리자는 모든 데이터 접근 가능)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN ('admin@baroedu.com', 'bcshin0303@naver.com', 'test@baroedu.com')
    );
$$;

-- enrollments 테이블에 관리자 정책 추가
DROP POLICY IF EXISTS "관리자는 모든 수강신청을 관리할 수 있습니다" ON enrollments;
CREATE POLICY "관리자는 모든 수강신청을 관리할 수 있습니다" ON enrollments
    FOR ALL USING (is_admin());

-- courses 테이블에 관리자 정책 추가 (이미 있을 수 있으니 안전하게)
DROP POLICY IF EXISTS "관리자는 모든 강좌를 관리할 수 있습니다" ON courses;
CREATE POLICY "관리자는 모든 강좌를 관리할 수 있습니다" ON courses
    FOR ALL USING (is_admin()); 