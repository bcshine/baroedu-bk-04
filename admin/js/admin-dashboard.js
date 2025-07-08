// 대시보드 관련 변수
let monthlyChart = null;

// 대시보드 초기화
async function initDashboard() {
    try {
        console.log('🎯 대시보드 초기화 시작');
        
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
        
        console.log('✅ 대시보드 초기화 완료');
        
    } catch (error) {
        console.error('❌ 대시보드 초기화 에러:', error);
        showToast('대시보드 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// 통계 데이터 로드 (실제 API 사용)
async function loadDashboardStats() {
    try {
        console.log('📊 통계 데이터 로드 중...');
        
        // API 클라이언트를 통해 실제 데이터 조회
        const response = await apiClient.getDashboardStats();
        
        if (response.success) {
            const stats = response.data;
            
            // 통계 카드 업데이트
            updateStatCard('total-users', stats.userCount || 0);
            updateStatCard('total-courses', stats.courseCount || 0);
            updateStatCard('total-enrollments', stats.enrollmentCount || 0);
            updateStatCard('total-revenue', formatCurrency((stats.enrollmentCount || 0) * 300000)); // 평균 강좌 가격 기준
            
            console.log('✅ 실제 통계 데이터 로드 완료:', stats);
        } else {
            throw new Error('통계 데이터 조회 실패');
        }
        
    } catch (error) {
        console.error('❌ 통계 데이터 로드 에러:', error);
        
        // 에러 시 기본값 표시
        updateStatCard('total-users', 0);
        updateStatCard('total-courses', 0);
        updateStatCard('total-enrollments', 0);
        updateStatCard('total-revenue', formatCurrency(0));
        
        showToast('통계 데이터 로드에 실패했습니다. 기본값을 표시합니다.', 'warning');
    }
}

// 통계 카드 업데이트 (애니메이션 효과 포함)
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // 애니메이션 효과
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            element.textContent = value;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            element.style.transition = 'all 0.3s ease';
        }, 200);
    }
}

// 최근 활동 데이터 로드 (실제 API 사용)
async function loadRecentActivities() {
    try {
        console.log('📈 최근 활동 데이터 로드 중...');
        
        // API 클라이언트를 통해 실제 수강신청 데이터 조회
        const enrollmentResponse = await apiClient.getEnrollments();
        
        if (enrollmentResponse.success) {
            const enrollments = enrollmentResponse.data.slice(0, 5); // 최근 5개만
            updateRecentEnrollments(enrollments);
            console.log('✅ 실제 수강신청 데이터 로드 완료:', enrollments.length, '건');
        } else {
            console.warn('⚠️ 수강신청 데이터 로드 실패, 기본 데이터 사용');
            updateRecentEnrollments([]);
        }
        
        // 후기 데이터는 아직 구현되지 않았으므로 기본 데이터 사용
        const sampleReviews = [
            {
                user_name: '만족한 수강생',
                rating: 5,
                content: '강의 내용이 정말 유용했습니다!'
            },
            {
                user_name: '적극 추천',
                rating: 4,
                content: '실무에 바로 적용할 수 있어서 좋았어요.'
            }
        ];
        updateRecentReviews(sampleReviews);
        
    } catch (error) {
        console.error('❌ 최근 활동 데이터 로드 에러:', error);
        
        // 에러 시 빈 데이터 표시
        updateRecentEnrollments([]);
        updateRecentReviews([]);
        
        showToast('최근 활동 데이터 로드에 실패했습니다.', 'warning');
    }
}

// 최근 수강신청 테이블 업데이트
function updateRecentEnrollments(enrollments) {
    const tbody = document.getElementById('recent-enrollments');
    if (!tbody) return;
    
    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">수강신청 데이터가 없습니다.</td></tr>';
        return;
    }
    
    const html = enrollments.map(enrollment => {
        // 사용자 정보 처리 (user_id에서 이메일 추출)
        const userDisplay = enrollment.user_id ? 
            enrollment.user_id.substring(0, 8) + '...' : '알 수 없음';
        
        const courseTitle = enrollment.courses?.title || '알 수 없음';
        const createdAt = formatDate(enrollment.created_at);
        
        return `
            <tr>
                <td>
                    <small class="text-muted">${userDisplay}</small>
                </td>
                <td>
                    <strong>${courseTitle}</strong>
                    <br>
                    <small class="text-success">진행률: ${enrollment.progress || 0}%</small>
                </td>
                <td>
                    <small>${createdAt}</small>
                    <br>
                    <span class="badge badge-${enrollment.status === 'enrolled' ? 'success' : 'secondary'}">
                        ${enrollment.status === 'enrolled' ? '수강중' : enrollment.status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = html;
}

// 최근 후기 테이블 업데이트
function updateRecentReviews(reviews) {
    const tbody = document.getElementById('recent-reviews');
    if (!tbody) return;
    
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">후기 데이터가 없습니다.</td></tr>';
        return;
    }
    
    const html = reviews.map(review => `
        <tr>
            <td>
                <strong>${review.user_name || '익명'}</strong>
            </td>
            <td>
                <div class="rating-stars text-warning">
                    ${'★'.repeat(review.rating || 5)}${'☆'.repeat(5 - (review.rating || 5))}
                </div>
                <small class="text-muted">${review.rating || 5}/5</small>
            </td>
            <td>
                <div class="review-content" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${review.content || ''}">
                    ${review.content || '후기가 없습니다.'}
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

// 월별 차트 생성 (실제 데이터 기반)
async function createMonthlyChart() {
    try {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) {
            console.warn('⚠️ 차트 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 차트가 있으면 삭제
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        // API 클라이언트를 통해 월별 통계 조회
        const response = await apiClient.getMonthlyStats();
        
        let chartData;
        if (response.success && response.data) {
            chartData = response.data;
        } else {
            // 기본 차트 데이터
            chartData = {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                datasets: [{
                    label: '수강신청',
                    data: [5, 8, 12, 15, 20, 18, 25, 22, 19, 24, 28, 30],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            };
        }
        
        // Chart.js로 차트 생성
        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: '월별 수강신청 추이'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
        
        console.log('✅ 월별 차트 생성 완료');
        
    } catch (error) {
        console.error('❌ 월별 차트 생성 에러:', error);
        
        // 차트 요소에 에러 메시지 표시
        const ctx = document.getElementById('monthlyChart');
        if (ctx) {
            ctx.parentElement.innerHTML = '<p class="text-center text-muted">차트를 로드할 수 없습니다.</p>';
        }
    }
}

// 로딩 상태 표시
function showLoading() {
    // 통계 카드들에 로딩 효과
    ['total-users', 'total-courses', 'total-enrollments', 'total-revenue'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    });
    
    // 테이블에 로딩 메시지
    const enrollmentsTbody = document.getElementById('recent-enrollments');
    const reviewsTbody = document.getElementById('recent-reviews');
    
    if (enrollmentsTbody) {
        enrollmentsTbody.innerHTML = '<tr><td colspan="3" class="text-center"><i class="fas fa-spinner fa-spin mr-2"></i>로딩 중...</td></tr>';
    }
    
    if (reviewsTbody) {
        reviewsTbody.innerHTML = '<tr><td colspan="3" class="text-center"><i class="fas fa-spinner fa-spin mr-2"></i>로딩 중...</td></tr>';
    }
}

// 로딩 상태 숨기기
function hideLoading() {
    // 특별한 처리 없음 (데이터가 로드되면 자동으로 교체됨)
}

// 대시보드 새로고침
async function refreshDashboard() {
    console.log('🔄 대시보드 새로고침');
    showToast('대시보드를 새로고침합니다...', 'info');
    
    try {
        await initDashboard();
        showToast('대시보드가 성공적으로 새로고침되었습니다.', 'success');
    } catch (error) {
        console.error('❌ 대시보드 새로고침 에러:', error);
        showToast('대시보드 새로고침에 실패했습니다.', 'error');
    }
}

// 실시간 업데이트 설정 (선택사항)
function setupRealTimeUpdates() {
    // 5분마다 자동 새로고침
    setInterval(async () => {
        try {
            console.log('🔄 자동 새로고침 중...');
            await loadDashboardStats();
            await loadRecentActivities();
        } catch (error) {
            console.error('❌ 자동 새로고침 에러:', error);
        }
    }, 5 * 60 * 1000); // 5분
}

// 유틸리티 함수들
const dashboardUtils = {
    // 성장률 계산
    calculateGrowthRate(current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    },
    
    // 트렌드 아이콘 생성
    getTrendIcon(growthRate) {
        if (growthRate > 0) return '<i class="fas fa-arrow-up text-success"></i>';
        if (growthRate < 0) return '<i class="fas fa-arrow-down text-danger"></i>';
        return '<i class="fas fa-minus text-muted"></i>';
    },
    
    // 요약 통계 생성
    async generateSummaryStats() {
        try {
            const response = await apiClient.getDashboardStats();
            if (response.success) {
                const stats = response.data;
                return {
                    totalActiveUsers: stats.userCount || 0,
                    totalActiveCourses: stats.courseCount || 0,
                    averageEnrollmentsPerCourse: stats.courseCount > 0 ? 
                        Math.round((stats.enrollmentCount || 0) / stats.courseCount) : 0,
                    conversionRate: '85%' // 예시값
                };
            }
            return null;
        } catch (error) {
            console.error('❌ 요약 통계 생성 에러:', error);
            return null;
        }
    }
};

// 전역 함수로 내보내기
window.initDashboard = initDashboard;
window.refreshDashboard = refreshDashboard;
window.dashboardUtils = dashboardUtils; 