// 강좌 관리 관련 변수
let coursesTable = null;
let currentCourseId = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 인증 확인
        await checkAuth();
        
        // 강좌 테이블 초기화
        await initCoursesTable();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        console.log('✅ 강좌 관리 페이지가 성공적으로 초기화되었습니다.');
        
    } catch (error) {
        console.error('❌ 강좌 관리 페이지 초기화 실패:', error);
        showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
});

// 강좌 테이블 초기화
async function initCoursesTable() {
    try {
        // 강좌 데이터 로드
        const response = await apiClient.getCourses();
        
        if (!response.success) {
            throw new Error('강좌 데이터 로드 실패');
        }
        
        const courses = response.data;
        
        // DataTable 초기화
        coursesTable = $('#courses-table').DataTable({
            data: courses,
            columns: [
                {
                    data: 'thumbnail_url',
                    render: function(data) {
                        return data ? 
                            `<img src="${data}" alt="썸네일" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;">` : 
                            '<div class="bg-secondary text-white text-center" style="width: 50px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; border-radius: 4px;">NO IMG</div>';
                    }
                },
                {
                    data: 'title',
                    render: function(data) {
                        return `<div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data}">${data}</div>`;
                    }
                },
                { data: 'instructor_name' },
                { data: 'category' },
                {
                    data: 'price',
                    render: function(data) {
                        return formatCurrency(data);
                    }
                },
                {
                    data: 'rating',
                    render: function(data) {
                        return data ? `${data.toFixed(1)} ★` : '0.0 ★';
                    }
                },
                {
                    data: 'student_count',
                    render: function(data) {
                        return data || 0;
                    }
                },
                {
                    data: 'status',
                    render: function(data) {
                        const statusClass = data === 'published' ? 'badge-success' : 'badge-warning';
                        const statusText = data === 'published' ? '게시됨' : '임시저장';
                        return `<span class="badge ${statusClass}">${statusText}</span>`;
                    }
                },
                {
                    data: null,
                    render: function(data, type, row) {
                        return `
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-info" onclick="editCourse(${row.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCourse(${row.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ko.json'
            },
            responsive: true,
            order: [[0, 'desc']], // 최신순으로 정렬
            pageLength: 10,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '새 강좌 추가',
                    className: 'btn btn-primary',
                    action: function() {
                        addCourse();
                    }
                },
                'excel',
                'pdf'
            ]
        });
        
    } catch (error) {
        console.error('강좌 테이블 초기화 에러:', error);
        throw error;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 강좌 추가 버튼
    const addButton = document.getElementById('add-course-btn');
    if (addButton) {
        addButton.addEventListener('click', addCourse);
    }
    
    // 강좌 폼 제출
    const courseForm = document.getElementById('course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseSubmit);
    }
    
    // 모달 닫기 이벤트
    const modal = document.getElementById('course-modal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            resetCourseForm();
        });
    }
}

// 강좌 추가
function addCourse() {
    currentCourseId = null;
    resetCourseForm();
    document.getElementById('course-modal-title').textContent = '새 강좌 추가';
    $('#course-modal').modal('show');
}

// 강좌 수정
async function editCourse(courseId) {
    try {
        currentCourseId = courseId;
        
        // 강좌 데이터 가져오기
        const response = await apiClient.getCourses();
        if (!response.success) {
            throw new Error('강좌 데이터 로드 실패');
        }
        
        const course = response.data.find(c => c.id === courseId);
        if (!course) {
            throw new Error('강좌를 찾을 수 없습니다.');
        }
        
        // 폼에 데이터 채우기
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-instructor').value = course.instructor_name || '';
        document.getElementById('course-category').value = course.category || '';
        document.getElementById('course-price').value = course.price || '';
        document.getElementById('course-duration').value = course.duration || '';
        document.getElementById('course-level').value = course.level || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-thumbnail').value = course.thumbnail_url || '';
        document.getElementById('course-status').value = course.status || 'draft';
        
        // 모달 제목 변경
        document.getElementById('course-modal-title').textContent = '강좌 수정';
        
        // 모달 열기
        $('#course-modal').modal('show');
        
    } catch (error) {
        console.error('강좌 수정 에러:', error);
        showToast('강좌 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 삭제
async function deleteCourse(courseId) {
    if (!confirm('정말로 이 강좌를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await apiClient.deleteCourse(courseId);
        
        if (response.success) {
            showToast('강좌가 성공적으로 삭제되었습니다.', 'success');
            await refreshCoursesTable();
        } else {
            throw new Error(response.message || '강좌 삭제 실패');
        }
        
    } catch (error) {
        console.error('강좌 삭제 에러:', error);
        showToast('강좌 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 폼 제출 처리
async function handleCourseSubmit(e) {
    e.preventDefault();
    
    try {
        // 폼 데이터 수집
        const formData = new FormData(e.target);
        const courseData = {
            title: formData.get('title'),
            instructor_name: formData.get('instructor'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            duration: formData.get('duration'),
            level: formData.get('level'),
            description: formData.get('description'),
            thumbnail_url: formData.get('thumbnail'),
            status: formData.get('status')
        };
        
        // 유효성 검사
        if (!courseData.title || !courseData.instructor_name || !courseData.price) {
            showToast('필수 항목을 모두 입력해주세요.', 'error');
            return;
        }
        
        let response;
        if (currentCourseId) {
            // 수정
            response = await apiClient.updateCourse(currentCourseId, courseData);
        } else {
            // 추가
            response = await apiClient.createCourse(courseData);
        }
        
        if (response.success) {
            const action = currentCourseId ? '수정' : '추가';
            showToast(`강좌가 성공적으로 ${action}되었습니다.`, 'success');
            
            // 모달 닫기
            $('#course-modal').modal('hide');
            
            // 테이블 새로고침
            await refreshCoursesTable();
        } else {
            throw new Error(response.message || '강좌 저장 실패');
        }
        
    } catch (error) {
        console.error('강좌 저장 에러:', error);
        showToast('강좌 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 폼 초기화
function resetCourseForm() {
    const form = document.getElementById('course-form');
    if (form) {
        form.reset();
    }
    currentCourseId = null;
}

// 강좌 테이블 새로고침
async function refreshCoursesTable() {
    try {
        const response = await apiClient.getCourses();
        
        if (!response.success) {
            throw new Error('강좌 데이터 로드 실패');
        }
        
        if (coursesTable) {
            coursesTable.clear();
            coursesTable.rows.add(response.data);
            coursesTable.draw();
        }
        
    } catch (error) {
        console.error('강좌 테이블 새로고침 에러:', error);
        showToast('강좌 목록을 새로고침하는 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 검색
function searchCourses(query) {
    if (coursesTable) {
        coursesTable.search(query).draw();
    }
}

// 강좌 상태 변경
async function toggleCourseStatus(courseId, currentStatus) {
    try {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        
        const response = await apiClient.updateCourse(courseId, { status: newStatus });
        
        if (response.success) {
            const statusText = newStatus === 'published' ? '게시됨' : '임시저장';
            showToast(`강좌 상태가 '${statusText}'로 변경되었습니다.`, 'success');
            await refreshCoursesTable();
        } else {
            throw new Error(response.message || '상태 변경 실패');
        }
        
    } catch (error) {
        console.error('강좌 상태 변경 에러:', error);
        showToast('강좌 상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 대량 삭제
async function deleteSelectedCourses() {
    const selectedRows = coursesTable.rows('.selected').data();
    
    if (selectedRows.length === 0) {
        showToast('삭제할 강좌를 선택해주세요.', 'warning');
        return;
    }
    
    if (!confirm(`선택한 ${selectedRows.length}개의 강좌를 삭제하시겠습니까?`)) {
        return;
    }
    
    try {
        const deletePromises = [];
        for (let i = 0; i < selectedRows.length; i++) {
            deletePromises.push(apiClient.deleteCourse(selectedRows[i].id));
        }
        
        await Promise.all(deletePromises);
        
        showToast(`${selectedRows.length}개의 강좌가 성공적으로 삭제되었습니다.`, 'success');
        await refreshCoursesTable();
        
    } catch (error) {
        console.error('강좌 대량 삭제 에러:', error);
        showToast('강좌 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 내보내기
function exportCourses(format) {
    if (!coursesTable) return;
    
    switch (format) {
        case 'excel':
            coursesTable.button('.buttons-excel').trigger();
            break;
        case 'pdf':
            coursesTable.button('.buttons-pdf').trigger();
            break;
        default:
            showToast('지원하지 않는 형식입니다.', 'error');
    }
}

// 강좌 미리보기
function previewCourse(courseId) {
    const previewUrl = `/course-preview.html?id=${courseId}`;
    window.open(previewUrl, '_blank');
}

// 강좌 통계
async function showCourseStats(courseId) {
    try {
        // TODO: 강좌별 통계 API 구현 후 업데이트
        showToast('강좌 통계 기능은 준비 중입니다.', 'info');
        
    } catch (error) {
        console.error('강좌 통계 에러:', error);
        showToast('강좌 통계를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 유틸리티 함수들
const courseUtils = {
    // 강좌 카테고리 목록
    getCategories() {
        return [
            '웹 개발',
            '모바일 개발',
            '데이터 사이언스',
            '디자인',
            '마케팅',
            '비즈니스',
            '기타'
        ];
    },
    
    // 강좌 레벨 목록
    getLevels() {
        return [
            '초급',
            '중급',
            '고급',
            '전문가'
        ];
    },
    
    // 강좌 상태 목록
    getStatuses() {
        return [
            { value: 'draft', label: '임시저장' },
            { value: 'published', label: '게시됨' }
        ];
    },
    
    // 강좌 유효성 검사
    validateCourse(courseData) {
        const errors = [];
        
        if (!courseData.title) errors.push('강좌 제목은 필수입니다.');
        if (!courseData.instructor_name) errors.push('강사명은 필수입니다.');
        if (!courseData.price || courseData.price < 0) errors.push('올바른 가격을 입력해주세요.');
        if (courseData.title && courseData.title.length > 100) errors.push('강좌 제목은 100자 이하여야 합니다.');
        
        return errors;
    }
};

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl+N: 새 강좌 추가
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addCourse();
    }
    
    // Ctrl+R: 새로고침
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshCoursesTable();
    }
    
    // ESC: 모달 닫기
    if (e.key === 'Escape') {
        $('#course-modal').modal('hide');
    }
});

// 창 크기 변경 시 테이블 재조정
window.addEventListener('resize', function() {
    if (coursesTable) {
        coursesTable.columns.adjust().draw();
    }
}); 