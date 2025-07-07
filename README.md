{E0253828-EFB7-49FE-8E06-2F26F1F28193}.png# 바로교육 (baroedu-bk-04)

바로교육은 온라인 교육 플랫폼으로, 강좌 관리, 사용자 관리, 영상 업로드 등의 기능을 제공합니다.

## 🚀 주요 기능

### 일반 사용자 기능
- 강좌 목록 조회
- 강좌 상세 정보 확인
- 강좌 수강 신청
- 마이페이지 관리

### 관리자 기능
- 강좌 관리 (추가, 수정, 삭제)
- **영상 업로드 및 압축** 🎥
- 사용자 관리
- 대시보드 및 통계

## 🎥 영상 업로드 기능

### 특징
- **자동 압축**: 50MB 이상의 영상 파일은 자동으로 압축됩니다
- **다양한 형식 지원**: MP4, WebM, AVI, MOV
- **실시간 진행률**: 업로드 및 압축 진행 상태를 실시간으로 확인
- **Supabase Storage 연동**: 안전한 클라우드 저장소 사용

### 압축 사양
- **해상도**: 최대 1280x720 (720p)
- **비트레이트**: 적응형 비트레이트 적용
- **코덱**: H.264 (비디오) + AAC (오디오)
- **최대 파일 크기**: 100MB

### 사용법
1. 관리자 페이지 → 강좌 관리 → 새 강좌 추가
2. 영상 파일 선택 (최대 100MB)
3. 자동 압축 진행 (50MB 이상인 경우)
4. Supabase Storage 업로드
5. 영상 URL 자동 생성

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. Supabase 설정
```bash
# 환경 변수 설정
cp .env.example .env

# .env 파일에 Supabase 정보 입력
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. 영상 스토리지 설정
```bash
# 영상 스토리지 버킷 생성 및 설정
node setup-video-storage.js

# 강좌 테이블에 video_url 컬럼 추가
node add-video-column.js
```

### 4. 데이터베이스 설정
```bash
# 테이블 생성
node create-tables.js

# 관리자 계정 생성
node create-admin-account.js
```

## 📋 Supabase 수동 설정

### 1. 강좌 테이블 업데이트
```sql
-- video_url 컬럼 추가
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN courses.video_url IS '강좌 영상 파일 URL';
```

### 2. Storage 정책 설정
Supabase 대시보드 → Storage → course-videos → Settings에서 정책 설정:

**INSERT 정책 (업로드 허용)**
```sql
-- Policy name: Allow authenticated users to upload videos
(auth.role() = 'authenticated')
```

**SELECT 정책 (다운로드 허용)**
```sql
-- Policy name: Allow public access to videos
true
```

**UPDATE 정책 (업데이트 허용)**
```sql
-- Policy name: Allow authenticated users to update videos
(auth.role() = 'authenticated')
```

**DELETE 정책 (삭제 허용)**
```sql
-- Policy name: Allow authenticated users to delete videos
(auth.role() = 'authenticated')
```

## 🎯 사용 가이드

### 관리자 페이지 접속
1. `http://localhost:3000/admin/login.html`
2. 관리자 계정으로 로그인
3. 강좌 관리 메뉴 선택

### 강좌 영상 업로드
1. "새 강좌 추가" 버튼 클릭
2. 기본 정보 입력 (제목, 강사, 카테고리 등)
3. 영상 파일 선택
4. 자동 압축 진행 (필요시)
5. 업로드 완료 후 저장

### 업로드된 영상 재생
1. 강좌 목록에서 영상 컬럼의 재생 버튼 클릭
2. 새 창에서 영상 재생

## 🔧 기술 스택

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 4
- AdminLTE 템플릿
- DataTables
- FFmpeg.js (영상 압축)

### Backend
- Node.js
- Supabase (데이터베이스 + 인증 + 스토리지)

### 영상 처리
- **FFmpeg.js**: 브라우저 내 영상 압축
- **Supabase Storage**: 클라우드 스토리지

## 📁 주요 파일 구조

```
baroedu-bk-04/
├── admin/
│   ├── courses.html          # 강좌 관리 페이지 (영상 업로드 기능 포함)
│   ├── js/
│   │   └── courses.js        # 강좌 관리 JavaScript
│   └── ...
├── setup-video-storage.js    # 영상 스토리지 설정 스크립트
├── add-video-column.js       # 데이터베이스 컬럼 추가 스크립트
├── create-tables.js          # 데이터베이스 테이블 생성
├── create-admin-account.js   # 관리자 계정 생성
└── ...
```

## 🚨 주의사항

### 영상 파일 제한
- 최대 파일 크기: 100MB
- 지원 형식: MP4, WebM, AVI, MOV
- 50MB 이상 파일은 자동 압축됩니다

### 브라우저 요구사항
- Chrome, Firefox, Safari, Edge 최신 버전
- JavaScript 활성화 필요
- WebAssembly 지원 필요 (FFmpeg.js 사용)

### 성능 최적화
- 영상 압축은 사용자 브라우저에서 실행됩니다
- 대용량 파일 처리 시 시간이 걸릴 수 있습니다
- 메모리 사용량이 높을 수 있으니 다른 탭을 닫아주세요

## 🆘 문제 해결

### 영상 업로드 실패 시
1. 파일 형식 확인 (MP4, WebM, AVI, MOV만 지원)
2. 파일 크기 확인 (100MB 이하)
3. 브라우저 새로고침 후 재시도
4. 개발자 도구 콘솔에서 에러 메시지 확인

### 압축 실패 시
- 브라우저 메모리 부족일 수 있음
- 다른 탭 닫기
- 브라우저 재시작
- 더 작은 파일로 시도

## 📞 지원

문제가 발생하면 다음 정보와 함께 문의하세요:
- 브라우저 종류 및 버전
- 업로드하려는 파일 정보 (크기, 형식)
- 개발자 도구 콘솔의 에러 메시지

---

© 2024 바로교육. All rights reserved.

