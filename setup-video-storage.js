const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupVideoStorage() {
    try {
        console.log('🚀 영상 스토리지 설정 시작...');

        // 1. course-videos 스토리지 버킷 생성
        console.log('📁 course-videos 스토리지 버킷 생성 중...');
        const { data: bucketData, error: bucketError } = await supabase.storage
            .createBucket('course-videos', {
                public: true,
                allowedMimeTypes: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
                fileSizeLimit: 104857600 // 100MB
            });

        if (bucketError && bucketError.message !== 'The resource already exists') {
            throw new Error(`스토리지 버킷 생성 에러: ${bucketError.message}`);
        }

        console.log('✅ course-videos 스토리지 버킷 생성 완료');

        // 2. 강좌 테이블에 video_url 컬럼 추가
        console.log('📊 강좌 테이블 업데이트 중...');
        const { data: tableData, error: tableError } = await supabase
            .from('courses')
            .select('video_url')
            .limit(1);

        if (tableError && tableError.message.includes('column "video_url" does not exist')) {
            // video_url 컬럼이 존재하지 않는 경우 수동으로 추가 안내
            console.log('⚠️  video_url 컬럼이 존재하지 않습니다.');
            console.log('📋 Supabase 대시보드에서 다음 SQL을 실행하여 컬럼을 추가하세요:');
            console.log('');
            console.log('ALTER TABLE courses ADD COLUMN video_url TEXT;');
            console.log('');
            console.log('또는 다음 스크립트를 실행하세요:');
            console.log('node add-video-column.js');
        } else {
            console.log('✅ video_url 컬럼이 이미 존재합니다.');
        }

        // 3. 스토리지 정책 설정 (RLS 정책)
        console.log('🔐 스토리지 정책 설정 안내...');
        console.log('');
        console.log('📋 Supabase 대시보드 > Storage > course-videos > Settings에서 다음 정책을 설정하세요:');
        console.log('');
        console.log('1. INSERT 정책 (업로드 허용):');
        console.log('   - Policy name: Allow authenticated users to upload videos');
        console.log('   - Target roles: authenticated');
        console.log('   - Policy definition: (auth.role() = \'authenticated\')');
        console.log('');
        console.log('2. SELECT 정책 (다운로드 허용):');
        console.log('   - Policy name: Allow public access to videos');
        console.log('   - Target roles: public');
        console.log('   - Policy definition: true');
        console.log('');
        console.log('3. UPDATE 정책 (업데이트 허용):');
        console.log('   - Policy name: Allow authenticated users to update videos');
        console.log('   - Target roles: authenticated');
        console.log('   - Policy definition: (auth.role() = \'authenticated\')');
        console.log('');
        console.log('4. DELETE 정책 (삭제 허용):');
        console.log('   - Policy name: Allow authenticated users to delete videos');
        console.log('   - Target roles: authenticated');
        console.log('   - Policy definition: (auth.role() = \'authenticated\')');
        console.log('');

        console.log('🎉 영상 스토리지 설정이 완료되었습니다!');
        console.log('');
        console.log('📖 사용 방법:');
        console.log('1. 관리자 페이지에서 강좌 추가 시 영상 파일을 선택하세요');
        console.log('2. 50MB 이상의 영상은 자동으로 압축됩니다');
        console.log('3. 압축 후에도 100MB를 초과하는 영상은 업로드할 수 없습니다');
        console.log('4. 업로드된 영상은 강좌 목록에서 재생할 수 있습니다');

    } catch (error) {
        console.error('❌ 영상 스토리지 설정 에러:', error);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    setupVideoStorage();
}

module.exports = { setupVideoStorage }; 