# Testing Checklist
## Local SEO 순위 분석 도구 테스트 가이드

---

## 테스트 전략

### 테스트 레벨
1. **단위 테스트** (Unit Tests) - pytest
2. **API 통합 테스트** (API Integration Tests) - pytest + httpx
3. **E2E 테스트** (End-to-End Tests) - Playwright
4. **수동 테스트** (Manual Tests) - 체크리스트

### 테스트 실행 순서
```
단위 테스트 (빠름) → API 테스트 (중간) → E2E 테스트 (느림) → 수동 테스트
```

---

## Phase 0: 프로젝트 초기 설정

### 수동 테스트
- [ ] 0.1 디렉토리 구조가 올바르게 생성되었는지 확인
  ```bash
  ls -la
  # backend/, frontend/ 디렉토리 존재 확인
  ```
- [ ] 0.2 Git 저장소 초기화 확인
  ```bash
  git status
  # .git 디렉토리 존재 확인
  ```
- [ ] 0.3 .gitignore 파일 내용 확인
  - __pycache__, .venv, node_modules, .env 포함 여부
- [ ] 0.4 README.md 파일 읽기 테스트

---

## Phase 1: 백엔드 기본 구조

### 1.1 FastAPI 프로젝트 초기화

#### 단위 테스트
```python
# tests/test_main.py
def test_app_creation():
    """FastAPI 앱이 생성되는지 테스트"""
    from app.main import app
    assert app is not None
    assert app.title == "Local SEO Rank Tracker"
```

#### API 테스트
- [ ] 1.1.1 Health check 엔드포인트 테스트
  ```python
  # tests/test_api.py
  def test_health_check(client):
      response = client.get("/health")
      assert response.status_code == 200
      assert response.json() == {"status": "ok"}
  ```

#### 수동 테스트
- [ ] 1.1.2 서버 실행 확인
  ```bash
  cd backend
  uvicorn app.main:app --reload
  # http://localhost:8000 접속
  # http://localhost:8000/docs 확인 (Swagger UI)
  ```

### 1.2 데이터베이스 설정

#### 단위 테스트
- [ ] 1.2.1 데이터베이스 연결 테스트
  ```python
  # tests/test_database.py
  def test_database_connection():
      from app.database import engine
      connection = engine.connect()
      assert connection is not None
      connection.close()
  ```

- [ ] 1.2.2 세션 생성 테스트
  ```python
  def test_get_db_session():
      from app.database import get_db
      db = next(get_db())
      assert db is not None
      db.close()
  ```

### 1.3 데이터베이스 모델 정의

#### 단위 테스트
- [ ] 1.3.1 Business 모델 생성 테스트
  ```python
  # tests/test_models.py
  def test_business_model_creation(db):
      from app.models import Business
      business = Business(
          name="Test Pizza",
          google_maps_url="https://maps.google.com/test",
          place_id="ChIJ123"
      )
      db.add(business)
      db.commit()
      assert business.id is not None
      assert business.name == "Test Pizza"
  ```

- [ ] 1.3.2 RankSnapshot 모델 생성 테스트
  ```python
  def test_rank_snapshot_creation(db, sample_business):
      from app.models import RankSnapshot
      snapshot = RankSnapshot(
          business_id=sample_business.id,
          status="pending",
          center_lat=40.7589,
          center_lng=-73.9851,
          radius_miles=5,
          grid_size=5
      )
      db.add(snapshot)
      db.commit()
      assert snapshot.id is not None
      assert snapshot.status == "pending"
  ```

- [ ] 1.3.3 GridPoint 모델 생성 테스트
  ```python
  def test_grid_point_creation(db, sample_snapshot):
      from app.models import GridPoint
      point = GridPoint(
          snapshot_id=sample_snapshot.id,
          grid_row=0,
          grid_col=0,
          lat=40.7589,
          lng=-73.9851,
          rank=3,
          found=True
      )
      db.add(point)
      db.commit()
      assert point.id is not None
      assert point.rank == 3
  ```

- [ ] 1.3.4 Foreign Key 관계 테스트
  ```python
  def test_business_snapshot_relationship(db, sample_business):
      snapshot = RankSnapshot(business_id=sample_business.id, ...)
      db.add(snapshot)
      db.commit()

      # Relationship 확인
      assert snapshot.business.id == sample_business.id
      assert len(sample_business.snapshots) > 0
  ```

### 1.4 Pydantic 스키마 정의

#### 단위 테스트
- [ ] 1.4.1 스키마 검증 테스트
  ```python
  # tests/test_schemas.py
  def test_scan_create_schema_validation():
      from app.schemas import ScanCreate
      from pydantic import ValidationError
      import pytest

      # 유효한 데이터
      valid_data = {
          "google_maps_url": "https://maps.google.com/test",
          "radius_miles": 5,
          "grid_size": 5
      }
      schema = ScanCreate(**valid_data)
      assert schema.radius_miles == 5

      # 잘못된 데이터
      with pytest.raises(ValidationError):
          ScanCreate(google_maps_url="invalid", radius_miles=-1)
  ```

### 1.5 API 엔드포인트 구현

#### API 테스트
- [ ] 1.5.1 POST /api/scan 테스트
  ```python
  # tests/test_routes.py
  def test_create_scan(client, db):
      payload = {
          "google_maps_url": "https://maps.google.com/test",
          "radius_miles": 5,
          "grid_size": 5
      }
      response = client.post("/api/scan", json=payload)
      assert response.status_code == 201
      data = response.json()
      assert "scan_id" in data
      assert data["status"] == "pending"
  ```

- [ ] 1.5.2 GET /api/scan/{scan_id} 테스트
  ```python
  def test_get_scan_progress(client, sample_snapshot):
      response = client.get(f"/api/scan/{sample_snapshot.id}")
      assert response.status_code == 200
      data = response.json()
      assert "progress" in data
      assert data["status"] in ["pending", "processing", "completed"]
  ```

- [ ] 1.5.3 GET /api/results/{scan_id} 테스트
  ```python
  def test_get_scan_results(client, completed_snapshot):
      response = client.get(f"/api/results/{completed_snapshot.id}")
      assert response.status_code == 200
      data = response.json()
      assert "summary" in data
      assert "grid_points" in data
      assert len(data["grid_points"]) == 25
  ```

- [ ] 1.5.4 404 에러 테스트
  ```python
  def test_get_nonexistent_scan(client):
      import uuid
      fake_id = str(uuid.uuid4())
      response = client.get(f"/api/scan/{fake_id}")
      assert response.status_code == 404
  ```

---

## Phase 2: Google Maps 스크래퍼

### 2.1 Selenium 설정

#### 단위 테스트
- [ ] 2.1.1 WebDriver 초기화 테스트
  ```python
  # tests/test_driver.py
  def test_webdriver_creation():
      from app.scraper.driver import get_driver
      driver = get_driver()
      assert driver is not None
      driver.quit()
  ```

- [ ] 2.1.2 User-Agent 설정 테스트
  ```python
  def test_user_agent_rotation():
      from app.scraper.driver import get_random_user_agent
      ua1 = get_random_user_agent()
      ua2 = get_random_user_agent()
      assert ua1 is not None
      assert len(ua1) > 0
      # 여러 번 호출 시 다를 수 있음
  ```

#### 통합 테스트
- [ ] 2.1.3 Google 접속 테스트
  ```python
  def test_google_access():
      from app.scraper.driver import get_driver
      driver = get_driver()
      driver.get("https://www.google.com")
      assert "Google" in driver.title
      driver.quit()
  ```

### 2.2 Google Maps URL 파싱

#### 단위 테스트
- [ ] 2.2.1 URL 검증 테스트
  ```python
  # tests/test_url_parser.py
  def test_validate_google_maps_url():
      from app.scraper.url_parser import validate_url

      # 유효한 URL
      assert validate_url("https://maps.google.com/maps?cid=123") == True
      assert validate_url("https://www.google.com/maps/place/...") == True

      # 잘못된 URL
      assert validate_url("https://example.com") == False
      assert validate_url("not a url") == False
  ```

- [ ] 2.2.2 비즈니스 이름 추출 테스트
  ```python
  def test_extract_business_name():
      from app.scraper.url_parser import extract_business_name
      url = "https://www.google.com/maps/place/Joe's+Pizza/@40.7589,-73.9851"
      name = extract_business_name(url)
      assert name == "Joe's Pizza"
  ```

- [ ] 2.2.3 좌표 추출 테스트
  ```python
  def test_extract_coordinates():
      from app.scraper.url_parser import extract_coordinates
      url = "https://www.google.com/maps/place/Test/@40.7589,-73.9851,15z"
      lat, lng = extract_coordinates(url)
      assert lat == 40.7589
      assert lng == -73.9851
  ```

- [ ] 2.2.4 Place ID 추출 테스트
  ```python
  def test_extract_place_id():
      from app.scraper.url_parser import extract_place_id
      url = "https://maps.google.com/maps?cid=12345678901234567890"
      place_id = extract_place_id(url)
      assert place_id == "12345678901234567890"
  ```

### 2.3 그리드 생성 로직

#### 단위 테스트
- [ ] 2.3.1 그리드 포인트 개수 테스트
  ```python
  # tests/test_grid_generator.py
  def test_generate_grid_count():
      from app.scraper.grid_generator import generate_grid
      grid = generate_grid(40.7589, -73.9851, radius_miles=5, grid_size=5)
      assert len(grid) == 25  # 5x5
  ```

- [ ] 2.3.2 그리드 중심점 테스트
  ```python
  def test_grid_center_point():
      from app.scraper.grid_generator import generate_grid
      center_lat, center_lng = 40.7589, -73.9851
      grid = generate_grid(center_lat, center_lng, 5, 5)

      # 중심점 (grid[12] = 5x5의 중앙)
      center_point = grid[12]
      assert abs(center_point[0] - center_lat) < 0.001
      assert abs(center_point[1] - center_lng) < 0.001
  ```

- [ ] 2.3.3 그리드 경계 테스트
  ```python
  def test_grid_boundaries():
      from app.scraper.grid_generator import generate_grid
      center_lat, center_lng = 40.7589, -73.9851
      radius_miles = 5
      grid = generate_grid(center_lat, center_lng, radius_miles, 5)

      # 첫 포인트와 마지막 포인트는 반경 내에 있어야 함
      MILES_TO_DEGREE = 0.014483
      max_distance = radius_miles * MILES_TO_DEGREE * 1.5  # 대각선 고려

      for lat, lng in grid:
          lat_diff = abs(lat - center_lat)
          lng_diff = abs(lng - center_lng)
          assert lat_diff <= max_distance
          assert lng_diff <= max_distance
  ```

### 2.4 순위 측정 로직

#### 통합 테스트 (실제 Google Maps 호출)
- [ ] 2.4.1 검색 결과 추출 테스트
  ```python
  # tests/test_google_maps.py
  @pytest.mark.slow
  def test_search_google_maps():
      from app.scraper.google_maps import search_google_maps
      results = search_google_maps("pizza", 40.7589, -73.9851)
      assert len(results) > 0
      assert len(results) <= 20
  ```

- [ ] 2.4.2 순위 찾기 테스트
  ```python
  @pytest.mark.slow
  def test_find_rank():
      from app.scraper.google_maps import find_rank
      rank = find_rank("Joe's Pizza", 40.7589, -73.9851)
      assert rank is None or (1 <= rank <= 20)
  ```

#### 단위 테스트 (Mock 사용)
- [ ] 2.4.3 퍼지 매칭 테스트
  ```python
  def test_fuzzy_matching():
      from app.scraper.google_maps import fuzzy_match
      assert fuzzy_match("Joe's Pizza", "Joe's Pizza") >= 90
      assert fuzzy_match("Joe's Pizza", "Joes Pizza") >= 90
      assert fuzzy_match("Joe's Pizza", "Tony's Pizza") < 90
  ```

### 2.5 순위 측정 서비스

#### 통합 테스트
- [ ] 2.5.1 전체 스캔 프로세스 테스트
  ```python
  # tests/test_rank_service.py
  @pytest.mark.slow
  def test_scan_business(db, sample_snapshot):
      from app.services.rank_service import scan_business
      scan_business(sample_snapshot.id, db)

      # 스냅샷 상태 확인
      db.refresh(sample_snapshot)
      assert sample_snapshot.status == "completed"
      assert sample_snapshot.average_rank is not None

      # GridPoint 확인
      points = db.query(GridPoint).filter_by(snapshot_id=sample_snapshot.id).all()
      assert len(points) == 25
  ```

---

## Phase 3: 프론트엔드 UI

### 3.1-3.2 React 프로젝트 초기화

#### 수동 테스트
- [ ] 3.1.1 개발 서버 실행
  ```bash
  cd frontend
  npm run dev
  # http://localhost:5173 접속 확인
  ```

- [ ] 3.1.2 빌드 테스트
  ```bash
  npm run build
  # dist/ 디렉토리 생성 확인
  ```

### 3.3-3.4 TypeScript 타입 & API 서비스

#### 단위 테스트 (Jest/Vitest)
- [ ] 3.3.1 타입 체크 테스트
  ```typescript
  // tests/types.test.ts
  import { Business, ScanConfig } from '../src/types'

  test('Business type validation', () => {
    const business: Business = {
      id: '123',
      name: 'Test Pizza',
      google_maps_url: 'https://maps.google.com/test'
    }
    expect(business.name).toBe('Test Pizza')
  })
  ```

- [ ] 3.4.1 API 서비스 테스트 (Mock)
  ```typescript
  // tests/api.test.ts
  import { createScan } from '../src/services/api'
  import axios from 'axios'

  jest.mock('axios')

  test('createScan API call', async () => {
    const mockResponse = { data: { scan_id: '123', status: 'pending' } }
    ;(axios.post as jest.Mock).mockResolvedValue(mockResponse)

    const result = await createScan({
      google_maps_url: 'https://maps.google.com/test',
      radius_miles: 5,
      grid_size: 5
    })

    expect(result.scan_id).toBe('123')
  })
  ```

### 3.5-3.11 컴포넌트 테스트

#### 컴포넌트 단위 테스트 (React Testing Library)
- [ ] 3.5.1 UrlInput 컴포넌트 테스트
  ```typescript
  // tests/UrlInput.test.tsx
  import { render, screen, fireEvent } from '@testing-library/react'
  import UrlInput from '../src/components/UrlInput'

  test('renders URL input field', () => {
    render(<UrlInput onSubmit={jest.fn()} />)
    const input = screen.getByPlaceholderText(/google maps url/i)
    expect(input).toBeInTheDocument()
  })

  test('validates URL format', () => {
    const onSubmit = jest.fn()
    render(<UrlInput onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText(/google maps url/i)
    const button = screen.getByText(/다음/i)

    // 잘못된 URL
    fireEvent.change(input, { target: { value: 'invalid url' } })
    fireEvent.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/유효하지 않은/i)).toBeInTheDocument()

    // 올바른 URL
    fireEvent.change(input, { target: { value: 'https://maps.google.com/test' } })
    fireEvent.click(button)
    expect(onSubmit).toHaveBeenCalled()
  })
  ```

- [ ] 3.6.1 ScanConfig 컴포넌트 테스트
  ```typescript
  test('radius slider changes value', () => {
    render(<ScanConfig onSubmit={jest.fn()} />)
    const slider = screen.getByRole('slider')

    fireEvent.change(slider, { target: { value: '7' } })
    expect(screen.getByText(/7.*마일/i)).toBeInTheDocument()
  })
  ```

- [ ] 3.7.1 ScanProgress 컴포넌트 테스트
  ```typescript
  test('displays progress percentage', () => {
    render(<ScanProgress completed={15} total={25} />)
    expect(screen.getByText(/60%/i)).toBeInTheDocument()
    expect(screen.getByText(/15.*25/i)).toBeInTheDocument()
  })
  ```

---

## Phase 4: 보고서 생성 기능

### 4.1 백엔드 - PDF 생성

#### 단위 테스트
- [ ] 4.1.1 PDF 생성 함수 테스트
  ```python
  # tests/test_report_service.py
  def test_generate_report(db, completed_snapshot):
      from app.services.report_service import generate_report
      pdf_path = generate_report(completed_snapshot.id, db)

      assert pdf_path is not None
      assert os.path.exists(pdf_path)
      assert pdf_path.endswith('.pdf')

      # 파일 크기 확인 (최소 1KB)
      assert os.path.getsize(pdf_path) > 1024
  ```

#### API 테스트
- [ ] 4.1.2 POST /api/report/{scan_id} 테스트
  ```python
  def test_create_report(client, completed_snapshot):
      response = client.post(f"/api/report/{completed_snapshot.id}")
      assert response.status_code == 201
      data = response.json()
      assert "report_url" in data
  ```

- [ ] 4.1.3 GET /api/report/{scan_id}/download 테스트
  ```python
  def test_download_report(client, completed_snapshot_with_report):
      response = client.get(f"/api/report/{completed_snapshot.id}/download")
      assert response.status_code == 200
      assert response.headers['content-type'] == 'application/pdf'
  ```

### 4.3 보고서 전송 기능

#### 단위 테스트 (Mock)
- [ ] 4.3.1 이메일 전송 테스트
  ```python
  # tests/test_email_service.py
  @patch('smtplib.SMTP')
  def test_send_email(mock_smtp):
      from app.services.email_service import send_email
      result = send_email(
          to="test@example.com",
          subject="Test Report",
          body="Test body",
          attachment_path="/path/to/report.pdf"
      )
      assert result == True
      mock_smtp.assert_called_once()
  ```

---

## Phase 5: 경쟁사 비교 기능

#### API 테스트
- [ ] 5.1.1 POST /api/compare 테스트
  ```python
  def test_create_comparison(client):
      payload = {
          "business_urls": [
              "https://maps.google.com/test1",
              "https://maps.google.com/test2"
          ],
          "center_lat": 40.7589,
          "center_lng": -73.9851,
          "radius_miles": 5,
          "grid_size": 5
      }
      response = client.post("/api/compare", json=payload)
      assert response.status_code == 201
      data = response.json()
      assert "comparison_id" in data
      assert len(data["businesses"]) == 2
  ```

---

## E2E 테스트 (Playwright)

### E2E-1: 전체 스캔 플로우
```typescript
// tests/e2e/full-scan.spec.ts
import { test, expect } from '@playwright/test'

test('complete scan flow', async ({ page }) => {
  // 1. 홈페이지 접속
  await page.goto('http://localhost:3000')

  // 2. URL 입력
  await page.fill('input[placeholder*="Google Maps"]',
    'https://maps.google.com/maps/place/Test+Pizza/@40.7589,-73.9851')
  await page.click('button:has-text("다음")')

  // 3. 스캔 설정
  await expect(page.locator('h2:has-text("스캔 설정")')).toBeVisible()
  await page.fill('input[name="center_lat"]', '40.7589')
  await page.fill('input[name="center_lng"]', '-73.9851')
  await page.click('input[value="5"]') // 5x5 그리드
  await page.click('button:has-text("스캔 시작")')

  // 4. 진행 상황 확인
  await expect(page.locator('text=분석 중')).toBeVisible()
  await expect(page.locator('text=/\\d+%/')).toBeVisible()

  // 5. 결과 확인 (최대 3분 대기)
  await expect(page.locator('text=순위 분석 결과')).toBeVisible({ timeout: 180000 })
  await expect(page.locator('text=/평균.*등/')).toBeVisible()

  // 6. 히트맵 표시 확인
  await expect(page.locator('.leaflet-container')).toBeVisible()

  // 7. 그리드 테이블 확인
  const rows = page.locator('table tbody tr')
  await expect(rows).toHaveCount(25)
})
```

### E2E-2: URL 검증
```typescript
test('URL validation', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // 잘못된 URL
  await page.fill('input[placeholder*="Google Maps"]', 'https://example.com')
  await page.click('button:has-text("다음")')
  await expect(page.locator('text=유효하지 않은 URL')).toBeVisible()

  // 올바른 URL
  await page.fill('input[placeholder*="Google Maps"]',
    'https://maps.google.com/test')
  await page.click('button:has-text("다음")')
  await expect(page.locator('text=스캔 설정')).toBeVisible()
})
```

### E2E-3: 경쟁사 비교
```typescript
test('competitor comparison', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // URL 입력
  await page.fill('input[placeholder*="Google Maps"]',
    'https://maps.google.com/test1')
  await page.click('button:has-text("다음")')

  // 스캔 설정
  await page.click('button:has-text("다음")')

  // 경쟁사 추가
  await page.click('button:has-text("경쟁사 추가")')
  await page.fill('input[placeholder*="경쟁사 URL"]',
    'https://maps.google.com/test2')
  await page.click('button:has-text("추가")')

  // 스캔 시작
  await page.click('button:has-text("스캔 시작")')

  // 결과 확인
  await expect(page.locator('text=경쟁사 비교')).toBeVisible({ timeout: 180000 })
  await expect(page.locator('canvas')).toBeVisible() // Chart.js 차트
})
```

### E2E-4: 보고서 생성 및 다운로드
```typescript
test('report generation and download', async ({ page }) => {
  // 스캔 완료 후
  await page.goto('http://localhost:3000/results/test-scan-id')

  // 보고서 생성 버튼 클릭
  await page.click('button:has-text("보고서 생성")')

  // 고객 정보 입력
  await page.fill('input[name="customer_name"]', 'Test Customer')
  await page.fill('input[name="customer_email"]', 'test@example.com')

  // 보고서 생성
  await page.click('button:has-text("생성")')
  await expect(page.locator('text=보고서 생성 완료')).toBeVisible()

  // 다운로드
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("PDF 다운로드")')
  ])
  expect(download.suggestedFilename()).toContain('.pdf')
})
```

---

## 성능 테스트

### 성능-1: API 응답 시간
```python
# tests/test_performance.py
import time

def test_api_response_time(client):
    """API 응답 시간 < 200ms"""
    start = time.time()
    response = client.get("/health")
    duration = (time.time() - start) * 1000  # ms

    assert response.status_code == 200
    assert duration < 200
```

### 성능-2: 데이터베이스 쿼리 시간
```python
def test_database_query_performance(db):
    """DB 쿼리 시간 < 100ms"""
    start = time.time()
    results = db.query(Business).limit(100).all()
    duration = (time.time() - start) * 1000

    assert len(results) > 0
    assert duration < 100
```

---

## 수동 테스트 체크리스트

### 기능 테스트
- [ ] URL 입력 폼에 다양한 Google Maps URL 형식 테스트
- [ ] 반경 슬라이더 모든 값 (1-10마일) 테스트
- [ ] 그리드 크기 (3x3, 5x5, 7x7) 각각 테스트
- [ ] 진행 상황 실시간 업데이트 확인
- [ ] 히트맵 색상이 순위에 맞게 표시되는지 확인
- [ ] 그리드 테이블 정렬 기능 테스트
- [ ] 경쟁사 최대 5개 추가 제한 확인
- [ ] 보고서 PDF 열기 및 내용 확인
- [ ] 이메일 전송 테스트 (실제 이메일 수신 확인)

### 에러 처리 테스트
- [ ] 잘못된 URL 입력 시 에러 메시지
- [ ] 존재하지 않는 비즈니스 검색 시 처리
- [ ] 네트워크 연결 끊김 시나리오
- [ ] 백엔드 서버 다운 시 프론트엔드 반응
- [ ] 스캔 중 취소 버튼 동작

### 브라우저 호환성
- [ ] Chrome 최신 버전
- [ ] Firefox 최신 버전
- [ ] Safari 최신 버전
- [ ] Edge 최신 버전

### 반응형 디자인
- [ ] 데스크톱 (1920x1080)
- [ ] 노트북 (1366x768)
- [ ] 태블릿 (768x1024)
- [ ] 모바일 (375x667)

### 보안 테스트
- [ ] SQL Injection 시도 (', --, ;)
- [ ] XSS 시도 (<script>alert('xss')</script>)
- [ ] CSRF 토큰 검증 (프로덕션)
- [ ] Rate Limiting 동작 확인

---

## 테스트 실행 명령어

### 백엔드
```bash
# 모든 테스트
pytest

# 특정 파일
pytest tests/test_models.py

# 커버리지 포함
pytest --cov=app --cov-report=html

# 느린 테스트 제외
pytest -m "not slow"

# 특정 테스트만
pytest -k "test_business"
```

### 프론트엔드
```bash
# 단위 테스트
npm test

# E2E 테스트
npx playwright test

# E2E 헤드풀 모드
npx playwright test --headed

# 특정 테스트
npx playwright test full-scan.spec.ts
```

---

## CI/CD 파이프라인

### GitHub Actions 예시
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest --cov=app

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 18
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
```

---

## 테스트 완료 기준

각 Phase가 완료되었다고 판단하는 기준:

### Phase 1 완료 조건
- [ ] 모든 단위 테스트 통과 (pytest)
- [ ] API 엔드포인트 모두 동작
- [ ] 코드 커버리지 > 80%

### Phase 2 완료 조건
- [ ] 그리드 생성 단위 테스트 통과
- [ ] URL 파싱 테스트 통과
- [ ] 최소 1개 실제 Google Maps 검색 성공

### Phase 3 완료 조건
- [ ] 모든 컴포넌트 렌더링 테스트 통과
- [ ] E2E 전체 플로우 테스트 통과
- [ ] 반응형 디자인 수동 확인

### Phase 4 완료 조건
- [ ] PDF 생성 성공
- [ ] 이메일 전송 테스트 통과

### 전체 완료 조건
- [ ] 모든 자동 테스트 통과
- [ ] 수동 테스트 체크리스트 100% 완료
- [ ] 성능 테스트 기준 통과
- [ ] 보안 테스트 통과

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-01-09 | 초기 테스트 체크리스트 작성 |
