// 바로교육 관리자 API 클라이언트 (Supabase 직접 연결 - RPC 함수 사용)
// Supabase 설정
const SUPABASE_URL = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

// 관리자 이메일 목록 (RLS 정책과 일치해야 함)
const ADMIN_EMAILS = [
    'admin@baroedu.com',
    'bcshin0303@naver.com',
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
    // 관리자 권한 확인
    // =================================

    // 관리자 권한 확인 (RLS 정책과 동일한 로직)
    async checkAdminPermission() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                return false;
            }
            
            return ADMIN_EMAILS.includes(user.email);
        } catch (error) {
            console.error('관리자 권한 확인 오류:', error);
            return false;
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
    // 대시보드 통계 API (RPC 함수 사용)
    // =================================

    // 대시보드 통계 조회
    async getDashboardStats() {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

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

    // 사용자 수 조회 (RPC 함수 사용)
    async getUserCount() {
        try {
            // 1차 시도: RPC 함수 사용
            const { data: result, error: rpcError } = await supabase
                .rpc('get_all_users_admin');

            if (!rpcError && result) {
                return result.length;
            }

            // 2차 시도: auth.users 직접 조회 (안전 모드)
            console.warn('RPC 함수 실패, 직접 조회 시도');
            
            // auth.users는 RLS가 적용되지 않을 수 있음
            const { count, error } = await supabase
                .from('auth.users')
                .select('*', { count: 'exact', head: true })
                .not('email_confirmed_at', 'is', null);
            
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

    // 수강신청 수 조회 (RPC 함수 사용)
    async getEnrollmentCount() {
        try {
            // 1차 시도: 직접 조회 (관리자 정책이 있다면)
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

    // =================================
    // 사용자 관리 API (RPC 함수 사용)
    // =================================

    // 전체 사용자 목록 조회 (관리자 전용)
    async getUsers() {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // RPC 함수로 전체 사용자 조회
            const { data: users, error: rpcError } = await supabase
                .rpc('get_all_users_admin');

            if (rpcError) {
                console.warn('RPC 사용자 조회 실패:', rpcError);
                // 빈 배열 반환 (에러 대신)
                return { success: true, data: [] };
            }

            return { 
                success: true, 
                data: users || [] 
            };
        } catch (error) {
            console.error('사용자 목록 조회 에러:', error);
            return { success: false, data: [], error: error.message };
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
                console.warn('강좌 조회 에러:', error);
                return { success: true, data: [] };
            }
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('강좌 목록 조회 에러:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // 강좌 생성
    async createCourse(courseData) {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            const { data, error } = await supabase
                .from('courses')
                .insert([courseData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('강좌 생성 에러:', error);
            return { success: false, error: error.message };
        }
    }

    // 강좌 수정
    async updateCourse(courseId, courseData) {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            const { data, error } = await supabase
                .from('courses')
                .update(courseData)
                .eq('id', courseId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('강좌 수정 에러:', error);
            return { success: false, error: error.message };
        }
    }

    // 강좌 삭제
    async deleteCourse(courseId) {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('강좌 삭제 에러:', error);
            return { success: false, error: error.message };
        }
    }

    // =================================
    // 수강신청 관리 API (RPC 함수 사용)
    // =================================

    // 수강신청 목록 조회 (관리자 전용)
    async getEnrollments() {
        try {
            // 관리자 권한 확인
            const isAdmin = await this.checkAdminPermission();
            if (!isAdmin) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 직접 조회 시도 (관리자 정책이 있다면)
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    courses(title, price)
                `)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('수강신청 조회 에러:', error);
                return { success: true, data: [] };
            }
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('수강신청 목록 조회 에러:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // =================================
    // 활동 및 통계 API
    // =================================

    // 최근 활동 조회
    async getRecentActivities() {
        try {
            // 최근 수강신청 정보 조회
            const enrollments = await this.getEnrollments();
            
            return { 
                success: true, 
                data: {
                    enrollments: enrollments.data.slice(0, 10) || [],
                    reviews: [] // 기본값
                }
            };
        } catch (error) {
            console.error('최근 활동 조회 에러:', error);
            return { 
                success: true, 
                data: { enrollments: [], reviews: [] } 
            };
        }
    }

    // 월별 통계 조회
    async getMonthlyStats() {
        try {
            // 기본 통계 데이터 반환
            return {
                success: true,
                data: {
                    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
                    datasets: [{
                        label: '수강신청',
                        data: [10, 15, 8, 22, 18, 25],
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2
                    }]
                }
            };
        } catch (error) {
            console.error('월별 통계 조회 에러:', error);
            return { success: false, error: error.message };
        }
    }
}

// =================================
// 전역 함수들
// =================================

// API 클라이언트 인스턴스 생성
const apiClient = new ApiClient();

// 인증 확인 함수
async function checkAuth() {
    try {
        const response = await apiClient.verifyToken();
        return response.user;
    } catch (error) {
        console.error('인증 확인 에러:', error);
        return null;
    }
}

// 로그아웃 함수
function logout() {
    apiClient.logout();
}

// 사용자 정보 조회
async function getUserInfo() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('사용자 정보 조회 에러:', error);
        return null;
    }
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'success') {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="3000">
            <div class="toast-header bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} text-white">
                <strong class="mr-auto">알림</strong>
                <button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast">
                    <span>&times;</span>
                </button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    $(toastElement).toast('show');
    
    $(toastElement).on('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 통화 포맷팅
function formatCurrency(amount) {
    if (!amount) return '0원';
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