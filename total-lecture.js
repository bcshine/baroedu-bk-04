document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const sortSelect = document.querySelector('.sort-select');
    const filterSelects = document.querySelectorAll('.filter-select');
    const viewBtns = document.querySelectorAll('.view-btn');
    const coursesGrid = document.querySelector('.courses-grid');
    const courseCards = document.querySelectorAll('.course-card');
    const coursesCount = document.querySelector('.courses-count strong');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    // 강좌 데이터 저장
    let allCourses = Array.from(courseCards).map(card => ({
        element: card,
        category: card.dataset.category,
        title: card.querySelector('.course-title').textContent.toLowerCase(),
        instructor: card.querySelector('.instructor span').textContent.toLowerCase(),
        price: parseInt(card.querySelector('.current-price').textContent.replace(/[^0-9]/g, '')) || 0,
        rating: parseFloat(card.querySelector('.rating-score').textContent),
        isFree: card.querySelector('.course-badge.free') !== null,
        isNew: card.querySelector('.course-badge.new') !== null,
        isHot: card.querySelector('.course-badge.hot') !== null
    }));
    
    // 현재 필터 상태
    let currentFilters = {
        category: 'all',
        search: '',
        sort: 'popular',
        price: 'all',
        level: 'all',
        duration: 'all'
    };
    
    // 검색 기능
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        currentFilters.search = searchTerm;
        filterAndDisplayCourses();
    }
    
    // 카테고리 필터
    function handleCategoryFilter(category) {
        currentFilters.category = category;
        
        // 탭 활성화 상태 변경
        categoryTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        filterAndDisplayCourses();
    }
    
    // 정렬 기능
    function handleSort(sortType) {
        currentFilters.sort = sortType;
        filterAndDisplayCourses();
    }
    
    // 필터 기능
    function handleFilter() {
        const priceFilter = document.querySelector('.filter-select[value="all"]').closest('.filter-group').querySelector('.filter-select');
        const levelFilter = document.querySelectorAll('.filter-select')[1];
        const durationFilter = document.querySelectorAll('.filter-select')[2];
        
        currentFilters.price = priceFilter.value;
        currentFilters.level = levelFilter.value;
        currentFilters.duration = durationFilter.value;
        
        filterAndDisplayCourses();
    }
    
    // 뷰 변경 기능
    function handleViewChange(viewType) {
        viewBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        
        if (viewType === 'list') {
            coursesGrid.classList.add('list-view');
        } else {
            coursesGrid.classList.remove('list-view');
        }
    }
    
    // 강좌 필터링 및 표시
    function filterAndDisplayCourses() {
        let filteredCourses = allCourses.filter(course => {
            // 카테고리 필터
            if (currentFilters.category !== 'all' && course.category !== currentFilters.category) {
                return false;
            }
            
            // 검색 필터
            if (currentFilters.search && 
                !course.title.includes(currentFilters.search) && 
                !course.instructor.includes(currentFilters.search)) {
                return false;
            }
            
            // 가격 필터
            if (currentFilters.price === 'free' && !course.isFree) {
                return false;
            }
            if (currentFilters.price === 'paid' && course.isFree) {
                return false;
            }
            
            return true;
        });
        
        // 정렬
        filteredCourses.sort((a, b) => {
            switch (currentFilters.sort) {
                case 'popular':
                    return b.rating - a.rating;
                case 'latest':
                    return b.isNew - a.isNew;
                case 'rating':
                    return b.rating - a.rating;
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });
        
        // 모든 강좌 카드 숨기기
        courseCards.forEach(card => {
            card.style.display = 'none';
        });
        
        // 필터링된 강좌 표시
        filteredCourses.forEach(course => {
            course.element.style.display = 'block';
        });
        
        // 강좌 수 업데이트
        coursesCount.textContent = filteredCourses.length;
        
        // 애니메이션 효과
        setTimeout(() => {
            filteredCourses.forEach((course, index) => {
                course.element.style.opacity = '0';
                course.element.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    course.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    course.element.style.opacity = '1';
                    course.element.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }, 100);
    }
    
    // 더보기 기능
    function handleLoadMore() {
        // 실제 구현에서는 서버에서 추가 데이터를 가져와야 함
        loadMoreBtn.textContent = '로딩 중...';
        loadMoreBtn.disabled = true;
        
        setTimeout(() => {
            loadMoreBtn.textContent = '더 많은 강좌 보기';
            loadMoreBtn.disabled = false;
            // 추가 강좌 로드 로직
        }, 1000);
    }
    
    // 모바일 메뉴 토글
    function initMobileMenu() {
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
    
    // 이벤트 리스너 등록
    function initEventListeners() {
        // 검색 이벤트
        searchInput.addEventListener('input', handleSearch);
        searchBtn.addEventListener('click', handleSearch);
        
        // 엔터 키 검색
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        
        // 카테고리 탭 이벤트
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                handleCategoryFilter(category);
            });
        });
        
        // 정렬 이벤트
        sortSelect.addEventListener('change', (e) => {
            handleSort(e.target.value);
        });
        
        // 필터 이벤트
        filterSelects.forEach(select => {
            select.addEventListener('change', handleFilter);
        });
        
        // 뷰 변경 이벤트
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewType = e.target.dataset.view;
                handleViewChange(viewType);
            });
        });
        
        // 더보기 버튼 이벤트
        loadMoreBtn.addEventListener('click', handleLoadMore);
        
        // 강좌 카드 클릭 이벤트
        courseCards.forEach(card => {
            // 수강신청 버튼 클릭 이벤트
            const enrollBtn = card.querySelector('.enroll-btn');
            if (enrollBtn) {
                enrollBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                    // 수강신청 버튼은 HTML의 onclick으로 처리됨
                });
            }
        });
    }
    
    // 스크롤 이벤트 (무한 스크롤)
    function initInfiniteScroll() {
        let isLoading = false;
        
        window.addEventListener('scroll', () => {
            if (isLoading) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 1000) {
                isLoading = true;
                handleLoadMore();
                setTimeout(() => {
                    isLoading = false;
                }, 1000);
            }
        });
    }
    
    // 로컬 스토리지에 검색 기록 저장
    function saveSearchHistory(searchTerm) {
        if (!searchTerm) return;
        
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history = history.filter(term => term !== searchTerm);
        history.unshift(searchTerm);
        history = history.slice(0, 5); // 최대 5개까지만 저장
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    
    // 검색 자동완성
    function initSearchAutocomplete() {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        searchInput.addEventListener('focus', () => {
            // 검색 기록 표시 로직 (실제 구현에서는 드롭다운으로 표시)
            if (searchHistory.length > 0) {
                console.log('검색 기록:', searchHistory);
            }
        });
        
        searchInput.addEventListener('blur', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                saveSearchHistory(searchTerm);
            }
        });
    }
    
    // 페이지 로드 시 URL 파라미터 확인
    function initFromUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const search = urlParams.get('search');
        
        if (category && category !== 'all') {
            handleCategoryFilter(category);
        }
        
        if (search) {
            searchInput.value = search;
            handleSearch();
        }
    }
    
    // 초기화
    function init() {
        initEventListeners();
        initMobileMenu();
        initInfiniteScroll();
        initSearchAutocomplete();
        initFromUrlParams();
        
        // 초기 강좌 표시
        filterAndDisplayCourses();
    }
    
    // 페이지 로드 완료 후 초기화
    init();
});

// 추가 유틸리티 함수들
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(price);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 디바운스된 검색 함수
const debouncedSearch = debounce((searchTerm) => {
    console.log('검색어:', searchTerm);
}, 300); 