# Local Falcon 스타일 구글맵 순위 측정 앱 구현 계획

## 프로젝트 개요
Google Maps URL을 입력받아 특정 위치를 중심으로 그리드 방식으로 여러 지점에서 검색 순위를 측정하고, 히트맵으로 시각화하며, 경쟁사와 비교할 수 있는 웹 애플리케이션

## 기술 스택
- **백엔드**: Python + FastAPI
- **프론트엔드**: React + TypeScript
- **스크래핑**: Selenium (무료)
- **데이터베이스**: SQLite (초기), PostgreSQL (프로덕션)
- **지도 시각화**: Leaflet.js + OpenStreetMap (무료 대안)
- **배포**: Docker

## 아키텍처

### 디렉토리 구조
```
크롤러/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 앱 엔트리포인트
│   │   ├── models.py            # 데이터베이스 모델
│   │   ├── schemas.py           # Pydantic 스키마
│   │   ├── database.py          # DB 연결 설정
│   │   ├── scraper/
│   │   │   ├── __init__.py
│   │   │   ├── google_maps.py   # Google Maps 스크래퍼
│   │   │   └── grid_generator.py # 그리드 좌표 생성
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── rank_service.py  # 순위 측정 로직
│   │   │   └── comparison.py    # 경쟁사 비교 로직
│   │   └── api/
│   │       ├── __init__.py
│   │       └── routes.py        # API 엔드포인트
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.tsx      # 지도 + 히트맵
│   │   │   ├── UrlInput.tsx     # URL 입력 폼
│   │   │   ├── RankGrid.tsx     # 순위 그리드 표시
│   │   │   └── ComparisonChart.tsx # 경쟁사 비교 차트
│   │   ├── services/
│   │   │   └── api.ts           # 백엔드 API 호출
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── plan.md                       # 이 파일
└── README.md
```

## 개발 체크리스트 (Development Checklist)

### Phase 0: 프로젝트 초기 설정
- [ ] 0.1 프로젝트 디렉토리 구조 생성
- [ ] 0.2 Git 저장소 초기화
- [ ] 0.3 .gitignore 파일 생성
- [ ] 0.4 README.md 초안 작성

### Phase 1: 백엔드 기본 구조

#### 1.1 FastAPI 프로젝트 초기화
- [ ] 1.1.1 `backend/` 디렉토리 생성
- [ ] 1.1.2 `backend/app/` 디렉토리 생성
- [ ] 1.1.3 Python 가상환경 생성 (venv)
- [ ] 1.1.4 `requirements.txt` 작성 (FastAPI, SQLAlchemy, Pydantic, etc.)
- [ ] 1.1.5 패키지 설치 (`pip install -r requirements.txt`)
- [ ] 1.1.6 `backend/app/__init__.py` 생성
- [ ] 1.1.7 `backend/app/main.py` 생성 (FastAPI 앱 초기화)
- [ ] 1.1.8 CORS 미들웨어 설정
- [ ] 1.1.9 Health check 엔드포인트 추가 (`GET /health`)
- [ ] 1.1.10 FastAPI 서버 실행 테스트 (`uvicorn app.main:app --reload`)

#### 1.2 데이터베이스 설정
- [ ] 1.2.1 `backend/app/database.py` 생성 (SQLAlchemy 엔진 설정)
- [ ] 1.2.2 SQLite DB 파일 경로 설정
- [ ] 1.2.3 Base 모델 클래스 정의
- [ ] 1.2.4 DB 세션 의존성 함수 작성

#### 1.3 데이터베이스 모델 정의
- [ ] 1.3.1 `backend/app/models.py` 생성
- [ ] 1.3.2 `Business` 모델 정의
  - [ ] 1.3.2.1 id (UUID, PK)
  - [ ] 1.3.2.2 name (String)
  - [ ] 1.3.2.3 google_maps_url (Text)
  - [ ] 1.3.2.4 place_id (String, nullable)
  - [ ] 1.3.2.5 address (Text, nullable)
  - [ ] 1.3.2.6 created_at, updated_at (DateTime)
- [ ] 1.3.3 `RankSnapshot` 모델 정의
  - [ ] 1.3.3.1 id (UUID, PK)
  - [ ] 1.3.3.2 business_id (FK → Business)
  - [ ] 1.3.3.3 status (Enum: pending, processing, completed, failed)
  - [ ] 1.3.3.4 center_lat, center_lng (Decimal)
  - [ ] 1.3.3.5 radius_miles (Integer)
  - [ ] 1.3.3.6 grid_size (Integer)
  - [ ] 1.3.3.7 average_rank (Decimal, nullable)
  - [ ] 1.3.3.8 timestamps
- [ ] 1.3.4 `GridPoint` 모델 정의
  - [ ] 1.3.4.1 id (UUID, PK)
  - [ ] 1.3.4.2 snapshot_id (FK → RankSnapshot)
  - [ ] 1.3.4.3 grid_row, grid_col (Integer)
  - [ ] 1.3.4.4 lat, lng (Decimal)
  - [ ] 1.3.4.5 rank (Integer, nullable)
  - [ ] 1.3.4.6 found (Boolean)
- [ ] 1.3.5 DB 테이블 자동 생성 (create_all)

#### 1.4 Pydantic 스키마 정의
- [ ] 1.4.1 `backend/app/schemas.py` 생성
- [ ] 1.4.2 `BusinessCreate` 스키마
- [ ] 1.4.3 `BusinessResponse` 스키마
- [ ] 1.4.4 `ScanCreate` 스키마
- [ ] 1.4.5 `ScanResponse` 스키마
- [ ] 1.4.6 `ScanProgress` 스키마
- [ ] 1.4.7 `ScanResults` 스키마
- [ ] 1.4.8 `GridPointResponse` 스키마

#### 1.5 API 엔드포인트 구현
- [ ] 1.5.1 `backend/app/api/` 디렉토리 생성
- [ ] 1.5.2 `backend/app/api/routes.py` 생성
- [ ] 1.5.3 `POST /api/scan` 엔드포인트
  - [ ] 1.5.3.1 요청 검증 (Pydantic)
  - [ ] 1.5.3.2 Business 레코드 생성/조회
  - [ ] 1.5.3.3 RankSnapshot 생성 (status=pending)
  - [ ] 1.5.3.4 응답 반환 (scan_id)
- [ ] 1.5.4 `GET /api/scan/{scan_id}` 엔드포인트
  - [ ] 1.5.4.1 스캔 상태 조회
  - [ ] 1.5.4.2 진행률 계산 (completed_points / total_points)
  - [ ] 1.5.4.3 응답 반환
- [ ] 1.5.5 `GET /api/results/{scan_id}` 엔드포인트
  - [ ] 1.5.5.1 스캔 완료 확인
  - [ ] 1.5.5.2 GridPoint 데이터 조회
  - [ ] 1.5.5.3 요약 통계 계산
  - [ ] 1.5.5.4 응답 반환
- [ ] 1.5.6 라우터 등록 (main.py에 include_router)

### Phase 2: Google Maps 스크래퍼

#### 2.1 Selenium 설정
- [ ] 2.1.1 `backend/app/scraper/` 디렉토리 생성
- [ ] 2.1.2 ChromeDriver 설치 (자동 또는 수동)
- [ ] 2.1.3 `backend/app/scraper/driver.py` 생성
- [ ] 2.1.4 WebDriver 초기화 함수 작성
  - [ ] 2.1.4.1 Headless 모드 옵션
  - [ ] 2.1.4.2 User-Agent 설정
  - [ ] 2.1.4.3 WebDriver 감지 방지
- [ ] 2.1.5 User-Agent 로테이션 구현
- [ ] 2.1.6 WebDriver 테스트 (Google.com 접속)

#### 2.2 Google Maps URL 파싱
- [ ] 2.2.1 `backend/app/scraper/url_parser.py` 생성
- [ ] 2.2.2 URL 정규식 검증 함수
- [ ] 2.2.3 비즈니스 이름 추출 함수
- [ ] 2.2.4 좌표 추출 함수 (lat, lng)
- [ ] 2.2.5 Place ID 추출 함수
- [ ] 2.2.6 단위 테스트 작성 (pytest)

#### 2.3 그리드 생성 로직
- [ ] 2.3.1 `backend/app/scraper/grid_generator.py` 생성
- [ ] 2.3.2 마일 → 위도/경도 변환 상수 정의
- [ ] 2.3.3 `generate_grid()` 함수 구현
  - [ ] 2.3.3.1 중심 좌표 입력 받기
  - [ ] 2.3.3.2 반경(마일) 입력 받기
  - [ ] 2.3.3.3 그리드 크기(NxN) 입력 받기
  - [ ] 2.3.3.4 위도/경도 범위 계산
  - [ ] 2.3.3.5 균등 간격 포인트 생성
  - [ ] 2.3.3.6 좌표 리스트 반환
- [ ] 2.3.4 단위 테스트 작성

#### 2.4 순위 측정 로직
- [ ] 2.4.1 `backend/app/scraper/google_maps.py` 생성
- [ ] 2.4.2 `search_google_maps()` 함수 구현
  - [ ] 2.4.2.1 검색 URL 생성
  - [ ] 2.4.2.2 Selenium으로 페이지 로드
  - [ ] 2.4.2.3 결과 로딩 대기 (WebDriverWait)
  - [ ] 2.4.2.4 검색 결과 요소 추출 (첫 20개)
- [ ] 2.4.3 `extract_business_names()` 함수 구현
- [ ] 2.4.4 `find_rank()` 함수 구현
  - [ ] 2.4.4.1 비즈니스 이름 매칭 (퍼지 매칭)
  - [ ] 2.4.4.2 순위 반환 (1-20 또는 None)
- [ ] 2.4.5 에러 처리 (TimeoutException, NoSuchElementException)
- [ ] 2.4.6 딜레이 추가 (2-5초)
- [ ] 2.4.7 통합 테스트 작성

#### 2.5 순위 측정 서비스
- [ ] 2.5.1 `backend/app/services/` 디렉토리 생성
- [ ] 2.5.2 `backend/app/services/rank_service.py` 생성
- [ ] 2.5.3 `scan_business()` 함수 구현
  - [ ] 2.5.3.1 RankSnapshot 조회
  - [ ] 2.5.3.2 status를 'processing'으로 업데이트
  - [ ] 2.5.3.3 그리드 생성
  - [ ] 2.5.3.4 각 포인트 순위 측정 (루프)
  - [ ] 2.5.3.5 GridPoint 레코드 생성
  - [ ] 2.5.3.6 진행률 업데이트
  - [ ] 2.5.3.7 평균 순위 계산
  - [ ] 2.5.3.8 status를 'completed'로 업데이트
- [ ] 2.5.4 에러 시 status를 'failed'로 업데이트

#### 2.6 백그라운드 작업 설정
- [ ] 2.6.1 비동기 처리 방식 선택 (Celery 또는 asyncio)
- [ ] 2.6.2 Celery 설정 (선택 시)
  - [ ] 2.6.2.1 Redis 설치
  - [ ] 2.6.2.2 Celery app 초기화
  - [ ] 2.6.2.3 Task 함수 정의
  - [ ] 2.6.2.4 Worker 실행 테스트
- [ ] 2.6.3 또는 asyncio Background Tasks 구현
- [ ] 2.6.4 `POST /api/scan` 엔드포인트에서 백그라운드 작업 시작

### Phase 3: 프론트엔드 UI

#### 3.1 React 프로젝트 초기화
- [ ] 3.1.1 `frontend/` 디렉토리로 이동
- [ ] 3.1.2 Vite로 React + TypeScript 프로젝트 생성
- [ ] 3.1.3 `package.json` 확인
- [ ] 3.1.4 Tailwind CSS 설치 및 설정
- [ ] 3.1.5 필요한 패키지 설치
  - [ ] 3.1.5.1 axios
  - [ ] 3.1.5.2 react-leaflet
  - [ ] 3.1.5.3 leaflet
  - [ ] 3.1.5.4 leaflet.heat
  - [ ] 3.1.5.5 chart.js, react-chartjs-2
- [ ] 3.1.6 개발 서버 실행 테스트 (`npm run dev`)

#### 3.2 프로젝트 구조 설정
- [ ] 3.2.1 `src/components/` 디렉토리 생성
- [ ] 3.2.2 `src/services/` 디렉토리 생성
- [ ] 3.2.3 `src/types/` 디렉토리 생성
- [ ] 3.2.4 `src/utils/` 디렉토리 생성

#### 3.3 TypeScript 타입 정의
- [ ] 3.3.1 `src/types/index.ts` 생성
- [ ] 3.3.2 `Business` 타입 정의
- [ ] 3.3.3 `ScanConfig` 타입 정의
- [ ] 3.3.4 `ScanProgress` 타입 정의
- [ ] 3.3.5 `ScanResults` 타입 정의
- [ ] 3.3.6 `GridPoint` 타입 정의

#### 3.4 API 서비스 레이어
- [ ] 3.4.1 `src/services/api.ts` 생성
- [ ] 3.4.2 axios 인스턴스 설정 (baseURL)
- [ ] 3.4.3 `createScan()` 함수
- [ ] 3.4.4 `getScanProgress()` 함수
- [ ] 3.4.5 `getScanResults()` 함수
- [ ] 3.4.6 에러 핸들링 인터셉터

#### 3.5 UrlInput 컴포넌트
- [ ] 3.5.1 `src/components/UrlInput.tsx` 생성
- [ ] 3.5.2 입력 폼 UI 구현
- [ ] 3.5.3 URL 검증 로직
- [ ] 3.5.4 에러 메시지 표시
- [ ] 3.5.5 "다음 단계" 버튼
- [ ] 3.5.6 스타일링 (Tailwind)

#### 3.6 ScanConfig 컴포넌트
- [ ] 3.6.1 `src/components/ScanConfig.tsx` 생성
- [ ] 3.6.2 중심 좌표 입력 필드
- [ ] 3.6.3 반경 슬라이더 (1-10 마일)
- [ ] 3.6.4 그리드 크기 선택 (3x3, 5x5, 7x7)
- [ ] 3.6.5 예상 소요 시간 표시
- [ ] 3.6.6 지도 미리보기 (Leaflet)
- [ ] 3.6.7 "스캔 시작" 버튼

#### 3.7 ScanProgress 컴포넌트
- [ ] 3.7.1 `src/components/ScanProgress.tsx` 생성
- [ ] 3.7.2 진행률 바 (progress bar)
- [ ] 3.7.3 진행 상태 텍스트 (15/25 완료)
- [ ] 3.7.4 폴링 로직 구현 (1초마다 API 호출)
- [ ] 3.7.5 완료 시 결과 화면으로 이동

#### 3.8 MapView 컴포넌트 (히트맵)
- [ ] 3.8.1 `src/components/MapView.tsx` 생성
- [ ] 3.8.2 Leaflet 지도 초기화
- [ ] 3.8.3 OpenStreetMap 타일 레이어
- [ ] 3.8.4 히트맵 데이터 변환 (순위 → 색상)
- [ ] 3.8.5 히트맵 오버레이 추가
- [ ] 3.8.6 색상 범례 표시
- [ ] 3.8.7 마커 클릭 시 상세 정보 툴팁

#### 3.9 RankGrid 컴포넌트
- [ ] 3.9.1 `src/components/RankGrid.tsx` 생성
- [ ] 3.9.2 테이블 UI (25개 포인트)
- [ ] 3.9.3 순위별 색상 표시
- [ ] 3.9.4 정렬 기능 (순위, 위치)
- [ ] 3.9.5 필터 기능 (순위 범위)

#### 3.10 Summary 컴포넌트
- [ ] 3.10.1 `src/components/Summary.tsx` 생성
- [ ] 3.10.2 평균 순위 표시
- [ ] 3.10.3 최고/최저 순위
- [ ] 3.10.4 순위권 내 비율
- [ ] 3.10.5 색상 인디케이터

#### 3.11 메인 App 통합
- [ ] 3.11.1 `src/App.tsx` 수정
- [ ] 3.11.2 라우팅 설정 (React Router 또는 단계별 State)
- [ ] 3.11.3 전역 State 관리 (useState 또는 Context)
- [ ] 3.11.4 컴포넌트 순서대로 렌더링
- [ ] 3.11.5 에러 바운더리 추가

### Phase 4: 보고서 생성 기능

#### 4.1 백엔드 - PDF 생성
- [ ] 4.1.1 PDF 라이브러리 설치 (WeasyPrint 또는 reportlab)
- [ ] 4.1.2 `backend/app/services/report_service.py` 생성
- [ ] 4.1.3 보고서 템플릿 설계 (HTML/CSS)
- [ ] 4.1.4 `generate_report()` 함수 구현
  - [ ] 4.1.4.1 스캔 데이터 조회
  - [ ] 4.1.4.2 히트맵 이미지 생성
  - [ ] 4.1.4.3 차트 이미지 생성
  - [ ] 4.1.4.4 HTML 템플릿 렌더링
  - [ ] 4.1.4.5 PDF 변환
  - [ ] 4.1.4.6 파일 저장
- [ ] 4.1.5 `POST /api/report/{scan_id}` 엔드포인트
- [ ] 4.1.6 `GET /api/report/{scan_id}/download` 엔드포인트

#### 4.2 프론트엔드 - 보고서 UI
- [ ] 4.2.1 `src/components/ReportConfig.tsx` 생성
- [ ] 4.2.2 고객 정보 입력 폼
- [ ] 4.2.3 로고 업로드 기능
- [ ] 4.2.4 템플릿 선택 (전문가/간편)
- [ ] 4.2.5 "보고서 생성" 버튼
- [ ] 4.2.6 미리보기 기능

#### 4.3 보고서 전송 기능
- [ ] 4.3.1 이메일 전송 구현
  - [ ] 4.3.1.1 SMTP 설정
  - [ ] 4.3.1.2 이메일 템플릿
  - [ ] 4.3.1.3 첨부 파일 추가
  - [ ] 4.3.1.4 전송 함수
- [ ] 4.3.2 SMS 전송 구현 (Twilio)
  - [ ] 4.3.2.1 API 키 설정
  - [ ] 4.3.2.2 짧은 URL 생성
  - [ ] 4.3.2.3 SMS 발송
- [ ] 4.3.3 웹훅 전송 구현
  - [ ] 4.3.3.1 HTTP POST 요청
  - [ ] 4.3.3.2 재시도 로직
- [ ] 4.3.4 `POST /api/send` 엔드포인트
- [ ] 4.3.5 전송 상태 추적

### Phase 5: 경쟁사 비교 기능

#### 5.1 백엔드 - 비교 로직
- [ ] 5.1.1 `backend/app/models.py`에 Comparison 모델 추가
- [ ] 5.1.2 `backend/app/services/comparison.py` 생성
- [ ] 5.1.3 `compare_businesses()` 함수 구현
- [ ] 5.1.4 `POST /api/compare` 엔드포인트
- [ ] 5.1.5 `GET /api/compare/{comparison_id}` 엔드포인트

#### 5.2 프론트엔드 - 비교 UI
- [ ] 5.2.1 `src/components/CompetitorInput.tsx` 생성
- [ ] 5.2.2 경쟁사 URL 추가 폼 (최대 5개)
- [ ] 5.2.3 `src/components/ComparisonChart.tsx` 생성
- [ ] 5.2.4 Chart.js로 비교 차트 구현
- [ ] 5.2.5 색상 구분 (각 비즈니스별)

### Phase 6: 배포

#### 6.1 Docker 설정
- [ ] 6.1.1 `backend/Dockerfile` 작성
- [ ] 6.1.2 `frontend/Dockerfile` 작성
- [ ] 6.1.3 `docker-compose.yml` 작성
  - [ ] 6.1.3.1 backend 서비스
  - [ ] 6.1.3.2 frontend 서비스
  - [ ] 6.1.3.3 PostgreSQL 서비스 (프로덕션)
  - [ ] 6.1.3.4 Redis 서비스
- [ ] 6.1.4 `.dockerignore` 파일 작성
- [ ] 6.1.5 Docker 빌드 테스트
- [ ] 6.1.6 Docker Compose로 전체 스택 실행 테스트

#### 6.2 환경 변수 설정
- [ ] 6.2.1 `backend/.env.example` 작성
- [ ] 6.2.2 `.env` 파일 생성 (로컬)
- [ ] 6.2.3 환경 변수 로딩 로직 (python-dotenv)

#### 6.3 문서화
- [ ] 6.3.1 `README.md` 완성
  - [ ] 6.3.1.1 프로젝트 소개
  - [ ] 6.3.1.2 기능 목록
  - [ ] 6.3.1.3 설치 방법
  - [ ] 6.3.1.4 실행 방법
  - [ ] 6.3.1.5 환경 변수 설명
  - [ ] 6.3.1.6 API 문서 링크
- [ ] 6.3.2 API 문서 자동 생성 확인 (FastAPI Swagger)
- [ ] 6.3.3 아키텍처 다이어그램 추가

### Phase 7: 최종 테스트 및 최적화

- [ ] 7.1 E2E 테스트 작성 (Playwright)
- [ ] 7.2 성능 테스트
- [ ] 7.3 보안 점검
- [ ] 7.4 에러 핸들링 개선
- [ ] 7.5 로깅 추가
- [ ] 7.6 캐싱 최적화 (Redis)
- [ ] 7.7 Rate Limiting 추가

## 핵심 알고리즘

### 그리드 생성 알고리즘
```
입력: 중심 좌표 (lat, lng), 반경 (miles), 그리드 크기 (NxN)

1. 반경을 위도/경도 차이로 변환
   - 1마일 ≈ 0.014483 도 (위도)
   - 1마일 ≈ 0.014483 / cos(lat) 도 (경도)

2. 그리드 생성
   - 각 행/열에 대해 균등 간격으로 포인트 배치
   - 예: 5x5 그리드, 5마일 반경
     - 각 포인트 간 거리: 2.5마일

3. 출력: [(lat, lng), ...] 좌표 리스트
```

### 순위 측정 알고리즘
```
입력: 비즈니스 이름, 검색 위치 (lat, lng)

1. Google Maps에서 검색
   - URL: https://www.google.com/maps/search/{business_name}/@{lat},{lng},15z

2. 검색 결과 파싱
   - 첫 20개 결과의 이름 추출
   - 타겟 비즈니스와 정확히 일치하는지 확인

3. 순위 결정
   - 일치하면: 순위 반환 (1-20)
   - 일치하지 않으면: None 또는 "Not Found"
```

## 고려 사항

### 기술적 제약
1. **스크래핑 제한**
   - Google은 과도한 자동화를 차단할 수 있음
   - 해결책: 요청 간 딜레이 (2-5초), User-Agent 로테이션, 프록시 사용

2. **정확도**
   - Google Maps 결과는 사용자 위치, 검색 히스토리에 영향받음
   - 해결책: 시크릿 모드, 쿠키 삭제

3. **성능**
   - 25개 포인트 스캔 시 최소 50-125초 소요 (딜레이 포함)
   - 해결책: 비동기 처리, 진행 상황 표시

### 법적 고려사항
- Google Maps ToS는 자동화된 스크래핑을 금지할 수 있음
- 개인/교육 목적으로만 사용 권장
- 상업적 사용 시 Google Places API 고려

## 성공 기준
- [ ] Google Maps URL 입력하면 순위 측정 시작
- [ ] 5x5 그리드 (25개 포인트)에서 순위 측정
- [ ] 히트맵으로 결과 시각화
- [ ] 2개 이상 비즈니스 동시 비교 가능
- [ ] 결과를 JSON/CSV로 다운로드 가능

## 다음 단계
1. 백엔드 디렉토리 구조 생성
2. FastAPI 프로젝트 초기화
3. Selenium 설정 및 기본 Google Maps 스크래퍼 구현
4. 간단한 API 엔드포인트로 테스트
