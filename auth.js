// 바로교육 - 공통 인증 시스템 (auth.js)
// Supabase 설정
const supabaseUrl = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 전역적으로 사용할 수 있도록 window 객체에 추가
window.supabaseClient = supabase;

console.log('✅ Supabase 클라이언트 초기화 완료:', supabaseUrl);

// 연결 상태 확인
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('❌ Supabase 연결 확인 중 오류:', error);
    } else {
        console.log('✅ Supabase 연결 상태 확인 완료');
    }
});

// 인증 상태 관리
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.authStateCallbacks = [];
        this.autoLoginKey = 'baroedu_auto_login';
        this.isInitialized = false;
        this.init();
    }

    // 초기화
    async init() {
        try {
            console.log('🔧 AuthManager 초기화 시작');
            
            // 자동로그인 확인 (세션 확인보다 먼저)
            await this.checkAutoLogin();
            
            // 현재 세션 확인
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.isLoggedIn = true;
                console.log('✅ 기존 세션 발견:', this.currentUser.email);
            } else {
                console.log('❌ 기존 세션 없음');
            }

            // 인증 상태 변경 감지 (백그라운드에서만 처리)
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Supabase Auth state changed:', event, session);
                
                // 수동으로 이미 처리된 경우는 건너뛰기
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session && session.user) {
                        // 이미 같은 사용자로 설정되어 있다면 건너뛰기
                        if (this.currentUser && this.currentUser.id === session.user.id && this.isLoggedIn) {
                            console.log('⏭️ 이미 같은 사용자로 로그인됨 - 중복 처리 건너뛰기');
                            return;
                        }
                        
                        this.currentUser = session.user;
                        this.isLoggedIn = true;
                        console.log('✅ Supabase 이벤트로 로그인 상태 업데이트:', this.currentUser.email);
                        this.updateUI();
                        this.triggerAuthStateCallbacks('login', this.currentUser);
                    }
                } else if (event === 'SIGNED_OUT') {
                    // 이미 로그아웃 상태라면 건너뛰기
                    if (!this.isLoggedIn) {
                        console.log('⏭️ 이미 로그아웃 상태 - 중복 처리 건너뛰기');
                        return;
                    }
                    
                    this.currentUser = null;
                    this.isLoggedIn = false;
                    console.log('❌ Supabase 이벤트로 로그아웃 상태 업데이트');
                    this.updateUI();
                    this.triggerAuthStateCallbacks('logout', null);
                }
            });

            // 초기 UI 업데이트
            this.updateUI();
            
            // 초기화 완료 플래그 설정
            this.isInitialized = true;
            console.log('✅ AuthManager 초기화 완료');
        } catch (error) {
            console.error('❌ Auth initialization error:', error);
            this.isInitialized = true; // 에러가 있어도 초기화 완료로 표시
        }
    }

    // 자동로그인 확인
    async checkAutoLogin() {
        try {
            const autoLoginData = localStorage.getItem(this.autoLoginKey);
            if (!autoLoginData) {
                console.log('❌ 자동로그인 정보 없음');
                return false;
            }

            const { email, password, timestamp } = JSON.parse(autoLoginData);
            
            // 자동로그인 유효기간 확인 (30일)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (timestamp < thirtyDaysAgo) {
                console.log('❌ 자동로그인 정보 만료됨');
                this.removeAutoLoginData();
                return false;
            }

            console.log('🔄 자동로그인 시도:', email);
            this.showAutoLoginStatus('자동로그인 중...');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ 자동로그인 실패:', error);
                this.removeAutoLoginData();
                this.showToast('자동로그인에 실패했습니다. 다시 로그인해주세요.', 'error');
                return false;
            }

            console.log('✅ 자동로그인 성공:', data.user?.email);
            this.currentUser = data.user;
            this.isLoggedIn = true;
            this.updateUI();
            this.triggerAuthStateCallbacks('login', this.currentUser);
            this.showAutoLoginStatus('자동로그인 완료!');
            
            // 자동로그인 성공 시 새로운 타임스탬프로 업데이트
            this.saveAutoLoginData(email, password);
            
            return true;
        } catch (error) {
            console.error('❌ 자동로그인 중 오류:', error);
            this.removeAutoLoginData();
            return false;
        }
    }

    // 자동로그인 데이터 저장
    saveAutoLoginData(email, password) {
        try {
            const autoLoginData = {
                email: email,
                password: password,
                timestamp: Date.now()
            };
            localStorage.setItem(this.autoLoginKey, JSON.stringify(autoLoginData));
            console.log('✅ 자동로그인 정보 저장 완료');
        } catch (error) {
            console.error('❌ 자동로그인 정보 저장 실패:', error);
        }
    }

    // 자동로그인 데이터 삭제
    removeAutoLoginData() {
        try {
            localStorage.removeItem(this.autoLoginKey);
            console.log('✅ 자동로그인 정보 삭제 완료');
        } catch (error) {
            console.error('❌ 자동로그인 정보 삭제 실패:', error);
        }
    }

    // 자동로그인 상태 표시
    showAutoLoginStatus(message) {
        // 기존 상태 표시 제거
        const existingStatus = document.querySelector('.auto-login-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusDiv = document.createElement('div');
        statusDiv.className = 'auto-login-status';
        statusDiv.innerHTML = `⚡ ${message}`;
        document.body.appendChild(statusDiv);

        // 3초 후 제거
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }

    // 자동로그인 여부 확인
    hasAutoLogin() {
        return localStorage.getItem(this.autoLoginKey) !== null;
    }

    // 인증 상태 변경 콜백 추가
    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
    }

    // 인증 상태 변경 콜백 실행
    triggerAuthStateCallbacks(event, user) {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(event, user);
            } catch (error) {
                console.error('인증 상태 콜백 실행 에러:', error);
            }
        });
    }

    // 회원가입
    async signUp(email, password, name) {
        try {
            console.log('📝 회원가입 시도:', email);
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (error) throw error;

            // 회원가입 성공 시 users 테이블에 추가 정보 저장
            if (data.user) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            name: name,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (insertError) {
                    console.error('User data insert error:', insertError);
                }
            }

            console.log('✅ 회원가입 성공:', data.user?.email);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // 로그인
    async signIn(email, password, rememberMe = false) {
        try {
            console.log('🔐 로그인 시도:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ 로그인 에러:', error);
                throw error;
            }

            console.log('✅ 로그인 성공:', data.user?.email);
            
            // 즉시 인증 상태 업데이트
            this.currentUser = data.user;
            this.isLoggedIn = true;
            
            // 자동로그인 설정 확인 및 저장
            if (rememberMe) {
                console.log('✅ 자동로그인 설정 저장');
                this.saveAutoLoginData(email, password);
                this.showToast('자동로그인이 설정되었습니다.', 'success');
            } else {
                // 자동로그인 체크 해제 시 기존 정보 삭제
                this.removeAutoLoginData();
            }
            
            // UI 업데이트
            this.updateUI();
            
            // 콜백 즉시 호출 (Supabase 이벤트 대기하지 않음)
            this.triggerAuthStateCallbacks('login', data.user);
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            
            // 에러 메시지를 더 친근하게 변경
            let friendlyMessage = error.message;
            if (error.message.includes('Invalid login credentials')) {
                friendlyMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (error.message.includes('Email not confirmed')) {
                friendlyMessage = '이메일 인증을 완료해주세요.';
            } else if (error.message.includes('Too many requests')) {
                friendlyMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            }
            
            return { success: false, error: friendlyMessage };
        }
    }

    // 로그아웃
    async signOut() {
        try {
            console.log('🚪 로그아웃 시도');
            
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // 즉시 인증 상태 업데이트
            this.currentUser = null;
            this.isLoggedIn = false;
            
            // 자동로그인 정보 삭제
            this.removeAutoLoginData();
            
            // UI 업데이트
            this.updateUI();
            
            // 콜백 즉시 호출
            this.triggerAuthStateCallbacks('logout', null);
            
            console.log('✅ 로그아웃 성공');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 정보 조회
    async getUserInfo() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get user info error:', error);
            return null;
        }
    }

    // UI 업데이트
    updateUI() {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) {
            console.warn('⚠️ auth-buttons 요소를 찾을 수 없음');
            return;
        }

        if (this.isLoggedIn && this.currentUser) {
            // 로그인 상태 UI
            console.log('🔄 로그인 상태 UI 업데이트');
            authButtons.innerHTML = `
                <div class="user-menu">
                    <span class="user-name">${this.currentUser.user_metadata?.name || this.currentUser.email}</span>
                    <button class="logout-btn" onclick="authManager.handleLogout()">로그아웃</button>
                </div>
            `;
        } else {
            // 비로그인 상태 UI
            console.log('🔄 비로그인 상태 UI 업데이트');
            authButtons.innerHTML = `
                <a href="#" class="login-btn" onclick="openLoginModal()">로그인</a>
                <a href="#" class="signup-btn" onclick="openSignupModal()">회원가입</a>
            `;
        }
    }

    // 로그아웃 처리 (UI 업데이트 포함)
    async handleLogout() {
        console.log('🚪 로그아웃 처리 시작');
        
        try {
            const result = await this.signOut();
            
            if (result.success) {
                console.log('✅ 로그아웃 성공');
                this.showToast('로그아웃되었습니다.', 'success');
            } else {
                console.error('❌ 로그아웃 실패:', result.error);
                this.showToast('로그아웃 중 오류가 발생했습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 로그아웃 중 예외:', error);
            this.showToast('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }

    // 토스트 메시지 표시
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 토스트 스타일
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 16px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(toast);

        // 3초 후 자동 제거
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 비밀번호 재설정
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }
}

// 전역 인증 관리자 인스턴스
const authManager = new AuthManager();

// 모달 관리
function openLoginModal() {
    console.log('🔓 로그인 모달 열기');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 자동로그인 버튼 상태 업데이트
        updateAutoLoginButton();
    }
}

// 자동로그인 버튼 상태 업데이트
function updateAutoLoginButton() {
    const autoLoginBtn = document.querySelector('.auto-login-btn');
    if (!autoLoginBtn) return;
    
    if (authManager.hasAutoLogin()) {
        autoLoginBtn.style.display = 'block';
        autoLoginBtn.textContent = '⚡ 저장된 계정으로 자동로그인';
        autoLoginBtn.disabled = false;
        console.log('✅ 자동로그인 정보 있음 - 버튼 활성화');
    } else {
        autoLoginBtn.style.display = 'none';
        console.log('❌ 자동로그인 정보 없음 - 버튼 숨김');
    }
}

function openSignupModal() {
    console.log('📝 회원가입 모달 열기');
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    console.log('❌ 모달 닫기:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 전역 토스트 함수 (authManager의 showToast 사용)
function showToast(message, type = 'info') {
    if (authManager) {
        authManager.showToast(message, type);
    }
}

// 로그인 폼 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    console.log('🔐 로그인 폼 처리 시작:', email, '자동로그인:', rememberMe);

    if (!email || !password) {
        showToast('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
    }

    // 로딩 표시
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;

    try {
        console.log('🔄 AuthManager로 로그인 시도...');
        const result = await authManager.signIn(email, password, rememberMe);
        console.log('📊 로그인 결과:', result);
        
        if (result.success) {
            console.log('✅ 로그인 성공!');
            showToast('로그인에 성공했습니다!', 'success');
            closeModal('loginModal');
            
            // 폼 리셋
            event.target.reset();
            
            // 마이페이지에 있다면 강제로 새로고침
            if (window.location.pathname.includes('mypage.html')) {
                console.log('📄 마이페이지에서 로그인 - 페이지 새로고침');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } else {
            console.error('❌ 로그인 실패:', result.error);
            showToast(result.error || '로그인에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('❌ 로그인 중 예외 발생:', error);
        showToast('로그인 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 자동로그인 버튼 처리
async function handleAutoLogin() {
    console.log('⚡ 자동로그인 버튼 클릭');
    
    if (!authManager.hasAutoLogin()) {
        showToast('저장된 자동로그인 정보가 없습니다.', 'info');
        return;
    }
    
    const autoLoginBtn = document.querySelector('.auto-login-btn');
    if (autoLoginBtn) {
        autoLoginBtn.textContent = '자동로그인 중...';
        autoLoginBtn.disabled = true;
    }
    
    try {
        const success = await authManager.checkAutoLogin();
        
        if (success) {
            console.log('✅ 자동로그인 성공');
            showToast('자동로그인에 성공했습니다!', 'success');
            closeModal('loginModal');
            
            // 마이페이지에 있다면 강제로 새로고침
            if (window.location.pathname.includes('mypage.html')) {
                console.log('📄 마이페이지에서 자동로그인 - 페이지 새로고침');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } else {
            console.error('❌ 자동로그인 실패');
            showToast('자동로그인에 실패했습니다. 수동으로 로그인해주세요.', 'error');
        }
    } catch (error) {
        console.error('❌ 자동로그인 중 예외 발생:', error);
        showToast('자동로그인 중 오류가 발생했습니다.', 'error');
    } finally {
        if (autoLoginBtn) {
            autoLoginBtn.textContent = '저장된 계정으로 자동로그인';
            autoLoginBtn.disabled = false;
        }
    }
}

// 회원가입 폼 처리
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    console.log('📝 회원가입 폼 처리 시작:', email);

    if (!name || !email || !password || !confirmPassword) {
        showToast('모든 필드를 입력해주세요.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('비밀번호는 6자 이상이어야 합니다.', 'error');
        return;
    }

    // 로딩 표시
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '회원가입 중...';
    submitBtn.disabled = true;

    try {
        const result = await authManager.signUp(email, password, name);
        
        if (result.success) {
            showToast('회원가입에 성공했습니다! 이메일을 확인해주세요.', 'success');
            closeModal('signupModal');
            
            // 폼 리셋
            event.target.reset();
        } else {
            showToast(result.error || '회원가입에 실패했습니다.', 'error');
        }
    } catch (error) {
        showToast('회원가입 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === signupModal) {
        closeModal('signupModal');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Auth system initialized');
});

