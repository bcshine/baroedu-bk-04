// 대시보드 관련 변수
let monthlyChart = null;

// 대시보드 초기화
async function initDashboard() {
    try {
        // 로딩 상태 표시
        showLoading();
        
        // 통계 데이터 로드
        await loadDashboardStats();
        
        // 최근 활동 데이터 로드
        await loadRecentActivities();
        
        // 월별 차트 생성
        await createMonthlyChart();
        
        // 로딩 완료
        hideLoading();
        
    } catch (error) {
        console.error('대시보드 초기화 에러:', error);
        showToast('대시보드 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// 통계 데이터 로드
async function loadDashboardStats() {
    try {
        const response = await apiClient.getDashboardStats();
        
        if (response.success) {
            const stats = response.stats;
            
            // 통계 카드 업데이트
            updateStatCard('total-users', stats.userCount);
            updateStatCard('total-courses', stats.courseCount);
            updateStatCard('total-enrollments', stats.enrollmentCount);
            updateStatCard('total-revenue', formatCurrency(stats.totalRevenue));
        }
        
    } catch (error) {
        console.error('통계 데이터 로드 에러:', error);
        throw error;
    }
}

// 통계 카드 업데이트
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // 애니메이션 효과
        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = value;
            element.style.opacity = '1';
        }, 200);
    }
}

// 최근 활동 데이터 로드
async function loadRecentActivities() {
    try {
        const response = await apiClient.getRecentActivities();
        
        if (response.success) {
            updateRecentEnrollments(response.data.enrollments.slice(0, 5)); // 최근 5개만
            updateRecentReviews(response.data.reviews.slice(0, 5)); // 최근 5개만
        }
        
    } catch (error) {
        console.error('최근 활동 데이터 로드 에러:', error);
        throw error;
    }
}

// 최근 수강신청 테이블 업데이트
function updateRecentEnrollments(enrollments) {
    const tbody = document.getElementById('recent-enrollments');
    if (!tbody) return;
    
    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">데이터가 없습니다.</td></tr>';
        return;
    }
    
    const html = enrollments.map(enrollment => `
        <tr>
            <td>${enrollment.users?.name || '알 수 없음'}</td>
            <td>${enrollment.courses?.title || '알 수 없음'}</td>
            <td>${formatDate(enrollment.created_at)}</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

// 최근 후기 테이블 업데이트
function updateRecentReviews(reviews) {
    const tbody = document.getElementById('recent-reviews');
    if (!tbody) return;
    
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">데이터가 없습니다.</td></tr>';
        return;
    }
    
    const html = reviews.map(review => `
        <tr>
            <td>${review.users?.name || '알 수 없음'}</td>
            <td>
                <div class="rating-stars">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </td>
            <td>
                <div class="review-content" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${review.content || ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

// 월별 차트 생성
async function createMonthlyChart() {
    try {
        const response = await apiClient.getMonthlyStats();
        
        if (!response.success) {
            throw new Error('월별 통계 데이터 로드 실패');
        }
        
        const monthlyData = response.data;
        
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        
        // 기존 차트 제거
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        // 월별 데이터 준비
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        const data = months.map((month, index) => monthlyData[index + 1] || 0);
        
        // 차트 생성
        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '수강신청 수',
                    data: data,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '2024년 월별 수강신청 추이'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('월별 차트 생성 에러:', error);
        throw error;
    }
}

// 로딩 상태 표시
function showLoading() {
    const loadingHtml = `
        <div id="loading-overlay" class="d-flex justify-content-center align-items-center" 
             style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); z-index: 9999;">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

// 로딩 상태 숨기기
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 대시보드 새로고침
async function refreshDashboard() {
    try {
        await initDashboard();
        showToast('대시보드가 새로고침되었습니다.', 'success');
    } catch (error) {
        console.error('대시보드 새로고침 에러:', error);
        showToast('새로고침 중 오류가 발생했습니다.', 'error');
    }
}

// 실시간 업데이트 설정 (10초마다)
function setupRealTimeUpdates() {
    setInterval(async () => {
        try {
            // 통계만 조용히 업데이트
            await loadDashboardStats();
        } catch (error) {
            console.error('실시간 업데이트 에러:', error);
        }
    }, 10000); // 10초마다
}

// 사용자 정보 업데이트
async function updateUserInfo() {
    try {
        const user = await getUserInfo();
        if (user) {
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = user.name || user.email;
            }
        }
    } catch (error) {
        console.error('사용자 정보 업데이트 에러:', error);
    }
}

// 유틸리티 함수들
const utils = {
    calculateGrowthRate(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    },

    getTrendIcon(growthRate) {
        return growthRate > 0 ? 'fa-arrow-up text-success' : 
               growthRate < 0 ? 'fa-arrow-down text-danger' : 
               'fa-minus text-muted';
    },

    async generateSummaryStats() {
        try {
            const response = await apiClient.getDashboardStats();
            if (response.success) {
                return {
                    totalUsers: response.stats.userCount,
                    totalCourses: response.stats.courseCount,
                    totalEnrollments: response.stats.enrollmentCount,
                    totalRevenue: response.stats.totalRevenue
                };
            }
        } catch (error) {
            console.error('요약 통계 생성 에러:', error);
            return null;
        }
    }
};

// 자동 초기화 코드 제거됨 - index.html에서 제어

// 새로고침 버튼 이벤트 (필요시 추가)
if (document.getElementById('refresh-dashboard')) {
    document.getElementById('refresh-dashboard').addEventListener('click', refreshDashboard);
}

// 윈도우 포커스 시 데이터 새로고침
window.addEventListener('focus', function() {
    loadDashboardStats().catch(console.error);
}); 