// Supabase 테이블 상태 확인 및 데이터 삽입 스크립트
const { createClient } = require('@supabase/supabase-js');
const config = require('./config/env');

// Supabase 관리자 클라이언트 (Service Role Key 사용)
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

console.log('🔍 Supabase 테이블 상태 확인 중...');
console.log('📍 Supabase URL:', config.SUPABASE_URL);

async function checkAndCreateData() {
    try {
        console.log('\n📋 1. courses 테이블 확인...');
        
        // courses 테이블 확인
        const { data: coursesData, error: coursesError } = await supabaseAdmin
            .from('courses')
            .select('id, title')
            .limit(5);

        if (coursesError) {
            console.error('❌ courses 테이블 없음:', coursesError.code);
            if (coursesError.code === 'PGRST116') {
                console.log('⚠️ courses 테이블이 존재하지 않습니다.');
                console.log('📋 Supabase 대시보드에서 테이블을 생성해야 합니다.');
                
                // 테이블 생성 SQL 출력
                console.log('\n📝 courses 테이블 생성 SQL:');
                console.log(`
CREATE TABLE courses (
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

-- RLS 설정
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "모든 사용자는 강좌를 조회할 수 있습니다" ON courses FOR SELECT USING (true);
                `.trim());
            }
        } else {
            console.log('✅ courses 테이블 존재:', coursesData?.length || 0, '개 강좌');
            
            // 강좌 데이터가 없으면 삽입
            if (!coursesData || coursesData.length === 0) {
                console.log('📚 샘플 강좌 데이터 삽입 중...');
                
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
                console.log('✅ 기존 강좌 데이터 확인됨:', coursesData.length, '개');
                coursesData.forEach((course, index) => {
                    console.log(`   ${index + 1}. ${course.title} (ID: ${course.id})`);
                });
            }
        }

        console.log('\n📋 2. enrollments 테이블 확인...');
        
        // enrollments 테이블 확인
        const { data: enrollmentsData, error: enrollmentsError } = await supabaseAdmin
            .from('enrollments')
            .select('id, user_id')
            .limit(5);

        if (enrollmentsError) {
            console.error('❌ enrollments 테이블 없음:', enrollmentsError.code);
            if (enrollmentsError.code === 'PGRST116') {
                console.log('⚠️ enrollments 테이블이 존재하지 않습니다.');
                console.log('📋 Supabase 대시보드에서 테이블을 생성해야 합니다.');
                
                // 테이블 생성 SQL 출력
                console.log('\n📝 enrollments 테이블 생성 SQL:');
                console.log(`
CREATE TABLE enrollments (
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

-- RLS 설정
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "사용자는 자신의 수강신청만 조회할 수 있습니다" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "사용자는 자신의 수강신청만 삽입할 수 있습니다" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "사용자는 자신의 수강신청만 업데이트할 수 있습니다" ON enrollments FOR UPDATE USING (auth.uid() = user_id);
                `.trim());
            }
        } else {
            console.log('✅ enrollments 테이블 존재:', enrollmentsData?.length || 0, '개 수강신청');
        }

        console.log('\n🔗 3. 관계 확인...');
        
        // 강좌와 수강신청 관계 확인
        const { data: relationData, error: relationError } = await supabaseAdmin
            .from('enrollments')
            .select(`
                id,
                status,
                progress,
                courses(id, title, instructor)
            `)
            .limit(3);

        if (relationError) {
            console.error('❌ 관계 확인 실패:', relationError);
        } else if (relationData && relationData.length > 0) {
            console.log('✅ 강좌-수강신청 관계 정상:', relationData.length, '개');
            relationData.forEach((enrollment, index) => {
                const course = enrollment.courses;
                console.log(`   ${index + 1}. ${course?.title} (${enrollment.status} ${enrollment.progress}%)`);
            });
        } else {
            console.log('ℹ️ 수강신청 데이터 없음');
        }

        console.log('\n🎉 테이블 상태 확인 완료!');
        
    } catch (error) {
        console.error('❌ 확인 중 오류 발생:', error);
    }
}

// 스크립트 실행
checkAndCreateData()
    .then(() => {
        console.log('\n✨ 모든 확인이 완료되었습니다!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 스크립트 실행 중 오류:', error);
        process.exit(1);
    }); 