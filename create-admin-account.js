// 관리자 계정 생성 스크립트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdminAccount() {
    try {
        console.log('🔧 관리자 계정 생성 시도...');
        
        // 기존 사용자 확인
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.log('⚠️ 사용자 목록 조회 불가:', listError);
        } else {
            console.log('📋 기존 사용자 목록:', users.users.map(u => u.email));
        }
        
        // 관리자 계정 생성 시도
        const { data, error } = await supabase.auth.signUp({
            email: 'admin@baroedu.com',
            password: 'admin123!@#',
            options: {
                data: {
                    full_name: '바로교육 관리자',
                    role: 'admin'
                }
            }
        });
        
        if (error) {
            console.error('❌ 관리자 계정 생성 실패:', error);
            
            // 이미 존재하는 경우 로그인 테스트
            if (error.message.includes('already registered')) {
                console.log('📧 이미 존재하는 계정 - 로그인 테스트 중...');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: 'admin@baroedu.com',
                    password: 'admin123!@#'
                });
                
                if (signInError) {
                    console.error('❌ 로그인 실패:', signInError);
                } else {
                    console.log('✅ 로그인 성공:', signInData.user.email);
                }
            }
        } else {
            console.log('✅ 관리자 계정 생성 성공:', data.user.email);
        }
        
        // test@baroedu.com 계정도 생성 시도
        console.log('🔧 test@baroedu.com 계정 생성 시도...');
        const { data: testData, error: testError } = await supabase.auth.signUp({
            email: 'test@baroedu.com',
            password: 'admin123!@#',
            options: {
                data: {
                    full_name: '테스트 관리자',
                    role: 'admin'
                }
            }
        });
        
        if (testError) {
            console.error('❌ test 계정 생성 실패:', testError);
        } else {
            console.log('✅ test 계정 생성 성공:', testData.user.email);
        }
        
    } catch (error) {
        console.error('❌ 전체 프로세스 실패:', error);
    }
}

createAdminAccount(); 