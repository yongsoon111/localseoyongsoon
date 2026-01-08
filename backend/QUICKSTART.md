# Backend Quick Start Guide

## 1단계: 패키지 설치

```bash
cd /Users/gwonsunhyeon/Desktop/크롤러/backend

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

## 2단계: 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (VS Code 또는 nano)
nano .env
```

**필수 환경 변수**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> Supabase 프로젝트에서 URL과 Service Key를 가져오세요:
> 1. https://supabase.com/dashboard 로그인
> 2. 프로젝트 선택
> 3. Settings → API → Project URL, service_role key 복사

## 3단계: Supabase 데이터베이스 테이블 생성

Supabase Dashboard → SQL Editor에서 다음 SQL 실행:

```sql
-- 1. businesses 테이블
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  google_maps_url TEXT NOT NULL UNIQUE,
  place_id VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  website TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_google_maps_url ON businesses(google_maps_url);

-- 2. rank_snapshots 테이블
CREATE TYPE snapshot_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status snapshot_status NOT NULL DEFAULT 'pending',
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_miles INTEGER NOT NULL CHECK (radius_miles >= 1 AND radius_miles <= 10),
  grid_size INTEGER NOT NULL CHECK (grid_size IN (3, 5, 7)),
  search_query TEXT NOT NULL,
  total_points INTEGER,
  completed_points INTEGER DEFAULT 0,
  average_rank DECIMAL(5, 2),
  best_rank INTEGER,
  worst_rank INTEGER,
  found_count INTEGER DEFAULT 0,
  not_found_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rank_snapshots_business_id ON rank_snapshots(business_id);
CREATE INDEX idx_rank_snapshots_status ON rank_snapshots(status);

-- 3. grid_points 테이블
CREATE TABLE grid_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES rank_snapshots(id) ON DELETE CASCADE,
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  rank INTEGER CHECK (rank >= 1 AND rank <= 20),
  found BOOLEAN DEFAULT FALSE,
  business_name_in_result VARCHAR(255),
  scraped_at TIMESTAMPTZ,
  UNIQUE(snapshot_id, grid_row, grid_col)
);

CREATE INDEX idx_grid_points_snapshot_id ON grid_points(snapshot_id);
```

## 4단계: 서버 실행

```bash
# 가상환경이 활성화된 상태에서
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API 서버: http://localhost:8000
- Swagger 문서: http://localhost:8000/docs
- ReDoc 문서: http://localhost:8000/redoc

## 5단계: API 테스트

### Health Check
```bash
curl http://localhost:8000/health
```

예상 응답:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "database_connected": true,
  "timestamp": "2024-01-09T12:00:00Z"
}
```

### 스캔 생성
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "google_maps_url": "https://www.google.com/maps/place/Test+Pizza",
    "center_lat": 40.7589,
    "center_lng": -73.9851,
    "radius_miles": 3,
    "grid_size": 5,
    "search_query": "pizza restaurant"
  }'
```

### 스캔 진행 상황 조회
```bash
# 위에서 받은 scan_id 사용
curl http://localhost:8000/api/scan/{scan_id}
```

## 문제 해결

### "Database connection error"
- `.env` 파일의 Supabase 정보 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### "ModuleNotFoundError"
- 가상환경이 활성화되어 있는지 확인: `which python`
- 패키지 재설치: `pip install -r requirements.txt`

### "Address already in use"
- 다른 포트 사용: `uvicorn app.main:app --reload --port 8001`

## 다음 단계

현재는 API 뼈대만 구현되어 있습니다.

**Phase 2에서 구현 예정**:
- Selenium 스크래퍼
- 그리드 생성 로직
- 실제 순위 측정 기능

지금은 스캔을 생성하면 `status=pending` 상태로만 저장됩니다.
