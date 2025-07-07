const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key'; // 서비스 키 필요

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVideoColumn() {
    try {
        console.log('🚀 강좌 테이블에 video_url 컬럼 추가 중...');

        // SQL 쿼리 실행으로 컬럼 추가
        const { data, error } = await supabase.rpc('add_video_url_column', {});

        if (error) {
            // RPC 함수가 없는 경우 직접 SQL 실행
            console.log('📋 다음 SQL을 Supabase 대시보드에서 실행하세요:');
            console.log('');
            console.log('-- 강좌 테이블에 video_url 컬럼 추가');
            console.log('ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;');
            console.log('');
            console.log('-- 컬럼 설명 추가');
            console.log('COMMENT ON COLUMN courses.video_url IS \'강좌 영상 파일 URL\';');
            console.log('');
            console.log('-- 인덱스 추가 (선택사항)');
            console.log('CREATE INDEX IF NOT EXISTS idx_courses_video_url ON courses(video_url);');
            console.log('');
            
            console.log('🔧 또는 Supabase 대시보드에서 다음 단계를 따르세요:');
            console.log('1. Supabase 대시보드 → Table Editor → courses 테이블 선택');
            console.log('2. "Add column" 버튼 클릭');
            console.log('3. 컬럼 정보 입력:');
            console.log('   - Name: video_url');
            console.log('   - Type: text');
            console.log('   - Default value: (비워둠)');
            console.log('   - Is nullable: ✅ (체크)');
            console.log('   - Is unique: ❌ (체크 해제)');
            console.log('4. "Save" 버튼 클릭');
            console.log('');
            
            return;
        }

        console.log('✅ video_url 컬럼이 성공적으로 추가되었습니다!');
        
        // 컬럼 추가 확인
        const { data: testData, error: testError } = await supabase
            .from('courses')
            .select('video_url')
            .limit(1);

        if (testError) {
            console.warn('⚠️  컬럼 추가 확인 실패:', testError.message);
        } else {
            console.log('🎉 컬럼 추가가 완료되었습니다!');
        }

    } catch (error) {
        console.error('❌ 컬럼 추가 에러:', error);
        console.log('');
        console.log('📋 수동으로 다음 SQL을 실행하세요:');
        console.log('ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;');
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    addVideoColumn();
}

module.exports = { addVideoColumn }; 