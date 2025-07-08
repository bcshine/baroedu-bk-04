// 마이페이지 JavaScript 기능

// Supabase 클라이언트 (auth.js에서 이미 초기화됨)
const SUPABASE_URL = 'https://bjsstktiiniigdnsdwsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3N0a3RpaW5paWdkbnNkd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI4MTEsImV4cCI6MjA2NzA3ODgxMX0.h3W1Q3L_yX8_HPOMmEluq2Qum_INJSCv9OKV4IZdYRs';

// 테스트 데이터 생성 함수 - 실제 Supabase 데이터베이스에 삽입
async function createTestData(userId) {
    try {
        console.log('📋 실제 Supabase 데이터 생성 시작 - 사용자 ID:', userId);
        
        const supabase = window.supabase || window.supabaseClient;
        if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않음');
            showAlert('데이터베이스 연결에 문제가 있습니다. 페이지를 새로고침 해주세요.', 'error');
            return;
        }

        // 1. 먼저 courses 테이블에 강좌 데이터 생성
        await createCoursesTable(supabase);
        
        // 2. enrollments 테이블에 수강신청 데이터 생성
        await createEnrollmentsTable(supabase, userId);
        
        console.log('✅ 실제 Supabase 데이터 생성 완료');
        showAlert('Supabase 데이터베이스 준비가 완료되었습니다! 🚀', 'success');
        
    } catch (error) {
        console.error('❌ Supabase 데이터 생성 중 오류:', error);
        
        // 에러 타입에 따른 사용자 친화적 메시지
        if (error.message.includes('테이블이 존재하지 않습니다')) {
            console.log('ℹ️ 테이블이 없어서 실제 데이터를 표시할 수 없습니다.');
            // 테이블이 없어도 사용자에게는 이미 warning 메시지가 표시되었으므로 
            // 여기서는 추가 에러 메시지를 표시하지 않음
        } else if (error.message.includes('connection') || error.message.includes('network')) {
            showAlert('인터넷 연결을 확인해주세요.', 'error');
        } else {
            showAlert('데이터 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
    }
}

// 강좌 테이블 데이터 생성
async function createCoursesTable(supabase) {
    try {
        console.log('📚 강좌 데이터 확인 및 생성...');
        
        // 기존 강좌 데이터 확인
        const { data: existingCourses, error: checkError } = await supabase
            .from('courses')
            .select('id')
            .limit(1);

        if (checkError) {
            console.log('⚠️ courses 테이블 접근 오류:', checkError);
            
            // 테이블이 존재하지 않는 경우
            if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
                throw new Error('courses 테이블이 존재하지 않습니다. Supabase 대시보드에서 테이블을 생성해주세요.');
            }
            throw checkError;
        }

        // 강좌 데이터가 없으면 생성
        if (!existingCourses || existingCourses.length === 0) {
            console.log('📝 강좌 데이터 없음 - 새로운 데이터 생성');
            
            const coursesData = [
                {
                    title: '웹 개발 입문 과정',
                    instructor_name: '김개발',
                    category_id: 'development',
                    price: 299000,
                    rating: 4.8,
                    total_students: 1250,
                    status: 'published',
                    thumbnail_url: 'images/pd1.jpg',
                    is_free: false,
                    video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                    created_at: new Date().toISOString()
                },
                {
                    title: '디지털 마케팅 마스터',
                    instructor_name: '박마케팅',
                    category_id: 'marketing',
                    price: 249000,
                    rating: 4.6,
                    total_students: 890,
                    status: 'published',
                    thumbnail_url: 'images/pd2.jpg',
                    is_free: false,
                    video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
                    created_at: new Date().toISOString()
                },
                {
                    title: '창업 실무 완전정복',
                    instructor_name: '최창업',
                    category_id: 'business',
                    price: 399000,
                    rating: 4.9,
                    total_students: 567,
                    status: 'published',
                    thumbnail_url: 'images/pd3.jpg',
                    is_free: false,
                    video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                    created_at: new Date().toISOString()
                },
                {
                    title: 'AI 비즈니스 활용법',
                    instructor_name: '이AI',
                    category_id: 'technology',
                    price: 349000,
                    rating: 4.7,
                    total_students: 723,
                    status: 'published',
                    thumbnail_url: 'images/pd4.jpg',
                    is_free: false,
                    video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
                    created_at: new Date().toISOString()
                },
                {
                    title: '브랜딩 전략 설계',
                    instructor_name: '정브랜드',
                    category_id: 'branding',
                    price: 199000,
                    rating: 4.5,
                    total_students: 456,
                    status: 'published',
                    thumbnail_url: 'images/pd11.jpg',
                    is_free: false,
                    video_url: null,
                    created_at: new Date().toISOString()
                }
            ];

            const { data: insertedCourses, error: insertError } = await supabase
                .from('courses')
                .insert(coursesData)
                .select();

            if (insertError) {
                console.error('❌ 강좌 데이터 삽입 실패:', insertError);
                throw insertError;
            }

            console.log('✅ 새로운 강좌 데이터 생성 완료:', insertedCourses?.length || 0, '개');
            showAlert('새로운 강좌 데이터가 Supabase에 성공적으로 생성되었습니다! 🎉', 'success');
        } else {
            console.log('✅ 기존 강좌 데이터 확인됨');
        }

    } catch (error) {
        console.error('❌ 강좌 데이터 처리 실패:', error);
        
        if (error.message.includes('테이블이 존재하지 않습니다')) {
            showAlert('데이터베이스 테이블이 없습니다. Supabase 대시보드에서 courses 테이블을 생성해주세요.', 'warning');
        }
        
        throw error;
    }
}

// 수강신청 테이블 데이터 생성
async function createEnrollmentsTable(supabase, userId) {
    try {
        console.log('📝 수강신청 데이터 확인 및 생성...');
        
        // 기존 수강신청 데이터 확인
        const { data: existingEnrollments, error: checkError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (checkError) {
            console.log('⚠️ enrollments 테이블 접근 오류:', checkError);
            
            // 테이블이 존재하지 않는 경우
            if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
                throw new Error('enrollments 테이블이 존재하지 않습니다. Supabase 대시보드에서 테이블을 생성해주세요.');
            }
            throw checkError;
        }

        // 수강신청 데이터가 없으면 생성
        if (!existingEnrollments || existingEnrollments.length === 0) {
            console.log('📝 수강신청 데이터 없음 - 새로운 데이터 생성');
            
            // 강좌 ID들을 가져와서 매핑
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id')
                .limit(5);

            if (coursesError || !courses || courses.length === 0) {
                console.error('❌ 강좌 데이터를 먼저 생성해야 합니다');
                throw new Error('강좌 데이터가 없습니다. 강좌를 먼저 생성해주세요.');
            }

            const now = new Date();
            const enrollmentsData = [
                {
                    user_id: userId,
                    course_id: courses[0].id,
                    status: 'progress',
                    progress: 75,
                    created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    course_id: courses[1].id,
                    status: 'completed',
                    progress: 100,
                    created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    completed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    course_id: courses[2].id,
                    status: 'progress',
                    progress: 30,
                    created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    course_id: courses[3].id,
                    status: 'progress',
                    progress: 50,
                    created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            const { data: insertedEnrollments, error: insertError } = await supabase
                .from('enrollments')
                .insert(enrollmentsData)
                .select();

            if (insertError) {
                console.error('❌ 수강신청 데이터 삽입 실패:', insertError);
                throw insertError;
            }

            console.log('✅ 새로운 수강신청 데이터 생성 완료:', insertedEnrollments?.length || 0, '개');
            showAlert('새로운 수강신청 데이터가 Supabase에 성공적으로 생성되었습니다! 🎉', 'success');
        } else {
            console.log('✅ 기존 수강신청 데이터 확인됨:', existingEnrollments.length, '개');
        }

    } catch (error) {
        console.error('❌ 수강신청 데이터 처리 실패:', error);
        
        if (error.message.includes('테이블이 존재하지 않습니다')) {
            showAlert('데이터베이스 테이블이 없습니다. Supabase 대시보드에서 enrollments 테이블을 생성해주세요.', 'warning');
        } else if (error.message.includes('강좌 데이터가 없습니다')) {
            showAlert('강좌 데이터가 없습니다. 강좌를 먼저 생성해주세요.', 'warning');
        }
        
        throw error;
    }
}

// 로그인 필요 알림 표시
function showLoginRequired() {
    console.log('🚪 로그인 필요 - 안내 메시지 표시');
    
    // 로딩 상태 제거
    const coursesGrid = document.querySelector('.courses-grid');
    if (coursesGrid) {
        coursesGrid.innerHTML = '';
    }
    
    // 친근한 로그인 안내 메시지
    showAlert('마이페이지를 이용하시려면 로그인이 필요합니다. 😊', 'info');
    
    // 헤더 UI를 비로그인 상태로 업데이트
    updateAuthUI(null);
    
    // 3초 후에 로그인 모달 표시 (사용자가 메시지를 읽을 시간 제공)
    setTimeout(() => {
        console.log('🔓 로그인 모달 표시');
        openLoginModal();
    }, 3000);
}

// 사용자 프로필 업데이트
async function updateUserProfile(userInfo) {
    console.log('🔄 프로필 업데이트 시작:', userInfo);
    
    const profileName = document.querySelector('.profile-details h1');
    if (profileName && userInfo.name) {
        profileName.textContent = `${userInfo.name}님, 반갑습니다! 👋`;
        console.log('✅ 프로필 이름 업데이트:', userInfo.name);
    } else if (profileName) {
        profileName.textContent = `${userInfo.email}님, 반갑습니다! 👋`;
        console.log('✅ 프로필 이메일 업데이트:', userInfo.email);
    }
    
    // 프로필 이미지 업데이트 (기본값)
    const profileImage = document.querySelector('.profile-image img');
    if (profileImage) {
        profileImage.src = userInfo.avatar_url || 'images/man2.jpg';
        profileImage.alt = `${userInfo.name || userInfo.email}의 프로필`;
    }
}

// 사용자 수강 정보 불러오기 - 실제 Supabase 데이터만 사용
async function loadUserCourses(userId) {
    try {
        console.log('📚 실제 Supabase 수강 정보 로드 시작 - 사용자 ID:', userId);
        showLoadingState();
        
        const supabase = window.supabase || window.supabaseClient;
        if (!supabase) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
        }

        console.log('✅ Supabase 클라이언트 확인됨');

        // 수강신청 정보 가져오기 (실제 데이터베이스 구조에 맞춤)
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select(`
                *,
                courses(
                    id,
                    title,
                    instructor_name,
                    price,
                    thumbnail_url,
                    category_id,
                    rating,
                    total_students,
                    status,
                    video_url,
                    is_free,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ 수강 정보 쿼리 오류:', error);
            console.error('📝 에러 세부정보:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw new Error(`수강 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }

        console.log('✅ 실제 Supabase 수강 정보 로드 완료:', enrollments?.length || 0, '개');

        // 수강 정보 렌더링
        await renderUserCourses(enrollments || []);
        
        // 통계 업데이트
        updateProfileStats(enrollments || []);
        
        // 성공 메시지 표시
        if (enrollments && enrollments.length > 0) {
            showAlert(`실제 Supabase 데이터 ${enrollments.length}개 강좌를 불러왔습니다! 🎉`, 'success');
        } else {
            showAlert('Supabase 연결 성공! 아직 등록된 강좌가 없습니다.', 'info');
        }
        
    } catch (error) {
        console.error('❌ 수강 정보 로드 에러:', error);
        
        // 사용자 친화적인 오류 메시지 표시
        let errorMessage = '수강 정보를 불러오는 중 오류가 발생했습니다.';
        
        if (error.message.includes('does not exist')) {
            errorMessage = '데이터베이스 테이블이 준비되지 않았습니다. 관리자에게 문의해주세요.';
        } else if (error.message.includes('connection')) {
            errorMessage = '인터넷 연결을 확인해주세요.';
        }
        
        showAlert(errorMessage, 'error');
        renderEmptyState();
    }
}

// 수강 정보 렌더링
async function renderUserCourses(enrollments) {
    const coursesGrid = document.querySelector('.courses-grid');
    
    if (enrollments.length === 0) {
        renderEmptyState();
        return;
    }

    coursesGrid.innerHTML = '';
    
    enrollments.forEach(enrollment => {
        const course = enrollment.courses;
        if (!course) {
            console.warn('⚠️ 강좌 정보가 없는 수강신청 발견:', enrollment);
            return;
        }
        
        try {
            const courseCard = createCourseCard(course, enrollment);
            coursesGrid.appendChild(courseCard);
        } catch (cardError) {
            console.error('❌ 강좌 카드 생성 실패:', cardError, { course, enrollment });
        }
    });
    
    // 필터 이벤트 재등록
    setupFilterEvents();
    // 강의실 입장 이벤트 재등록
    setupEnterClassroomEvents();
}

// 강좌 카드 생성
function createCourseCard(course, enrollment) {
    const div = document.createElement('div');
    div.className = 'course-card';
    div.setAttribute('data-status', enrollment.status || 'progress');
    
    const progress = enrollment.progress || 0;
    const isCompleted = enrollment.status === 'completed';
    const statusBadge = isCompleted ? '수료' : '진행 중';
    const statusClass = isCompleted ? 'completed' : 'progress';
    
    // 남은 기간 계산 (기본 90일 수강 기간)
    const enrollDate = new Date(enrollment.created_at);
    const now = new Date();
    const courseDuration = 90; // 기본 90일 수강 기간
    const endDate = new Date(enrollDate.getTime() + courseDuration * 24 * 60 * 60 * 1000);
    const remainingDays = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
    
    div.innerHTML = `
        <div class="course-thumbnail">
            <img src="${course.thumbnail_url || 'images/pd1.jpg'}" alt="${course.title}">
            <span class="status-badge ${statusClass}">${statusBadge}</span>
        </div>
        <div class="course-info">
            <h3>${course.title}</h3>
            <p class="instructor">${course.instructor_name || '바로교육 강사'}</p>
            <div class="progress-info">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${isCompleted ? '수료 완료' : `${progress}% 완료`}</span>
            </div>
            <div class="course-meta">
                ${isCompleted ? 
                    `<span class="completion-date">${formatDate(enrollment.completed_at || enrollment.created_at)} 수료</span>` :
                    `<span class="remaining-days">D-${remainingDays > 0 ? remainingDays : 0}</span>
                     <span class="course-price">${course.is_free ? '무료 강좌' : Number(course.price || 0).toLocaleString() + '원'}</span>`
                }
            </div>
            <button class="enter-classroom-btn" data-course-id="${course.id}">
                ${isCompleted ? '복습하기' : '강의실 입장'}
            </button>
        </div>
    `;
    
    return div;
}

// 빈 상태 렌더링
function renderEmptyState() {
    const coursesGrid = document.querySelector('.courses-grid');
    coursesGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>수강 중인 강좌가 없습니다</h3>
            <p>새로운 강좌를 신청해보세요!</p>
            <a href="2_total_lecture.html" class="cta-button">강좌 둘러보기</a>
        </div>
    `;
}

// 프로필 통계 업데이트
function updateProfileStats(enrollments) {
    const progressCount = enrollments.filter(e => e.status !== 'completed').length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;
    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 2) {
        statNumbers[0].textContent = progressCount;
        statNumbers[1].textContent = completedCount;
    }
}

// 로딩 상태 표시
function showLoadingState() {
    const coursesGrid = document.querySelector('.courses-grid');
    coursesGrid.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>수강 정보를 불러오는 중...</p>
        </div>
    `;
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
}

// 인증 UI 업데이트 함수
function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!authButtons) {
        console.error('auth-buttons 요소를 찾을 수 없습니다');
        return;
    }
    
    if (user) {
        // 로그인 상태 UI
        console.log('🔄 로그인 상태 UI로 변경:', user.email);
        authButtons.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${user.user_metadata?.name || user.email}</span>
                <button class="logout-btn" onclick="authManager.handleLogout()">로그아웃</button>
            </div>
        `;
    } else {
        // 비로그인 상태 UI
        console.log('🔄 비로그인 상태 UI로 변경');
        authButtons.innerHTML = `
            <a href="#" class="login-btn" onclick="openLoginModal()">로그인</a>
            <a href="#" class="signup-btn" onclick="openSignupModal()">회원가입</a>
        `;
    }
}

// 토스트 메시지 표시 (authManager와 동일한 기능)
function showToast(message, type = 'info') {
    // authManager의 showToast 사용
    if (authManager) {
        authManager.showToast(message, type);
    } else {
        // fallback 토스트
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
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

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 필터 이벤트 설정
function setupFilterEvents() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // 활성 버튼 변경
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 카드 필터링
            courseCards.forEach(card => {
                const status = card.dataset.status;
                
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (filter === 'progress' && status === 'progress') {
                    card.style.display = 'block';
                } else if (filter === 'completed' && status === 'completed') {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // 카드 애니메이션
            setTimeout(() => {
                courseCards.forEach(card => {
                    if (card.style.display !== 'none') {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 100);
                    }
                });
            }, 50);
        });
    });
}

// 강의실 입장 이벤트 설정
function setupEnterClassroomEvents() {
    const enterClassroomButtons = document.querySelectorAll('.enter-classroom-btn');
    
    enterClassroomButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const courseTitle = card.querySelector('h3').textContent;
            const status = card.dataset.status;
            const courseId = this.dataset.courseId;
            
            // 로딩 상태 표시
            const originalText = this.textContent;
            this.textContent = '입장 중...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                
                if (status === 'completed') {
                    showAlert('복습 모드로 강의실에 입장합니다.', 'success');
                } else {
                    showAlert(`${courseTitle} 강의실에 입장합니다.`, 'success');
                }
                
                // 강좌 ID와 함께 세부강좌 페이지로 이동
                setTimeout(() => {
                    location.href = `3_one_lecture.html?courseId=${courseId}`;
                }, 2000);
            }, 1500);
        });
    });
}

// 알림 메시지 함수
function showAlert(message, type = 'info') {
    // 기존 알림 제거
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // 새 알림 생성
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // 스타일 적용
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
    
    // 타입별 색상 설정
    switch (type) {
        case 'success':
            alertDiv.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            break;
        case 'info':
            alertDiv.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            break;
        case 'warning':
            alertDiv.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            break;
        case 'error':
            alertDiv.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            break;
    }
    
    document.body.appendChild(alertDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 300);
    }, 3000);
}

// 애니메이션 키프레임 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    .nav-menu.active {
        display: block;
    }
    
    .header {
        transition: transform 0.3s ease;
    }
`;

document.head.appendChild(style);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 마이페이지 로드됨');
    
    // authManager와 supabase 클라이언트가 로드될 때까지 대기
    const waitForDependencies = setInterval(async () => {
        if (typeof authManager !== 'undefined' && window.supabaseClient) {
            console.log('✅ 필요한 의존성 로드됨 - 초기화 대기 중...');
            clearInterval(waitForDependencies);
            
            // 전역 supabase 클라이언트 설정
            window.supabase = window.supabaseClient;
            
            // authManager 초기화 완료를 기다림 (자동로그인 포함)
            await new Promise(resolve => {
                const checkInit = setInterval(() => {
                    // authManager가 초기화 완료된 것을 확인
                    if (authManager.isInitialized) {
                        console.log('✅ authManager 초기화 완료');
                        clearInterval(checkInit);
                        resolve();
                    }
                }, 50);
                
                // 5초 후 타임아웃
                setTimeout(() => {
                    clearInterval(checkInit);
                    console.log('⏰ authManager 초기화 타임아웃');
                    resolve();
                }, 5000);
            });
            
            // authManager의 인증 상태 변경 콜백 등록
            authManager.onAuthStateChanged(async (event, user) => {
                console.log('🔄 마이페이지 - 인증 상태 변경:', event, user);
                
                if (event === 'login' && user) {
                    console.log('✅ 로그인 감지됨 - 데이터 새로고침');
                    
                    // 헤더 UI 업데이트
                    updateAuthUI(user);
                    
                    // 사용자 정보 업데이트
                    const userInfo = await authManager.getUserInfo();
                    
                    if (userInfo) {
                        await updateUserProfile(userInfo);
                        await createTestData(userInfo.id);
                        await loadUserCourses(userInfo.id);
                    } else {
                        const basicUserInfo = {
                            id: user.id,
                            name: user.user_metadata?.name || user.email,
                            email: user.email
                        };
                        await updateUserProfile(basicUserInfo);
                        await createTestData(user.id);
                        await loadUserCourses(user.id);
                    }
                } else if (event === 'logout') {
                    console.log('❌ 로그아웃 감지됨 - 메인 페이지로 이동');
                    updateAuthUI(null);
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
            
            // 현재 로그인 상태 확인
            console.log('🔍 현재 인증 상태 확인:', {
                isLoggedIn: authManager.isLoggedIn,
                currentUser: authManager.currentUser?.email || 'none',
                supabaseClient: !!window.supabaseClient
            });
            
            if (authManager.isLoggedIn && authManager.currentUser) {
                console.log('✅ 이미 로그인 상태 - 데이터 로드 시작');
                
                // 헤더 UI 업데이트
                updateAuthUI(authManager.currentUser);
                
                // 사용자 정보 및 강좌 데이터 로드
                try {
                    const userInfo = await authManager.getUserInfo();
                    
                    if (userInfo) {
                        await updateUserProfile(userInfo);
                        await createTestData(userInfo.id);
                        await loadUserCourses(userInfo.id);
                    } else {
                        const basicUserInfo = {
                            id: authManager.currentUser.id,
                            name: authManager.currentUser.user_metadata?.name || authManager.currentUser.email,
                            email: authManager.currentUser.email
                        };
                        await updateUserProfile(basicUserInfo);
                        await createTestData(authManager.currentUser.id);
                        await loadUserCourses(authManager.currentUser.id);
                    }
                    
                    console.log('✅ 마이페이지 초기화 완료');
                } catch (error) {
                    console.error('❌ 사용자 데이터 로드 중 오류:', error);
                    showAlert('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
                }
            } else {
                console.log('❌ 비로그인 상태 - 로그인 필요');
                showLoginRequired();
            }
            
            // 이벤트 리스너 설정
            setupEventListeners();
        }
    }, 100);
});

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 필터 버튼 기능
    const filterButtons = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // 활성 버튼 변경
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 카드 필터링
            courseCards.forEach(card => {
                const status = card.dataset.status;
                
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (filter === 'progress' && status === 'progress') {
                    card.style.display = 'block';
                } else if (filter === 'completed' && status === 'completed') {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // 카드 애니메이션
            setTimeout(() => {
                courseCards.forEach(card => {
                    if (card.style.display !== 'none') {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 100);
                    }
                });
            }, 50);
        });
    });
    
    // 수료증 다운로드 버튼
    const downloadButtons = document.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const certificateItem = this.closest('.certificate-item');
            const courseTitle = certificateItem.querySelector('h3').textContent;
            
            const originalText = this.textContent;
            this.textContent = '다운로드 중...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                showAlert(`${courseTitle} 수료증이 다운로드되었습니다.`, 'success');
            }, 2000);
        });
    });
    
    // 영수증 다운로드 버튼
    const receiptButtons = document.querySelectorAll('.receipt-btn');
    
    receiptButtons.forEach(button => {
        button.addEventListener('click', function() {
            const paymentItem = this.closest('.payment-item');
            const courseTitle = paymentItem.querySelector('h3').textContent;
            
            const originalText = this.textContent;
            this.textContent = '다운로드 중...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                showAlert(`${courseTitle} 영수증이 다운로드되었습니다.`, 'success');
            }, 1500);
        });
    });
    
    // 프로필 수정 버튼
    const editProfileButton = document.querySelector('.edit-profile-btn');
    
    editProfileButton.addEventListener('click', function() {
        showAlert('프로필 수정 페이지로 이동합니다.', 'info');
    });
    
    // 문의하기 버튼
    const contactButton = document.querySelector('.contact-btn');
    
    contactButton.addEventListener('click', function() {
        showAlert('고객센터로 연결됩니다.', 'info');
    });
    
    // FAQ 버튼
    const faqButton = document.querySelector('.faq-btn');
    
    faqButton.addEventListener('click', function() {
        showAlert('자주 묻는 질문 페이지로 이동합니다.', 'info');
    });
    
    // 진도율 애니메이션
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const animateProgressBars = () => {
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s ease-in-out';
                bar.style.width = width;
            }, 500);
        });
    };
    
    // 페이지 로드 시 진도율 애니메이션 실행
    setTimeout(animateProgressBars, 1000);
    
    // 카드 호버 효과 개선
    const cards = document.querySelectorAll('.course-card, .certificate-item, .payment-item, .support-item');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // 통계 카운터 애니메이션
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const animateCounters = () => {
        statNumbers.forEach(counter => {
            const target = parseInt(counter.textContent);
            let current = 0;
            const increment = target / 30;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.floor(current);
                    setTimeout(updateCounter, 50);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    };
    
    // 페이지 로드 시 카운터 애니메이션 실행
    setTimeout(animateCounters, 1500);
    
    // 모바일 메뉴 토글 기능
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // 스크롤 이벤트 - 헤더 고정
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 스크롤 다운
            header.style.transform = 'translateY(-100%)';
        } else {
            // 스크롤 업
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // 페이지 로드 애니메이션
    const sections = document.querySelectorAll('section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
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