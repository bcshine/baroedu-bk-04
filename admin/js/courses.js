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
        
    } catch (error) {
        console.error('페이지 초기화 에러:', error);
        utils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
});

// 강좌 테이블 초기화
async function initCoursesTable() {
    try {
        // 강좌 데이터 로드
        const courses = await db.getCourses();
        
        // DataTable 초기화
        coursesTable = $('#courses-table').DataTable({
            data: courses,
            columns: [
                {
                    data: 'thumbnail_url',
                    render: function(data) {
                        return data ? 
                            `<img src="${data}" class="course-thumbnail" onerror="this.src='../images/default-course.jpg'">` :
                            '<img src="../images/default-course.jpg" class="course-thumbnail">';
                    }
                },
                { 
                    data: 'title',
                    render: function(data) {
                        return `<div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data}">${data}</div>`;
                    }
                },
                { data: 'instructor_name' },
                { 
                    data: 'category_id',
                    render: function(data) {
                        const categoryMap = {
                            'marketing': '마케팅',
                            'branding': '브랜드',
                            'development': '창업',
                            'crm': 'CRM'
                        };
                        return categoryMap[data] || data;
                    }
                },
                { 
                    data: 'price',
                    render: function(data, type, row) {
                        if (row.is_free) {
                            return '<span class="badge badge-success">무료</span>';
                        }
                        return `<span class="course-price">${utils.formatCurrency(data)}</span>`;
                    }
                },
                { 
                    data: 'rating',
                    render: function(data) {
                        const rating = parseFloat(data) || 0;
                        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
                        return `<span class="course-rating">${stars}</span> (${rating.toFixed(1)})`;
                    }
                },
                { data: 'total_students' },
                { 
                    data: 'status',
                    render: function(data) {
                        return data === 'published' ? 
                            '<span class="status-badge status-published">게시</span>' :
                            '<span class="status-badge status-draft">임시저장</span>';
                    }
                },
                { 
                    data: 'created_at',
                    render: function(data) {
                        return utils.formatDate(data);
                    }
                },
                {
                    data: 'id',
                    render: function(data) {
                        return `
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info" onclick="editCourse('${data}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger" onclick="deleteCourse('${data}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/Korean.json'
            },
            responsive: true,
            pageLength: 10,
            order: [[8, 'desc']] // 생성일 기준 내림차순
        });
        
    } catch (error) {
        console.error('강좌 테이블 초기화 에러:', error);
        throw error;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 강좌 폼 제출
    document.getElementById('course-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveCourse();
    });
    
    // 무료 강좌 체크박스
    document.getElementById('course-is-free').addEventListener('change', function(e) {
        const priceInput = document.getElementById('course-price');
        if (e.target.checked) {
            priceInput.value = '0';
            priceInput.disabled = true;
        } else {
            priceInput.disabled = false;
        }
    });
}

// 새 강좌 추가 모달 표시
function showAddCourseModal() {
    currentCourseId = null;
    document.getElementById('modal-title').textContent = '강좌 추가';
    document.getElementById('course-form').reset();
    document.getElementById('course-price').disabled = false;
    $('#course-modal').modal('show');
}

// 강좌 수정 모달 표시
async function editCourse(courseId) {
    try {
        currentCourseId = courseId;
        document.getElementById('modal-title').textContent = '강좌 수정';
        
        // 강좌 정보 로드
        const { data: course, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
        
        if (error) {
            throw error;
        }
        
        // 폼에 데이터 설정
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-instructor').value = course.instructor_name || '';
        document.getElementById('course-category').value = course.category_id || '';
        document.getElementById('course-price').value = course.price || 0;
        document.getElementById('course-duration').value = course.duration || 0;
        document.getElementById('course-difficulty').value = course.difficulty || 'beginner';
        document.getElementById('course-short-description').value = course.short_description || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-thumbnail').value = course.thumbnail_url || '';
        document.getElementById('course-status').value = course.status || 'draft';
        document.getElementById('course-is-free').checked = course.is_free || false;
        
        // 무료 강좌 체크박스 상태에 따라 가격 입력 필드 제어
        document.getElementById('course-price').disabled = course.is_free;
        
        $('#course-modal').modal('show');
        
    } catch (error) {
        console.error('강좌 수정 모달 에러:', error);
        utils.showToast('강좌 정보를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 저장
async function saveCourse() {
    try {
        const formData = {
            title: document.getElementById('course-title').value,
            instructor_name: document.getElementById('course-instructor').value,
            category_id: document.getElementById('course-category').value,
            price: parseFloat(document.getElementById('course-price').value) || 0,
            duration: parseInt(document.getElementById('course-duration').value) || 0,
            difficulty: document.getElementById('course-difficulty').value,
            short_description: document.getElementById('course-short-description').value,
            description: document.getElementById('course-description').value,
            thumbnail_url: document.getElementById('course-thumbnail').value,
            status: document.getElementById('course-status').value,
            is_free: document.getElementById('course-is-free').checked,
            updated_at: new Date().toISOString()
        };
        
        let result;
        if (currentCourseId) {
            // 수정
            result = await supabase
                .from('courses')
                .update(formData)
                .eq('id', currentCourseId);
        } else {
            // 추가
            formData.created_at = new Date().toISOString();
            result = await supabase
                .from('courses')
                .insert([formData]);
        }
        
        if (result.error) {
            throw result.error;
        }
        
        // 성공 메시지
        utils.showToast(currentCourseId ? '강좌가 수정되었습니다.' : '강좌가 추가되었습니다.', 'success');
        
        // 모달 닫기
        $('#course-modal').modal('hide');
        
        // 테이블 새로고침
        await refreshCoursesTable();
        
    } catch (error) {
        console.error('강좌 저장 에러:', error);
        utils.showToast('강좌 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 삭제
async function deleteCourse(courseId) {
    if (!confirm('정말로 이 강좌를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);
        
        if (error) {
            throw error;
        }
        
        utils.showToast('강좌가 삭제되었습니다.', 'success');
        
        // 테이블 새로고침
        await refreshCoursesTable();
        
    } catch (error) {
        console.error('강좌 삭제 에러:', error);
        utils.showToast('강좌 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 테이블 새로고침
async function refreshCoursesTable() {
    try {
        const courses = await db.getCourses();
        coursesTable.clear();
        coursesTable.rows.add(courses);
        coursesTable.draw();
    } catch (error) {
        console.error('강좌 테이블 새로고침 에러:', error);
        utils.showToast('데이터를 새로고침하는 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 상태 토글
async function toggleCourseStatus(courseId) {
    try {
        // 현재 상태 가져오기
        const { data: course, error: fetchError } = await supabase
            .from('courses')
            .select('status')
            .eq('id', courseId)
            .single();
        
        if (fetchError) {
            throw fetchError;
        }
        
        // 상태 토글
        const newStatus = course.status === 'published' ? 'draft' : 'published';
        
        const { error: updateError } = await supabase
            .from('courses')
            .update({ status: newStatus })
            .eq('id', courseId);
        
        if (updateError) {
            throw updateError;
        }
        
        utils.showToast(`강좌 상태가 ${newStatus === 'published' ? '게시' : '임시저장'}로 변경되었습니다.`, 'success');
        
        // 테이블 새로고침
        await refreshCoursesTable();
        
    } catch (error) {
        console.error('강좌 상태 토글 에러:', error);
        utils.showToast('강좌 상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 강좌 검색
function searchCourses(searchTerm) {
    if (coursesTable) {
        coursesTable.search(searchTerm).draw();
    }
}

// 강좌 필터링
function filterCourses(filterType, filterValue) {
    if (coursesTable) {
        if (filterType === 'status') {
            coursesTable.column(7).search(filterValue).draw();
        } else if (filterType === 'category') {
            coursesTable.column(3).search(filterValue).draw();
        }
    }
}

// 강좌 통계 업데이트
async function updateCourseStats() {
    try {
        const courses = await db.getCourses();
        const totalCourses = courses.length;
        const publishedCourses = courses.filter(c => c.status === 'published').length;
        const draftCourses = courses.filter(c => c.status === 'draft').length;
        const freeCourses = courses.filter(c => c.is_free).length;
        
        console.log('강좌 통계:', {
            total: totalCourses,
            published: publishedCourses,
            draft: draftCourses,
            free: freeCourses
        });
        
    } catch (error) {
        console.error('강좌 통계 업데이트 에러:', error);
    }
} 