// 바로교육 관리자 API 클라이언트 (Supabase 직접 연결 - anon key 전용)
// Supabase 설정
const SUPABASE_URL = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

// 관리자 이메일 목록 (간단한 권한 확인용)
const ADMIN_EMAILS = [
    'admin@baroedu.com',
    'manager@baroedu.com',
    'test@baroedu.com'
];

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 관리자 API 클라이언트 클래스
class ApiClient {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    // 초기화
    async init() {
        try {
            // 현재 세션 확인
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
            }

            // 인증 상태 변경 감지
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    this.currentUser = session.user;
                    this.isAuthenticated = true;
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.isAuthenticated = false;
                }
            });
        } catch (error) {
            console.error('API Client 초기화 에러:', error);
        }
    }

    // =================================
    // 인증 관련 API
    // =================================

    // 관리자 로그인
    async login(email, password) {
        try {
            // 관리자 이메일 확인 (먼저 체크)
            if (!this.isAdminEmail(email)) {
                throw new Error('관리자 권한이 없습니다.');
            }

            // Supabase 로그인
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.isAuthenticated = true;

            return { 
                success: true, 
                user: data.user,
                token: data.session.access_token 
            };
        } catch (error) {
            console.error('관리자 로그인 에러:', error);
            throw new Error(error.message || '로그인에 실패했습니다.');
        }
    }

    // 관리자 이메일 확인 (간단한 방식)
    isAdminEmail(email) {
        return ADMIN_EMAILS.includes(email.toLowerCase());
    }

    // 토큰 검증
    async verifyToken() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('인증되지 않은 사용자입니다.');
            }

            // 관리자 이메일 확인
            if (!this.isAdminEmail(user.email)) {
                throw new Error('관리자 권한이 없습니다.');
            }

            return { 
                success: true, 
                user: user 
            };
        } catch (error) {
            console.error('토큰 검증 에러:', error);
            throw error;
        }
    }

    // 로그아웃
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.isAuthenticated = false;
            
            window.location.href = 'login.html';
        } catch (error) {
            console.error('로그아웃 에러:', error);
        }
    }

    // =================================
    // 대시보드 통계 API
    // =================================

    // 대시보드 통계 조회
    async getDashboardStats() {
        try {
            const [userCount, courseCount, enrollmentCount] = await Promise.all([
                this.getUserCount(),
                this.getCourseCount(),
                this.getEnrollmentCount()
            ]);

            return {
                success: true,
                data: {
                    userCount,
                    courseCount,
                    enrollmentCount,
                    reviewCount: 0 // 기본값
                }
            };
        } catch (error) {
            console.error('대시보드 통계 조회 에러:', error);
            return {
                success: true,
                data: {
                    userCount: 0,
                    courseCount: 0,
                    enrollmentCount: 0,
                    reviewCount: 0
                }
            };
        }
    }

    // 사용자 수 조회
    async getUserCount() {
        try {
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('사용자 수 조회 에러:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('사용자 수 조회 에러:', error);
            return 0;
        }
    }

    // 강좌 수 조회
    async getCourseCount() {
        try {
            const { count, error } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('강좌 수 조회 에러:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('강좌 수 조회 에러:', error);
            return 0;
        }
    }

    // 수강신청 수 조회
    async getEnrollmentCount() {
        try {
            const { count, error } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('수강신청 수 조회 에러:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('수강신청 수 조회 에러:', error);
            return 0;
        }
    }

    // 최근 활동 조회
    async getRecentActivities() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.warn('최근 활동 조회 에러:', error);
                return { success: true, data: [] };
            }

            return {
                success: true,
                data: (data || []).map(user => ({
                    type: 'user_registered',
                    description: `${user.name || '사용자'}님이 회원가입했습니다.`,
                    created_at: user.created_at
                }))
            };
        } catch (error) {
            console.warn('최근 활동 조회 에러:', error);
            return { success: true, data: [] };
        }
    }

    // 월별 통계 조회
    async getMonthlyStats() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('created_at')
                .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

            if (error) {
                console.warn('월별 통계 조회 에러:', error);
                return { success: true, data: [] };
            }

            // 월별 데이터 집계
            const monthlyData = Array.from({length: 12}, (_, i) => ({
                month: i + 1,
                count: 0
            }));

            (data || []).forEach(user => {
                const month = new Date(user.created_at).getMonth();
                monthlyData[month].count++;
            });

            return {
                success: true,
                data: monthlyData
            };
        } catch (error) {
            console.warn('월별 통계 조회 에러:', error);
            return { success: true, data: [] };
        }
    }

    // =================================
    // 강좌 관리 API
    // =================================

    // 강좌 목록 조회
    async getCourses() {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('강좌 목록 조회 에러:', error);
                return { success: true, data: [] };
            }

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.warn('강좌 목록 조회 에러:', error);
            return { success: true, data: [] };
        }
    }

    // 강좌 생성
    async createCourse(courseData) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .insert([{
                    ...courseData,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('강좌 생성 에러:', error);
            throw error;
        }
    }

    // 강좌 수정
    async updateCourse(courseId, courseData) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .update({
                    ...courseData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', courseId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('강좌 수정 에러:', error);
            throw error;
        }
    }

    // 강좌 삭제
    async deleteCourse(courseId) {
        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;

            return {
                success: true,
                message: '강좌가 성공적으로 삭제되었습니다.'
            };
        } catch (error) {
            console.error('강좌 삭제 에러:', error);
            throw error;
        }
    }

    // =================================
    // 사용자 관리 API
    // =================================

    // 사용자 목록 조회
    async getUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('사용자 목록 조회 에러:', error);
                return { success: true, data: [] };
            }

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.warn('사용자 목록 조회 에러:', error);
            return { success: true, data: [] };
        }
    }

    // 수강신청 목록 조회
    async getEnrollments() {
        try {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    users(name, email),
                    courses(title, price)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('수강신청 목록 조회 에러:', error);
                return { success: true, data: [] };
            }

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.warn('수강신청 목록 조회 에러:', error);
            return { success: true, data: [] };
        }
    }
}

// 전역 API 클라이언트 인스턴스
const apiClient = new ApiClient();

// 인증 상태 확인 함수
async function checkAuth() {
    try {
        console.log('🔍 checkAuth() 호출됨');
        const response = await apiClient.verifyToken();
        console.log('🔐 verifyToken 응답:', response);
        
        if (response.success) {
            console.log('✅ 인증 성공:', response.user);
            return response.user;
        }
        console.log('❌ 인증 실패');
        return false;
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        return false;
    }
}

// 로그아웃 함수
function logout() {
    apiClient.logout();
}

// 사용자 정보 가져오기
async function getUserInfo() {
    try {
        const response = await apiClient.verifyToken();
        return response.user;
    } catch (error) {
        console.error('User info fetch failed:', error);
        return null;
    }
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'success') {
    // 기존 토스트 제거
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 토스트 생성
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
            <button type="button" class="close ml-auto" onclick="this.parentElement.parentElement.remove()">
                <span>&times;</span>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // 3초 후 자동 제거
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 통화 포맷팅 함수
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
}

// API 에러 핸들링
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason.message?.includes('401') || event.reason.message?.includes('403')) {
        showToast('인증이 만료되었습니다. 다시 로그인해주세요.', 'error');
        setTimeout(() => {
            apiClient.logout();
        }, 2000);
    } else {
        showToast('오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
});

// 네트워크 연결 상태 모니터링
window.addEventListener('online', function() {
    showToast('네트워크 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', function() {
    showToast('네트워크 연결이 끊어졌습니다.', 'error');
});

// 페이지 로드 시 토큰 검증
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 페이지가 아닌 경우에만 토큰 검증
    if (!window.location.pathname.includes('login.html')) {
        checkAuth();
    }
});

// 관리자 이메일 확인 함수 (전역 노출)
window.isAdminEmail = function(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}; 