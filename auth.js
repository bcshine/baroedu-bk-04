// 바로교육 - 공통 인증 시스템 (auth.js)
// Supabase 설정
const supabaseUrl = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 인증 상태 관리
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    // 초기화
    async init() {
        try {
            // 현재 세션 확인
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.isLoggedIn = true;
                this.updateUI();
            }

            // 인증 상태 변경 감지
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    this.currentUser = session.user;
                    this.isLoggedIn = true;
                    this.updateUI();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.isLoggedIn = false;
                    this.updateUI();
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    // 회원가입
    async signUp(email, password, name) {
        try {
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

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // 로그인
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // 로그아웃
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
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
        if (!authButtons) return;

        if (this.isLoggedIn && this.currentUser) {
            // 로그인 상태 UI
            authButtons.innerHTML = `
                <div class="user-menu">
                    <span class="user-name">${this.currentUser.user_metadata?.name || this.currentUser.email}</span>
                    <button class="logout-btn" onclick="authManager.signOut()">로그아웃</button>
                </div>
            `;
        } else {
            // 비로그인 상태 UI
            authButtons.innerHTML = `
                <a href="#" class="login-btn" onclick="openLoginModal()">로그인</a>
                <a href="#" class="signup-btn" onclick="openSignupModal()">회원가입</a>
            `;
        }
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
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function openSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 로그인 폼 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

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
        const result = await authManager.signIn(email, password);
        
        if (result.success) {
            showToast('로그인에 성공했습니다!', 'success');
            closeModal('loginModal');
            
            // 폼 리셋
            event.target.reset();
        } else {
            showToast(result.error || '로그인에 실패했습니다.', 'error');
        }
    } catch (error) {
        showToast('로그인 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 회원가입 폼 처리
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

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

// 토스트 메시지 표시
function showToast(message, type = 'info') {
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
    console.log('Auth system initialized');
}); 