-- ===============================================
-- 수정된 관리자 RPC 함수들 재생성
-- (profiles 테이블 기준)
-- ===============================================

-- 1. 모든 사용자 조회 (관리자용)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- profiles 테이블에서 사용자 정보 반환
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.name,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. 개별 사용자 강좌 등록 (관리자용)
CREATE OR REPLACE FUNCTION admin_enroll_user(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_exists BOOLEAN;
    course_exists BOOLEAN;
    already_enrolled BOOLEAN;
    result JSON;
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- 사용자 존재 확인 (profiles 테이블)
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', '사용자를 찾을 수 없습니다.'
        );
    END IF;

    -- 강좌 존재 확인
    SELECT EXISTS(SELECT 1 FROM courses WHERE id = p_course_id) INTO course_exists;
    IF NOT course_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', '강좌를 찾을 수 없습니다.'
        );
    END IF;

    -- 이미 등록되어 있는지 확인
    SELECT EXISTS(
        SELECT 1 FROM enrollments 
        WHERE user_id = p_user_id AND course_id = p_course_id
    ) INTO already_enrolled;
    
    IF already_enrolled THEN
        RETURN json_build_object(
            'success', false,
            'message', '이미 등록된 강좌입니다.'
        );
    END IF;

    -- 수강 등록
    INSERT INTO enrollments (user_id, course_id, status, progress, created_at)
    VALUES (p_user_id, p_course_id, 'active', 0, NOW());

    RETURN json_build_object(
        'success', true,
        'message', '수강 등록이 완료되었습니다.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', '수강 등록 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 3. 전체 권한 부여 (모든 강좌에 모든 사용자 등록)
CREATE OR REPLACE FUNCTION admin_grant_all_access(
    p_course_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    course_exists BOOLEAN;
    enrolled_count INTEGER := 0;
    total_users INTEGER := 0;
    result JSON;
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- 강좌 존재 확인
    SELECT EXISTS(SELECT 1 FROM courses WHERE id = p_course_id) INTO course_exists;
    IF NOT course_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', '강좌를 찾을 수 없습니다.'
        );
    END IF;

    -- 모든 사용자에게 강좌 등록
    FOR user_record IN 
        SELECT id FROM profiles
    LOOP
        total_users := total_users + 1;
        
        -- 이미 등록되어 있지 않은 경우에만 등록
        IF NOT EXISTS(
            SELECT 1 FROM enrollments 
            WHERE user_id = user_record.id AND course_id = p_course_id
        ) THEN
            INSERT INTO enrollments (user_id, course_id, status, progress, created_at)
            VALUES (user_record.id, p_course_id, 'active', 0, NOW());
            enrolled_count := enrolled_count + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'message', format('총 %s명 중 %s명에게 강좌를 등록했습니다.', total_users, enrolled_count),
        'total_users', total_users,
        'enrolled_count', enrolled_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', '전체 권한 부여 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 4. 특정 강좌의 수강생 조회 (관리자용)
CREATE OR REPLACE FUNCTION get_users_with_enrollments_admin(
    p_course_id UUID
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT,
    enrollment_status TEXT,
    progress INTEGER,
    enrolled_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- 특정 강좌의 수강생 정보 반환
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.name,
        COALESCE(e.status, 'not_enrolled') as enrollment_status,
        COALESCE(e.progress, 0) as progress,
        e.created_at as enrolled_at
    FROM profiles p
    LEFT JOIN enrollments e ON p.id = e.user_id AND e.course_id = p_course_id
    ORDER BY e.created_at DESC NULLS LAST, p.created_at DESC;
END;
$$;

-- 5. 권한 해제 함수
CREATE OR REPLACE FUNCTION admin_revoke_access(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    enrollment_exists BOOLEAN;
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- 수강 등록 여부 확인
    SELECT EXISTS(
        SELECT 1 FROM enrollments 
        WHERE user_id = p_user_id AND course_id = p_course_id
    ) INTO enrollment_exists;
    
    IF NOT enrollment_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', '수강 등록 정보를 찾을 수 없습니다.'
        );
    END IF;

    -- 수강 등록 해제
    DELETE FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id;

    RETURN json_build_object(
        'success', true,
        'message', '수강 등록이 해제되었습니다.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', '수강 해제 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 6. 전체 권한 해제 (특정 강좌의 모든 수강생 해제)
CREATE OR REPLACE FUNCTION admin_revoke_all_access(
    p_course_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    -- 관리자 권한 확인
    IF NOT (
        SELECT auth.email() IN (
            'admin@baroedu.com',
            'manager@baroedu.com', 
            'test@baroedu.com'
        )
    ) THEN
        RAISE EXCEPTION '관리자 권한이 필요합니다.';
    END IF;

    -- 해당 강좌의 모든 수강 등록 해제
    DELETE FROM enrollments WHERE course_id = p_course_id;
    GET DIAGNOSTICS revoked_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', format('총 %s명의 수강 등록이 해제되었습니다.', revoked_count),
        'revoked_count', revoked_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', '전체 권한 해제 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 7. 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN auth.email() IN (
        'admin@baroedu.com',
        'manager@baroedu.com', 
        'test@baroedu.com'
    );
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_enroll_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_all_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_enrollments_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_all_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

SELECT 'Admin functions recreated successfully' as status; 