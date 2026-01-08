# Phase 2 사용 예시

## 설치

```bash
cd backend
pip install -r requirements.txt
```

## 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 사용 예시

### 1. 스캔 생성

```bash
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{
    "google_maps_url": "https://www.google.com/maps/place/Joe'\''s+Pizza/@40.7300,-73.9950,15z",
    "center_lat": 40.7300,
    "center_lng": -73.9950,
    "radius_miles": 3,
    "grid_size": 5,
    "search_query": "pizza restaurant"
  }'
```

**응답:**
```json
{
  "scan_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_id": "987fcdeb-51a2-43f7-9876-543210987654",
  "status": "pending",
  "message": "Scan started. Total points: 25"
}
```

### 2. 진행 상황 확인

```bash
curl http://localhost:8000/scan/123e4567-e89b-12d3-a456-426614174000
```

**응답:**
```json
{
  "scan_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_name": "Joe's Pizza",
  "status": "in_progress",
  "total_points": 25,
  "completed_points": 12,
  "progress_percentage": 48.0,
  "average_rank": 3.5,
  "started_at": "2026-01-09T10:30:00Z",
  "estimated_completion": null
}
```

### 3. 결과 조회

```bash
curl http://localhost:8000/results/123e4567-e89b-12d3-a456-426614174000
```

**응답:**
```json
{
  "scan_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_name": "Joe's Pizza",
  "status": "completed",
  "search_query": "pizza restaurant",
  "center_lat": 40.7300,
  "center_lng": -73.9950,
  "radius_miles": 3,
  "grid_size": 5,
  "summary": {
    "average_rank": 3.2,
    "best_rank": 1,
    "worst_rank": 8,
    "found_count": 23,
    "not_found_count": 2,
    "total_points": 25
  },
  "grid_points": [
    {
      "grid_row": 0,
      "grid_col": 0,
      "lat": 40.7733,
      "lng": -74.0383,
      "rank": 2,
      "found": true,
      "business_name_in_result": "Joe's Pizza"
    },
    ...
  ],
  "started_at": "2026-01-09T10:30:00Z",
  "completed_at": "2026-01-09T10:35:00Z"
}
```

## 코드 사용 예시

### URL 파싱

```python
from app.scraper import parse_google_maps_url

url = "https://www.google.com/maps/place/Joe's+Pizza/@40.7300,-73.9950,15z"
result = parse_google_maps_url(url)

print(result)
# {
#   "business_name": "Joe's Pizza",
#   "lat": "40.7300",
#   "lng": "-73.9950",
#   "place_id": "..."
# }
```

### 그리드 생성

```python
from app.scraper import generate_grid

grid_points = generate_grid(
    center_lat=40.7300,
    center_lng=-73.9950,
    radius_miles=3,
    grid_size=5
)

print(f"Total points: {len(grid_points)}")  # 25
print(grid_points[0])
# {
#   "lat": 40.7733,
#   "lng": -74.0383,
#   "row": 0,
#   "col": 0
# }
```

### WebDriver 생성

```python
from app.scraper import create_driver, close_driver

# Headless 모드
driver = create_driver(headless=True)

try:
    driver.get("https://www.google.com/maps")
    # ... 스크래핑 작업
finally:
    close_driver(driver)
```

### 순위 찾기 (퍼지 매칭)

```python
from app.scraper import find_rank

target = "Joe's Pizza"
results = [
    "Pizza Hut",
    "Joe's Pizzeria",  # 유사한 이름
    "Domino's Pizza",
]

rank_info = find_rank(target, results, threshold=80)

print(rank_info)
# {
#   "rank": 2,
#   "matched_name": "Joe's Pizzeria"
# }
```

## 주요 함수 목록

### Scraper 모듈

#### driver.py
- `create_driver(headless=True)`: WebDriver 생성
- `close_driver(driver)`: WebDriver 종료

#### url_parser.py
- `parse_google_maps_url(url)`: URL 파싱

#### grid_generator.py
- `generate_grid(center_lat, center_lng, radius_miles, grid_size)`: 그리드 생성

#### google_maps.py
- `search_google_maps(driver, query, lat, lng)`: 검색 실행
- `extract_business_names(driver)`: 검색 결과 추출
- `find_rank(target, business_list, threshold=80)`: 순위 찾기

### Services 모듈

#### rank_service.py
- `scan_business(scan_id)`: 전체 스캔 실행 (백그라운드)

## 환경 변수

`.env` 파일 설정:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# 개발 모드
DEBUG=true
```

## 다음 단계

1. **Phase 3**: 실제 Google Maps DOM 구조 분석
2. **Phase 4**: 에러 핸들링 및 재시도 로직
3. **Phase 5**: 테스트 작성
4. **Phase 6**: 프론트엔드 통합

## 참고

- 현재 `google_maps.py`의 셀렉터는 샘플입니다
- 실제 DOM 구조 분석 후 수정 필요: `div[role='feed'] a[aria-label]`
- ChromeDriver는 자동으로 다운로드됩니다
