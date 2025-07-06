document.addEventListener('DOMContentLoaded', function() {
    // 히어로 슬라이더 기능
    const heroSlider = {
        currentSlide: 0,
        slides: document.querySelectorAll('.hero-slide'),
        prevBtn: document.querySelector('.prev-btn'),
        nextBtn: document.querySelector('.next-btn'),
        autoPlayInterval: null,
        
        init() {
            if (this.slides.length === 0) return;
            
            this.prevBtn.addEventListener('click', () => this.prevSlide());
            this.nextBtn.addEventListener('click', () => this.nextSlide());
            
            this.startAutoPlay();
            this.pauseOnHover();
        },
        
        showSlide(index) {
            this.slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        },
        
        nextSlide() {
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
            this.showSlide(this.currentSlide);
        },
        
        prevSlide() {
            this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.showSlide(this.currentSlide);
        },
        
        startAutoPlay() {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, 5000); // 5초마다 자동 전환
        },
        
        stopAutoPlay() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        },
        
        pauseOnHover() {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.addEventListener('mouseenter', () => this.stopAutoPlay());
                heroSection.addEventListener('mouseleave', () => this.startAutoPlay());
            }
        }
    };
    
    // 카테고리 탭 기능
    const categoryTabs = {
        init() {
            const tabs = document.querySelectorAll('.category-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    // 모든 탭에서 active 클래스 제거
                    tabs.forEach(t => t.classList.remove('active'));
                    // 클릭된 탭에 active 클래스 추가
                    e.target.classList.add('active');
                    
                    // 카테고리별 컨텐츠 변경 로직 (추후 구현)
                    const category = e.target.dataset.category;
                    console.log('Selected category:', category);
                });
            });
        }
    };
    
    // 강좌 탭 기능
    const courseTabs = {
        init() {
            const tabs = document.querySelectorAll('.course-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    // 모든 탭에서 active 클래스 제거
                    tabs.forEach(t => t.classList.remove('active'));
                    // 클릭된 탭에 active 클래스 추가
                    e.target.classList.add('active');
                    
                    // 강좌별 컨텐츠 변경 로직 (추후 구현)
                    const courseType = e.target.dataset.tab;
                    console.log('Selected course type:', courseType);
                });
            });
        }
    };
    
    // 모바일 메뉴 토글
    const mobileMenu = {
        init() {
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            const navMenu = document.querySelector('.nav-menu');
            const authButtons = document.querySelector('.auth-buttons');
            
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    navMenu.classList.toggle('active');
                    authButtons.classList.toggle('active');
                    menuToggle.classList.toggle('active');
                });
            }
        }
    };
    
    // 스크롤 시 헤더 스타일 변경
    const headerScroll = {
        init() {
            const header = document.querySelector('.header');
            if (header) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                });
            }
        }
    };
    
    // 스무스 스크롤
    const smoothScroll = {
        init() {
            const links = document.querySelectorAll('a[href^="#"]');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href === '#') return;
                    
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    };
    
    // 카드 애니메이션 (스크롤 시 등장)
    const cardAnimation = {
        init() {
            const cards = document.querySelectorAll('.course-card, .feature-card, .review-card');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
            
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(card);
            });
        }
    };
    
    // 페이지 로드 시 모든 기능 초기화
    heroSlider.init();
    categoryTabs.init();
    courseTabs.init();
    mobileMenu.init();
    headerScroll.init();
    smoothScroll.init();
    cardAnimation.init();
});

// 추가 CSS 스타일 (모바일 메뉴용)
const additionalStyles = `
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
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 1rem;
        gap: 1rem;
    }
    
    .auth-buttons.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 1rem;
        gap: 1rem;
        margin-top: 200px;
    }
    
    .header.scrolled {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            display: none;
        }
        
        .auth-buttons {
            display: none;
        }
    }
`;

// 동적으로 스타일 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 