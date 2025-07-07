// API 클라이언트 (보안 강화된 버전)
class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('admin_token');
    }

    // 헤더 설정
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // HTTP 요청 공통 메서드
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                ...options
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // GET 요청
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST 요청
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 요청
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 요청
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 토큰 설정
    setToken(token) {
        this.token = token;
        localStorage.setItem('admin_token', token);
    }

    // 토큰 제거
    removeToken() {
        this.token = null;
        localStorage.removeItem('admin_token');
    }

    // =================================
    // 인증 관련 API
    // =================================

    // 관리자 로그인
    async login(email, password) {
        try {
            const response = await this.post('/admin/login', { email, password });
            
            if (response.success && response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    // 토큰 검증
    async verifyToken() {
        try {
            return await this.get('/admin/verify');
        } catch (error) {
            this.removeToken();
            throw error;
        }
    }

    // 로그아웃
    logout() {
        this.removeToken();
        window.location.href = 'login.html';
    }

    // =================================
    // 대시보드 통계 API
    // =================================

    // 대시보드 통계 조회
    async getDashboardStats() {
        return this.get('/admin/stats');
    }

    // 최근 활동 조회
    async getRecentActivities() {
        return this.get('/admin/recent-activities');
    }

    // 월별 통계 조회
    async getMonthlyStats() {
        return this.get('/admin/monthly-stats');
    }

    // =================================
    // 강좌 관리 API
    // =================================

    // 강좌 목록 조회
    async getCourses() {
        return this.get('/admin/courses');
    }

    // 강좌 생성
    async createCourse(courseData) {
        return this.post('/admin/courses', courseData);
    }

    // 강좌 수정
    async updateCourse(courseId, courseData) {
        return this.put(`/admin/courses/${courseId}`, courseData);
    }

    // 강좌 삭제
    async deleteCourse(courseId) {
        return this.delete(`/admin/courses/${courseId}`);
    }
}

// 전역 API 클라이언트 인스턴스
const apiClient = new ApiClient();

// 인증 상태 확인 함수
async function checkAuth() {
    try {
        const response = await apiClient.verifyToken();
        if (response.success) {
            return response.user;
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = 'login.html';
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

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 통화 포맷 함수
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