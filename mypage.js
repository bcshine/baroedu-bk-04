// 마이페이지 JavaScript 기능

// 로그인 확인 함수
async function checkLoginStatus() {
    if (!authManager || !authManager.isLoggedIn) {
        showAlert('로그인이 필요한 페이지입니다. 로그인 후 이용해주세요.', 'error');
        setTimeout(() => {
            openLoginModal();
        }, 1000);
        return false;
    }
    
    // 로그인된 사용자 정보로 UI 업데이트
    const userInfo = await authManager.getUserInfo();
    if (userInfo) {
        updateUserProfile(userInfo);
    }
    
    return true;
}

// 사용자 프로필 업데이트
function updateUserProfile(userInfo) {
    const profileName = document.querySelector('.profile-details h1');
    if (profileName && userInfo.name) {
        profileName.textContent = `${userInfo.name}님, 반갑습니다! 👋`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드 시 로그인 상태 확인
    setTimeout(async () => {
        const isLoggedIn = await checkLoginStatus();
        if (!isLoggedIn) {
            return; // 로그인되지 않은 경우 나머지 기능을 실행하지 않음
        }
    }, 500);
    
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
    
    // 강의실 입장 버튼 클릭 이벤트
    const enterClassroomButtons = document.querySelectorAll('.enter-classroom-btn');
    
    enterClassroomButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const courseTitle = card.querySelector('h3').textContent;
            const status = card.dataset.status;
            
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
                // 2초 후 세부강좌 페이지로 이동
                setTimeout(() => {
                    location.href = '3_one_lecture.html';
                }, 2000);
            }, 1500);
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
});

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