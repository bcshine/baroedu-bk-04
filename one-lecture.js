// 세부 강좌 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // FAQ 아코디언
    initFAQ();
    
    // 모바일 메뉴 토글
    initMobileMenu();
    
    // 수강신청 버튼
    initEnrollButtons();
    
    // 후기 더보기
    initReviewMore();
});

// FAQ 아코디언 기능
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // 모든 FAQ 닫기
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // 클릭한 항목이 비활성 상태였다면 열기
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// 모바일 메뉴 토글
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        
        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-wrapper')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
}

// 수강신청 버튼 기능
function initEnrollButtons() {
    const enrollButtons = document.querySelectorAll('.btn-purchase, .btn-enroll');
    
    enrollButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleEnrollment();
        });
    });
}

function handleEnrollment() {
    // 수강신청 처리
    const courseTitle = document.querySelector('.course-title').textContent;
    const coursePrice = document.querySelector('.current-price').textContent;
    
    // 알림 표시
    showNotification(`"${courseTitle}" 수강신청이 시작됩니다.\n가격: ${coursePrice}`, 'success');
    
    // 실제 구현 시에는 결제 페이지로 이동
    // window.location.href = '/checkout?course=ai-detailpage-optimization';
}

// 후기 더보기
function initReviewMore() {
    const moreBtn = document.querySelector('.btn-more');
    
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            showNotification('추가 후기를 불러오는 중입니다...', 'info');
            
            // 실제 구현 시에는 AJAX로 추가 후기 로드
            setTimeout(() => {
                showNotification('새로운 후기가 추가되었습니다!', 'success');
            }, 1000);
        });
    }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // 알림 스타일
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10001;
                min-width: 300px;
                animation: slideIn 0.3s ease;
            }
            .notification.success { border-left: 4px solid #4caf50; }
            .notification.error { border-left: 4px solid #f44336; }
            .notification.info { border-left: 4px solid #2196f3; }
            .notification-content {
                display: flex;
                align-items: center;
                padding: 1rem;
                gap: 0.5rem;
            }
            .notification-icon {
                font-size: 1.2rem;
            }
            .notification-message {
                flex: 1;
                white-space: pre-line;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            /* 모바일 메뉴 스타일 */
            @media (max-width: 768px) {
                .nav-menu {
                    position: fixed;
                    top: 80px;
                    right: -100%;
                    width: 250px;
                    height: calc(100vh - 80px);
                    background: white;
                    box-shadow: -2px 0 8px rgba(0,0,0,0.1);
                    transition: right 0.3s;
                    padding: 2rem 0;
                }
                
                .nav-menu.active {
                    right: 0;
                }
                
                .nav-menu li {
                    display: block;
                    margin: 0;
                    padding: 0;
                }
                
                .nav-menu a {
                    display: block;
                    padding: 1rem 2rem;
                    border-bottom: 1px solid #f0f0f0;
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
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 닫기 버튼
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
    }
}

// 스크롤 시 헤더 그림자
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 10) {
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
}); 