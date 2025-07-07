// Supabase 연결 및 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSupabaseConnection() {
    console.log('🔍 Supabase 연결 상태 확인 중...');
    
    try {
        // 1. 연결 테스트
        const { data, error } = await supabase.from('courses').select('count').single();
        console.log('✅ Supabase 연결 성공');
        
        // 2. courses 테이블 확인
        console.log('\n📚 courses 테이블 확인:');
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .limit(5);
            
        if (coursesError) {
            console.error('❌ courses 테이블 오류:', coursesError);
        } else {
            console.log('✅ courses 데이터:', courses.length, '개');
            console.log('샘플 데이터:', courses[0]);
        }
        
        // 3. enrollments 테이블 확인
        console.log('\n📝 enrollments 테이블 확인:');
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('*')
            .limit(5);
            
        if (enrollmentsError) {
            console.error('❌ enrollments 테이블 오류:', enrollmentsError);
        } else {
            console.log('✅ enrollments 데이터:', enrollments.length, '개');
            console.log('샘플 데이터:', enrollments[0]);
        }
        
        // 4. JOIN 쿼리 테스트
        console.log('\n🔗 JOIN 쿼리 테스트:');
        const { data: joinData, error: joinError } = await supabase
            .from('enrollments')
            .select(`
                *,
                courses(
                    id,
                    title,
                    instructor_name,
                    price,
                    thumbnail,
                    description
                )
            `)
            .limit(3);
            
        if (joinError) {
            console.error('❌ JOIN 쿼리 오류:', joinError);
        } else {
            console.log('✅ JOIN 쿼리 성공:', joinData.length, '개');
            console.log('샘플 결과:', joinData[0]);
        }
        
    } catch (error) {
        console.error('❌ 전체 확인 중 오류:', error);
    }
}

checkSupabaseConnection(); 