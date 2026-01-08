# Technical Specification
## Local Falcon 스타일 구글맵 순위 측정 앱

---

## 1. 시스템 아키텍처

```
┌─────────────────┐
│   Client        │
│  (Browser)      │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────────────────────────┐
│     Frontend (React + TS)           │
│  ┌──────────┬──────────┬─────────┐ │
│  │UrlInput  │ MapView  │RankGrid │ │
│  └──────────┴──────────┴─────────┘ │
└────────┬────────────────────────────┘
         │ REST API
         ▼
┌─────────────────────────────────────┐
│    Backend (FastAPI + Python)       │
│  ┌──────────────────────────────┐  │
│  │  API Routes                   │  │
│  ├──────────────────────────────┤  │
│  │  Services Layer              │  │
│  │  - RankService               │  │
│  │  - ComparisonService         │  │
│  ├──────────────────────────────┤  │
│  │  Scraper Layer               │  │
│  │  - GoogleMapsScraper         │  │
│  │  - GridGenerator             │  │
│  └──────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌─────┐  ┌────────┐
│PostgreSQL│ │Redis│  │Selenium│
│   DB    │ │Cache│  │Browser │
└─────────┘ └─────┘  └────────┘
```

---

## 2. 기술 스택 상세

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11+ | 코어 언어 |
| FastAPI | 0.104+ | REST API 프레임워크 |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.12+ | DB 마이그레이션 |
| Pydantic | 2.5+ | 데이터 검증 |
| Selenium | 4.15+ | 웹 스크래핑 |
| ChromeDriver | Latest | 브라우저 드라이버 |
| Celery | 5.3+ | 비동기 작업 큐 (옵션) |
| Redis | 7.2+ | 캐싱 & Celery 브로커 |
| pytest | 7.4+ | 테스트 프레임워크 |

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.2+ | UI 프레임워크 |
| TypeScript | 5.3+ | 타입 안전성 |
| Vite | 5.0+ | 빌드 도구 |
| Leaflet.js | 1.9+ | 지도 렌더링 |
| Leaflet.heat | 0.2+ | 히트맵 플러그인 |
| Chart.js | 4.4+ | 차트 시각화 |
| Axios | 1.6+ | HTTP 클라이언트 |
| TailwindCSS | 3.4+ | CSS 프레임워크 |

### 인프라
| 기술 | 버전 | 용도 |
|------|------|------|
| Docker | 24.0+ | 컨테이너화 |
| Docker Compose | 2.23+ | 멀티 컨테이너 오케스트레이션 |
| Nginx | 1.25+ | 리버스 프록시 |
| PostgreSQL | 16+ | 프로덕션 DB |

---

## 3. 데이터베이스 스키마

### 3.1 Business (비즈니스 정보)
```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    google_maps_url TEXT NOT NULL,
    place_id VARCHAR(255),
    category VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(google_maps_url)
);
```

### 3.2 RankSnapshot (순위 스냅샷)
```sql
CREATE TABLE rank_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_miles INTEGER NOT NULL,
    grid_size INTEGER NOT NULL, -- 3, 5, 7 등
    search_query TEXT NOT NULL,
    total_points INTEGER,
    completed_points INTEGER DEFAULT 0,
    average_rank DECIMAL(5, 2),
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_business_created (business_id, created_at DESC)
);
```

### 3.3 GridPoint (그리드 포인트별 순위)
```sql
CREATE TABLE grid_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID REFERENCES rank_snapshots(id) ON DELETE CASCADE,
    grid_row INTEGER NOT NULL,
    grid_col INTEGER NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    rank INTEGER, -- 1-20 또는 NULL (Not Found)
    found BOOLEAN DEFAULT FALSE,
    business_name_in_result VARCHAR(255),
    scraped_at TIMESTAMP,
    INDEX idx_snapshot_grid (snapshot_id, grid_row, grid_col)
);
```

### 3.4 Comparison (경쟁사 비교)
```sql
CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_miles INTEGER NOT NULL,
    grid_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comparison_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES comparisons(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES rank_snapshots(id),
    INDEX idx_comparison (comparison_id)
);
```

---

## 4. API 스펙

### 4.1 POST /api/scan
**요청**
```json
{
  "google_maps_url": "https://www.google.com/maps/place/...",
  "radius_miles": 5,
  "grid_size": 5,
  "search_query": "pizza restaurant" // optional, 기본값은 비즈니스 이름
}
```

**응답 (201 Created)**
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "business": {
    "id": "...",
    "name": "Joe's Pizza",
    "google_maps_url": "...",
    "place_id": "ChIJ..."
  },
  "grid_config": {
    "center_lat": 40.7589,
    "center_lng": -73.9851,
    "radius_miles": 5,
    "grid_size": 5,
    "total_points": 25
  },
  "estimated_duration_seconds": 125
}
```

### 4.2 GET /api/scan/{scan_id}
**응답 (200 OK)**
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": {
    "completed_points": 15,
    "total_points": 25,
    "percentage": 60
  },
  "started_at": "2026-01-09T00:00:00Z",
  "estimated_completion": "2026-01-09T00:02:05Z"
}
```

### 4.3 GET /api/results/{scan_id}
**응답 (200 OK)**
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "business": {
    "id": "...",
    "name": "Joe's Pizza"
  },
  "summary": {
    "average_rank": 3.5,
    "found_count": 22,
    "not_found_count": 3,
    "best_rank": 1,
    "worst_rank": 12
  },
  "grid_points": [
    {
      "row": 0,
      "col": 0,
      "lat": 40.7950,
      "lng": -73.9851,
      "rank": 3,
      "found": true
    },
    // ... 24 more points
  ],
  "completed_at": "2026-01-09T00:02:05Z"
}
```

### 4.4 POST /api/compare
**요청**
```json
{
  "business_urls": [
    "https://www.google.com/maps/place/...",
    "https://www.google.com/maps/place/..."
  ],
  "center_lat": 40.7589,
  "center_lng": -73.9851,
  "radius_miles": 5,
  "grid_size": 5
}
```

**응답 (201 Created)**
```json
{
  "comparison_id": "...",
  "businesses": [
    {
      "business_id": "...",
      "name": "Joe's Pizza",
      "scan_id": "..."
    },
    {
      "business_id": "...",
      "name": "Tony's Pizza",
      "scan_id": "..."
    }
  ],
  "status": "pending"
}
```

### 4.5 GET /api/compare/{comparison_id}
**응답 (200 OK)**
```json
{
  "comparison_id": "...",
  "status": "completed",
  "businesses": [
    {
      "name": "Joe's Pizza",
      "average_rank": 3.5,
      "found_count": 22,
      "color": "#FF5733"
    },
    {
      "name": "Tony's Pizza",
      "average_rank": 5.2,
      "found_count": 18,
      "color": "#3357FF"
    }
  ],
  "grid_comparison": [
    {
      "row": 0,
      "col": 0,
      "lat": 40.7950,
      "lng": -73.9851,
      "rankings": {
        "Joe's Pizza": 3,
        "Tony's Pizza": 5
      }
    }
    // ... more points
  ]
}
```

### 4.6 GET /api/export/{scan_id}?format={json|csv}
**응답 (200 OK)**
```
Content-Type: text/csv or application/json
Content-Disposition: attachment; filename="scan_{scan_id}.csv"
```

---

## 5. 핵심 알고리즘 상세

### 5.1 그리드 생성 (grid_generator.py)
```python
def generate_grid(center_lat: float, center_lng: float,
                  radius_miles: float, grid_size: int) -> List[Tuple[float, float]]:
    """
    중심 좌표 기준으로 그리드 포인트 생성

    Args:
        center_lat: 중심 위도
        center_lng: 중심 경도
        radius_miles: 반경 (마일)
        grid_size: 그리드 크기 (NxN)

    Returns:
        List of (lat, lng) tuples
    """
    MILES_TO_LAT_DEGREE = 0.014483  # 1 mile ≈ 0.014483 degrees latitude

    # 경도는 위도에 따라 달라짐
    lat_diff = radius_miles * MILES_TO_LAT_DEGREE
    lng_diff = radius_miles * MILES_TO_LAT_DEGREE / math.cos(math.radians(center_lat))

    # 그리드 간격 계산
    step_lat = (2 * lat_diff) / (grid_size - 1)
    step_lng = (2 * lng_diff) / (grid_size - 1)

    grid_points = []
    for row in range(grid_size):
        for col in range(grid_size):
            lat = center_lat - lat_diff + (row * step_lat)
            lng = center_lng - lng_diff + (col * step_lng)
            grid_points.append((lat, lng))

    return grid_points
```

### 5.2 순위 측정 (google_maps.py)
```python
async def check_rank(business_name: str, lat: float, lng: float,
                    search_query: str = None) -> Optional[int]:
    """
    특정 위치에서 비즈니스 검색 순위 확인

    Args:
        business_name: 찾을 비즈니스 이름
        lat: 검색 위도
        lng: 검색 경도
        search_query: 검색 쿼리 (기본값: business_name)

    Returns:
        순위 (1-20) 또는 None (Not Found)
    """
    query = search_query or business_name
    url = f"https://www.google.com/maps/search/{quote(query)}/@{lat},{lng},15z"

    driver = get_selenium_driver()
    driver.get(url)

    # 결과 로딩 대기 (최대 10초)
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='article']")))

    # 첫 20개 결과 추출
    results = driver.find_elements(By.CSS_SELECTOR, "div[role='article']")[:20]

    for rank, result in enumerate(results, start=1):
        try:
            name_element = result.find_element(By.CSS_SELECTOR, "div.fontHeadlineSmall")
            result_name = name_element.text.strip()

            # 퍼지 매칭 (90% 이상 유사도)
            similarity = fuzz.ratio(business_name.lower(), result_name.lower())
            if similarity >= 90:
                return rank
        except NoSuchElementException:
            continue

    return None  # Not Found
```

### 5.3 차단 회피 전략
```python
def get_selenium_driver() -> WebDriver:
    """Selenium WebDriver 설정 (차단 회피)"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    # User-Agent 로테이션
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
        # ... more user agents
    ]
    options.add_argument(f"user-agent={random.choice(user_agents)}")

    # WebDriver 감지 방지
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(options=options)

    # JavaScript로 webdriver 속성 제거
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    return driver
```

---

## 6. 성능 요구사항

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 단일 그리드 포인트 스캔 시간 | 2-5초 | 평균 응답 시간 |
| 5x5 그리드 전체 스캔 시간 | 2-3분 | 시작부터 완료까지 |
| API 응답 시간 (GET) | < 200ms | p95 레이턴시 |
| 동시 스캔 처리 | 10개 | Celery workers |
| 데이터베이스 쿼리 | < 100ms | 평균 쿼리 시간 |

### 최적화 전략
1. **비동기 스크래핑**: Celery로 백그라운드 작업 처리
2. **캐싱**: Redis로 중복 검색 결과 캐싱 (TTL: 1시간)
3. **Connection Pooling**: DB 연결 풀 크기 10-20
4. **Rate Limiting**: IP당 분당 10 요청

---

## 7. 보안 고려사항

### 7.1 입력 검증
- Google Maps URL 형식 검증 (정규식)
- SQL Injection 방지 (ORM 사용)
- XSS 방지 (입력 sanitization)
- CSRF 토큰 (프로덕션)

### 7.2 Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/scan")
@limiter.limit("10/minute")
async def create_scan(...):
    ...
```

### 7.3 인증/인가 (프로덕션)
- JWT 토큰 기반 인증
- API Key 발급 및 검증
- 사용자별 할당량 관리

### 7.4 스크래핑 윤리
- robots.txt 준수 고려
- 요청 간 딜레이 (2-5초)
- 교육/개인 목적만 명시

---

## 8. 에러 처리

### 8.1 HTTP 에러 코드
| 코드 | 상황 | 응답 |
|------|------|------|
| 400 | 잘못된 입력 | `{"error": "Invalid Google Maps URL"}` |
| 404 | 리소스 없음 | `{"error": "Scan not found"}` |
| 429 | Rate Limit 초과 | `{"error": "Too many requests", "retry_after": 60}` |
| 500 | 서버 오류 | `{"error": "Internal server error"}` |
| 503 | 서비스 과부하 | `{"error": "Service unavailable"}` |

### 8.2 스크래핑 에러 처리
```python
try:
    rank = await check_rank(business_name, lat, lng)
except TimeoutException:
    # 페이지 로딩 타임아웃
    log_error("Timeout", lat, lng)
    rank = None
except NoSuchElementException:
    # 요소를 찾을 수 없음
    log_error("Element not found", lat, lng)
    rank = None
except WebDriverException as e:
    # 브라우저 크래시 등
    log_error(f"WebDriver error: {e}", lat, lng)
    raise  # 재시도 가능
```

---

## 9. 배포 아키텍처

### 9.1 Docker Compose (개발/로컬)
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/localfalcon
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=localfalcon
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery_worker:
    build: ./backend
    command: celery -A app.worker worker --loglevel=info
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

### 9.2 프로덕션 환경 변수
```bash
# .env
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
SECRET_KEY=your-secret-key-here
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=10
SELENIUM_HEADLESS=true
```

---

## 10. 테스트 전략

### 10.1 단위 테스트
- `grid_generator.py`: 그리드 생성 정확도
- `google_maps.py`: URL 파싱, 순위 추출
- API 엔드포인트: 요청/응답 검증

### 10.2 통합 테스트
- E2E 스캔 플로우 (mock Selenium)
- DB 트랜잭션 테스트
- Celery 작업 큐 테스트

### 10.3 테스트 커버리지 목표
- 최소 80% 코드 커버리지
- 핵심 로직 100% 커버리지

---

## 11. 모니터링 및 로깅

### 11.1 로그 레벨
- DEBUG: 개발 환경 상세 로그
- INFO: 스캔 시작/완료, API 호출
- WARNING: Rate limit 근접, 재시도
- ERROR: 스크래핑 실패, DB 오류

### 11.2 메트릭 수집
- 스캔 성공률
- 평균 스캔 시간
- API 응답 시간
- 에러 발생 빈도

---

## 12. 향후 확장 가능성

1. **다중 검색 엔진 지원**: Bing Maps, Apple Maps
2. **모바일 앱**: React Native 포트
3. **실시간 알림**: WebSocket으로 순위 변화 알림
4. **AI 인사이트**: 순위 예측, 최적화 제안
5. **화이트라벨**: 에이전시용 커스터마이징
6. **API 공개**: 외부 개발자용 API 제공

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-01-09 | 초기 기술 사양 작성 |
