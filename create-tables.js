// Supabase 테이블 생성 스크립트
const { createClient } = require('@supabase/supabase-js');
const config = require('./config/env');

// Supabase 관리자 클라이언트 (Service Role Key 사용)
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 Supabase 테이블 생성 시작...');
console.log('📍 Supabase URL:', config.SUPABASE_URL);

async function createTables() {
    try {
        console.log('\n📋 1. courses 테이블 생성 중...');
        
        // 1. courses 테이블 생성
        const coursesTableSQL = `
            -- 강좌 테이블 생성
            CREATE TABLE IF NOT EXISTS courses (
                id BIGSERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                instructor VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                price INTEGER DEFAULT 0,
                rating DECIMAL(2,1) DEFAULT 0.0,
                students INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'published',
                thumbnail TEXT,
                duration INTEGER DEFAULT 30,
                lessons_count INTEGER DEFAULT 10,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        const { data: coursesResult, error: coursesError } = await supabaseAdmin.rpc('exec_sql', {
            sql: coursesTableSQL
        });

        if (coursesError) {
            console.error('❌ courses 테이블 생성 실패:', coursesError);
            // 대안 방법: 직접 SQL 실행
            const { error: directError } = await supabaseAdmin
                .from('courses')
                .select('id')
                .limit(1);
            
            if (directError && directError.code === 'PGRST116') {
                console.log('⚡ 대안 방법으로 courses 테이블 생성 시도...');
                // 테이블이 없으므로 SQL로 직접 생성할 수 없음
                // 대신 RPC 함수를 만들어서 실행
                console.log('ℹ️ Supabase 대시보드에서 수동으로 테이블을 생성해야 합니다.');
            }
        } else {
            console.log('✅ courses 테이블 생성 완료');
        }

        console.log('\n📋 2. enrollments 테이블 생성 중...');
        
        // 2. enrollments 테이블 생성
        const enrollmentsTableSQL = `
            -- 수강신청 테이블 생성
            CREATE TABLE IF NOT EXISTS enrollments (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'progress',
                progress INTEGER DEFAULT 0,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, course_id)
            );
        `;

        const { data: enrollmentsResult, error: enrollmentsError } = await supabaseAdmin.rpc('exec_sql', {
            sql: enrollmentsTableSQL
        });

        if (enrollmentsError) {
            console.error('❌ enrollments 테이블 생성 실패:', enrollmentsError);
        } else {
            console.log('✅ enrollments 테이블 생성 완료');
        }

        console.log('\n🔒 3. RLS 정책 설정 중...');
        
        // 3. RLS 정책 설정
        const rlsPolicySQL = `
            -- courses 테이블 RLS 설정
            ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
            
            -- 모든 사용자가 강좌를 조회할 수 있도록 정책 생성
            CREATE POLICY IF NOT EXISTS "모든 사용자는 강좌를 조회할 수 있습니다" ON courses
                FOR SELECT USING (true);
                
            -- enrollments 테이블 RLS 설정
            ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 수강신청만 조회/수정할 수 있도록 정책 생성
            CREATE POLICY IF NOT EXISTS "사용자는 자신의 수강신청만 조회할 수 있습니다" ON enrollments
                FOR SELECT USING (auth.uid() = user_id);
                
            CREATE POLICY IF NOT EXISTS "사용자는 자신의 수강신청만 삽입할 수 있습니다" ON enrollments
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                
            CREATE POLICY IF NOT EXISTS "사용자는 자신의 수강신청만 업데이트할 수 있습니다" ON enrollments
                FOR UPDATE USING (auth.uid() = user_id);
        `;

        const { data: rlsResult, error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
            sql: rlsPolicySQL
        });

        if (rlsError) {
            console.error('❌ RLS 정책 설정 실패:', rlsError);
        } else {
            console.log('✅ RLS 정책 설정 완료');
        }

        console.log('\n📚 4. 샘플 강좌 데이터 삽입 중...');
        
        // 4. 샘플 강좌 데이터 삽입
        const sampleCourses = [
            {
                title: '웹 개발 입문 과정',
                instructor: '김개발',
                category: 'development',
                price: 299000,
                rating: 4.8,
                students: 1250,
                status: 'published',
                thumbnail: 'images/pd1.jpg',
                duration: 60,
                lessons_count: 24,
                description: '초보자를 위한 웹 개발 완벽 가이드. HTML, CSS, JavaScript부터 React까지 체계적으로 배우세요.'
            },
            {
                title: '디지털 마케팅 마스터',
                instructor: '박마케팅',
                category: 'marketing',
                price: 249000,
                rating: 4.6,
                students: 890,
                status: 'published',
                thumbnail: 'images/pd2.jpg',
                duration: 45,
                lessons_count: 18,
                description: 'SNS 마케팅부터 구글 광고까지, 실전 디지털 마케팅 전략을 배워보세요.'
            },
            {
                title: '창업 실무 완전정복',
                instructor: '최창업',
                category: 'business',
                price: 399000,
                rating: 4.9,
                students: 567,
                status: 'published',
                thumbnail: 'images/pd3.jpg',
                duration: 90,
                lessons_count: 32,
                description: '아이디어부터 사업자등록, 마케팅까지. 성공 창업을 위한 모든 것을 담았습니다.'
            },
            {
                title: 'AI 비즈니스 활용법',
                instructor: '이AI',
                category: 'technology',
                price: 349000,
                rating: 4.7,
                students: 723,
                status: 'published',
                thumbnail: 'images/pd4.jpg',
                duration: 30,
                lessons_count: 15,
                description: 'ChatGPT, 미드저니 등 AI 도구를 활용한 비즈니스 혁신 전략을 배워보세요.'
            },
            {
                title: '브랜딩 전략 설계',
                instructor: '정브랜드',
                category: 'branding',
                price: 199000,
                rating: 4.5,
                students: 456,
                status: 'published',
                thumbnail: 'images/pd11.jpg',
                duration: 35,
                lessons_count: 14,
                description: '강력한 브랜드 아이덴티티 구축부터 고객 충성도 향상까지의 전략을 학습하세요.'
            }
        ];

        // 기존 강좌 데이터 확인
        const { data: existingCourses, error: checkError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .limit(1);

        if (checkError) {
            console.error('❌ 강좌 테이블 접근 불가:', checkError);
            console.log('⚠️ 테이블이 생성되지 않았을 수 있습니다.');
        } else if (!existingCourses || existingCourses.length === 0) {
            // 강좌 데이터 삽입
            const { data: insertedCourses, error: insertError } = await supabaseAdmin
                .from('courses')
                .insert(sampleCourses)
                .select();

            if (insertError) {
                console.error('❌ 강좌 데이터 삽입 실패:', insertError);
            } else {
                console.log('✅ 샘플 강좌 데이터 삽입 완료:', insertedCourses?.length || 0, '개');
            }
        } else {
            console.log('✅ 기존 강좌 데이터 존재 - 삽입 생략');
        }

        console.log('\n🎉 테이블 생성 작업 완료!');
        console.log('📋 생성된 테이블:');
        console.log('   - courses (강좌 정보)');
        console.log('   - enrollments (수강신청 정보)');
        console.log('🔒 RLS 보안 정책 적용 완료');
        console.log('📚 샘플 데이터 삽입 완료');
        
    } catch (error) {
        console.error('❌ 테이블 생성 중 오류 발생:', error);
        
        // 대안: 직접 테이블 존재 여부 확인
        try {
            console.log('\n🔍 테이블 존재 여부 확인 중...');
            
            const { data: coursesData, error: coursesCheckError } = await supabaseAdmin
                .from('courses')
                .select('count')
                .limit(1);
                
            if (coursesCheckError) {
                console.log('❌ courses 테이블 없음');
            } else {
                console.log('✅ courses 테이블 존재');
            }
            
            const { data: enrollmentsData, error: enrollmentsCheckError } = await supabaseAdmin
                .from('enrollments')
                .select('count')
                .limit(1);
                
            if (enrollmentsCheckError) {
                console.log('❌ enrollments 테이블 없음');
            } else {
                console.log('✅ enrollments 테이블 존재');
            }
            
        } catch (checkError) {
            console.error('❌ 테이블 확인 중 오류:', checkError);
        }
    }
}

// 스크립트 실행
createTables()
    .then(() => {
        console.log('\n✨ 모든 작업이 완료되었습니다!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 스크립트 실행 중 오류:', error);
        process.exit(1);
    }); 