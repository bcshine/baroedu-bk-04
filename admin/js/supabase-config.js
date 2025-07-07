// Supabase 설정 (anon key 전용)
// 이 파일은 api-client.js와 함께 사용되므로 중복 선언을 방지합니다.
// 실제 설정값은 api-client.js에서 관리합니다.

// 관리자 이메일 목록 (간단한 권한 확인용) - 추가 목록
const ADDITIONAL_ADMIN_EMAILS = [
    'manager@baroedu.com'
];

// Supabase 클라이언트는 api-client.js에서 초기화되므로 여기서는 선언하지 않습니다.

// 관리자 로그인 함수
async function adminLogin(email, password) {
    try {
        // 관리자 이메일 확인 (api-client.js의 ADMIN_EMAILS 사용)
        if (!window.isAdminEmail || !window.isAdminEmail(email)) {
            throw new Error('관리자 권한이 없습니다.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('관리자 로그인 에러:', error);
        throw error;
    }
}

// 관리자 권한 확인 (간단한 방식)
async function checkAdminRole(userEmail) {
    try {
        // api-client.js의 isAdminEmail 함수 사용
        if (window.isAdminEmail) {
            return window.isAdminEmail(userEmail);
        }
        
        // 기본 관리자 이메일 확인
        const adminEmails = ['admin@baroedu.com', 'manager@baroedu.com'];
        return adminEmails.includes(userEmail.toLowerCase());
    } catch (error) {
        console.error('관리자 권한 확인 에러:', error);
        return false;
    }
}

// 인증 상태 확인
async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }

        // 관리자 권한 확인
        const isAdmin = await checkAdminRole(user.email);
        if (!isAdmin) {
            await supabase.auth.signOut();
            alert('관리자 권한이 없습니다.');
            window.location.href = 'login.html';
            return false;
        }

        return user;
    } catch (error) {
        console.error('인증 확인 에러:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// 로그아웃 함수
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('로그아웃 에러:', error);
        }
        window.location.href = 'login.html';
    } catch (error) {
        console.error('로그아웃 에러:', error);
        window.location.href = 'login.html';
    }
}

// 사용자 정보 가져오기
async function getUserInfo() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('사용자 정보 조회 에러:', error);
        return null;
    }
}

// 데이터베이스 유틸리티 함수들 (안전한 버전)
const db = {
    // 사용자 관련
    async getUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('사용자 조회 에러:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.warn('사용자 조회 에러:', error);
            return [];
        }
    },

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
    },

    // 강좌 관련
    async getCourses() {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('강좌 조회 에러:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.warn('강좌 조회 에러:', error);
            return [];
        }
    },

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
    },

    // 수강신청 관련
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
                console.warn('수강신청 조회 에러:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.warn('수강신청 조회 에러:', error);
            return [];
        }
    },

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
    },

    // 후기 관련 (기본값 반환)
    async getReviews() {
        try {
            // 일단 기본값 반환 (필요시 나중에 구현)
            return [];
        } catch (error) {
            console.warn('후기 조회 에러:', error);
            return [];
        }
    },

    // 결제 관련 (기본값 반환)
    async getPayments() {
        try {
            // 일단 기본값 반환 (필요시 나중에 구현)
            return [];
        } catch (error) {
            console.warn('결제 조회 에러:', error);
            return [];
        }
    },

    // 월별 통계
    async getMonthlyStats() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('created_at')
                .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

            if (error) {
                console.warn('월별 통계 조회 에러:', error);
                return [];
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

            return monthlyData;
        } catch (error) {
            console.warn('월별 통계 조회 에러:', error);
            return [];
        }
    },

    // 유틸리티 함수들
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    formatCurrency(amount) {
        if (!amount) return '₩0';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    },

    showToast(message, type = 'success') {
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
};

// 페이지 로드 시 인증 확인
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 페이지가 아닌 경우에만 인증 확인
    if (!window.location.pathname.includes('login.html')) {
        const user = await checkAuth();
        if (user) {
            // 관리자 이름 표시
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = user.email || '관리자';
            }
        }
    }
}); 