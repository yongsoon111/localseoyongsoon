# Local SEO Rank Tracker - Backend

Google Maps 순위 측정 도구의 FastAPI 백엔드

## 기술 스택

- **FastAPI**: 고성능 비동기 웹 프레임워크
- **Supabase**: PostgreSQL 기반 클라우드 데이터베이스
- **Pydantic**: 데이터 검증 및 스키마 정의
- **Python 3.11+**

## 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py           # 패키지 초기화
│   ├── main.py               # FastAPI 앱 엔트리포인트
│   ├── database.py           # Supabase 연결
│   ├── models.py             # Pydantic 데이터 모델
│   ├── schemas.py            # API 요청/응답 스키마
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py         # API 엔드포인트
│   ├── scraper/              # Phase 2에서 구현
│   └── services/             # Phase 2에서 구현
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 http://localhost:8000 에서 실행됩니다.

## API 문서

서버 실행 후:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API 엔드포인트

### Health Check

```http
GET /health
```

서버 및 DB 연결 상태 확인

### 스캔 생성

```http
POST /api/scan
Content-Type: application/json

{
  "google_maps_url": "https://www.google.com/maps/place/...",
  "center_lat": 40.7589,
  "center_lng": -73.9851,
  "radius_miles": 3,
  "grid_size": 5,
  "search_query": "pizza restaurant"
}
```

응답:
```json
{
  "scan_id": "uuid",
  "business_id": "uuid",
  "status": "pending",
  "message": "Scan created successfully. Total points: 25"
}
```

### 스캔 진행 상황 조회

```http
GET /api/scan/{scan_id}
```

응답:
```json
{
  "scan_id": "uuid",
  "business_name": "Pizza Shop",
  "status": "processing",
  "total_points": 25,
  "completed_points": 10,
  "progress_percentage": 40.0,
  "average_rank": 5.5,
  "started_at": "2024-01-09T12:00:00Z",
  "estimated_completion": null
}
```

### 스캔 결과 조회

```http
GET /api/results/{scan_id}
```

응답:
```json
{
  "scan_id": "uuid",
  "business_name": "Pizza Shop",
  "status": "completed",
  "search_query": "pizza restaurant",
  "center_lat": 40.7589,
  "center_lng": -73.9851,
  "radius_miles": 3,
  "grid_size": 5,
  "summary": {
    "average_rank": 5.5,
    "best_rank": 1,
    "worst_rank": 15,
    "found_count": 20,
    "not_found_count": 5,
    "total_points": 25
  },
  "grid_points": [
    {
      "grid_row": 0,
      "grid_col": 0,
      "lat": 40.7589,
      "lng": -73.9851,
      "rank": 3,
      "found": true,
      "business_name_in_result": "Pizza Shop"
    }
  ],
  "started_at": "2024-01-09T12:00:00Z",
  "completed_at": "2024-01-09T12:15:00Z"
}
```

## 개발 가이드

### 함수 작성 규칙

- 각 함수는 **50줄 이하**로 작성
- 단일 책임 원칙 준수
- 타입 힌트 필수
- Docstring 작성

### 테스트 (Phase 2에서 구현)

```bash
pytest tests/
```

### 코드 포맷팅

```bash
# Black (추후 추가)
black app/

# isort (추후 추가)
isort app/
```

## Supabase 데이터베이스

데이터베이스 스키마는 `database_schema.md` 참고

### 테이블 구조

1. **businesses**: 비즈니스 정보
2. **rank_snapshots**: 순위 스냅샷
3. **grid_points**: 그리드 포인트별 순위 데이터

### 연결 테스트

```python
from app.database import check_connection

if check_connection():
    print("Database connected!")
```

## Phase 1 완료 체크리스트

- [x] FastAPI 프로젝트 초기화
- [x] Supabase 연결 설정
- [x] Pydantic 모델 정의 (Business, RankSnapshot, GridPoint)
- [x] API 스키마 정의
- [x] API 엔드포인트 구현
  - [x] POST /api/scan
  - [x] GET /api/scan/{id}
  - [x] GET /api/results/{id}
- [x] CORS 설정
- [x] Health check 엔드포인트

## Phase 2 (다음 단계)

- [ ] Selenium 스크래퍼 구현
- [ ] 그리드 생성 로직
- [ ] 순위 측정 로직
- [ ] 백그라운드 작업 (Celery 또는 asyncio)

## 문제 해결

### Supabase 연결 오류

1. `.env` 파일의 `SUPABASE_URL`과 `SUPABASE_SERVICE_KEY` 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 확인

### CORS 오류

`ALLOWED_ORIGINS` 환경 변수에 프론트엔드 URL 추가

## 라이선스

MIT
