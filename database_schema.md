# Database Schema (Supabase)
## Local SEO 순위 분석 도구

---

## 개요

### Supabase 선택 이유
- **PostgreSQL 기반**: 강력한 관계형 DB
- **자동 REST API**: 테이블 생성 시 API 자동 생성
- **실시간 구독**: 스캔 진행 상황 실시간 업데이트
- **무료 티어**: 500MB DB, 1GB 파일 저장소
- **쉬운 배포**: 클라우드 호스팅 자동

### 연결 정보
```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│   businesses    │
│─────────────────│
│ id (PK)         │◄──┐
│ name            │   │
│ google_maps_url │   │
│ place_id        │   │
│ address         │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │ 1:N
┌─────────────────────┴───┐
│   rank_snapshots        │
│─────────────────────────│
│ id (PK)                 │◄──┐
│ business_id (FK)        │   │
│ status                  │   │
│ center_lat              │   │
│ center_lng              │   │
│ radius_miles            │   │
│ grid_size               │   │
│ search_query            │   │
│ total_points            │   │
│ completed_points        │   │
│ average_rank            │   │
│ error_message           │   │
│ started_at              │   │
│ completed_at            │   │
│ created_at              │   │
└─────────────────────────┘   │ 1:N
                              │
┌─────────────────────────────┴┐
│   grid_points                │
│──────────────────────────────│
│ id (PK)                      │
│ snapshot_id (FK)             │
│ grid_row                     │
│ grid_col                     │
│ lat                          │
│ lng                          │
│ rank                         │
│ found                        │
│ business_name_in_result      │
│ scraped_at                   │
└──────────────────────────────┘

┌─────────────────┐
│   comparisons   │
│─────────────────│
│ id (PK)         │◄──┐
│ name            │   │
│ center_lat      │   │
│ center_lng      │   │
│ radius_miles    │   │
│ grid_size       │   │
│ created_at      │   │
└─────────────────┘   │ 1:N
                      │
┌─────────────────────┴────┐
│ comparison_businesses    │
│──────────────────────────│
│ id (PK)                  │
│ comparison_id (FK)       │
│ business_id (FK)         │
│ snapshot_id (FK)         │
└──────────────────────────┘

┌─────────────────────┐
│   reports           │
│─────────────────────│
│ id (PK)             │
│ snapshot_id (FK)    │
│ customer_name       │
│ customer_email      │
│ customer_phone      │
│ template_type       │
│ logo_url            │
│ agency_name         │
│ agency_website      │
│ pdf_url             │
│ sent_at             │
│ sent_to             │
│ sent_via            │
│ created_at          │
└─────────────────────┘
```

---

## 테이블 정의

### 1. businesses (비즈니스 정보)

```sql
-- Supabase SQL Editor에서 실행

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

-- 인덱스
CREATE INDEX idx_businesses_google_maps_url ON businesses(google_maps_url);
CREATE INDEX idx_businesses_place_id ON businesses(place_id);
CREATE INDEX idx_businesses_created_at ON businesses(created_at DESC);

-- 코멘트
COMMENT ON TABLE businesses IS '분석 대상 비즈니스 정보';
COMMENT ON COLUMN businesses.google_maps_url IS 'Google Maps URL (고유)';
COMMENT ON COLUMN businesses.place_id IS 'Google Place ID';
```

### 2. rank_snapshots (순위 스냅샷)

```sql
CREATE TYPE snapshot_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status snapshot_status NOT NULL DEFAULT 'pending',

  -- 스캔 설정
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_miles INTEGER NOT NULL CHECK (radius_miles >= 1 AND radius_miles <= 10),
  grid_size INTEGER NOT NULL CHECK (grid_size IN (3, 5, 7)),
  search_query TEXT NOT NULL,

  -- 진행 상황
  total_points INTEGER,
  completed_points INTEGER DEFAULT 0,

  -- 결과
  average_rank DECIMAL(5, 2),
  best_rank INTEGER,
  worst_rank INTEGER,
  found_count INTEGER DEFAULT 0,
  not_found_count INTEGER DEFAULT 0,

  -- 에러
  error_message TEXT,

  -- 타임스탬프
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_rank_snapshots_business_id ON rank_snapshots(business_id);
CREATE INDEX idx_rank_snapshots_status ON rank_snapshots(status);
CREATE INDEX idx_rank_snapshots_created_at ON rank_snapshots(created_at DESC);
CREATE INDEX idx_rank_snapshots_business_created ON rank_snapshots(business_id, created_at DESC);

-- 코멘트
COMMENT ON TABLE rank_snapshots IS '특정 시점의 순위 측정 스냅샷';
COMMENT ON COLUMN rank_snapshots.status IS 'pending: 대기, processing: 진행중, completed: 완료, failed: 실패';
COMMENT ON COLUMN rank_snapshots.grid_size IS '3x3, 5x5, 7x7 그리드';
```

### 3. grid_points (그리드 포인트별 순위)

```sql
CREATE TABLE grid_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES rank_snapshots(id) ON DELETE CASCADE,

  -- 그리드 위치
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,

  -- 좌표
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,

  -- 순위 결과
  rank INTEGER CHECK (rank >= 1 AND rank <= 20),
  found BOOLEAN DEFAULT FALSE,
  business_name_in_result VARCHAR(255),

  -- 메타데이터
  scraped_at TIMESTAMPTZ,

  UNIQUE(snapshot_id, grid_row, grid_col)
);

-- 인덱스
CREATE INDEX idx_grid_points_snapshot_id ON grid_points(snapshot_id);
CREATE INDEX idx_grid_points_rank ON grid_points(rank);
CREATE INDEX idx_grid_points_found ON grid_points(found);
CREATE INDEX idx_grid_points_grid_position ON grid_points(snapshot_id, grid_row, grid_col);

-- 코멘트
COMMENT ON TABLE grid_points IS '각 그리드 포인트의 순위 데이터';
COMMENT ON COLUMN grid_points.rank IS '1-20위 또는 NULL (순위권 밖)';
COMMENT ON COLUMN grid_points.found IS '검색 결과에 비즈니스가 표시되었는지';
```

### 4. comparisons (경쟁사 비교)

```sql
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),

  -- 스캔 설정 (공통)
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_miles INTEGER NOT NULL,
  grid_size INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comparison_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES rank_snapshots(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,

  UNIQUE(comparison_id, business_id)
);

-- 인덱스
CREATE INDEX idx_comparison_businesses_comparison_id ON comparison_businesses(comparison_id);
CREATE INDEX idx_comparison_businesses_business_id ON comparison_businesses(business_id);

-- 코멘트
COMMENT ON TABLE comparisons IS '여러 비즈니스의 순위를 동시 비교';
COMMENT ON TABLE comparison_businesses IS '비교에 포함된 비즈니스들';
```

### 5. reports (보고서)

```sql
CREATE TYPE report_template AS ENUM ('professional', 'simple');
CREATE TYPE report_delivery AS ENUM ('email', 'sms', 'webhook');

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES rank_snapshots(id) ON DELETE CASCADE,

  -- 고객 정보
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),

  -- 템플릿
  template_type report_template DEFAULT 'professional',

  -- 브랜딩
  logo_url TEXT,
  agency_name VARCHAR(255),
  agency_website TEXT,

  -- PDF 파일
  pdf_url TEXT,
  pdf_size_bytes INTEGER,

  -- 전송 정보
  sent_at TIMESTAMPTZ,
  sent_to TEXT,
  sent_via report_delivery,
  delivery_status VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reports_snapshot_id ON reports(snapshot_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- 코멘트
COMMENT ON TABLE reports IS 'PDF 보고서 생성 및 전송 이력';
COMMENT ON COLUMN reports.pdf_url IS 'Supabase Storage에 저장된 PDF URL';
```

---

## 트리거 & 함수

### 1. updated_at 자동 업데이트

```sql
-- 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- businesses 테이블에 트리거 적용
CREATE TRIGGER businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### 2. 스냅샷 시작 시 타임스탬프 설정

```sql
CREATE OR REPLACE FUNCTION set_snapshot_started_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    NEW.started_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rank_snapshots_start
BEFORE UPDATE ON rank_snapshots
FOR EACH ROW
EXECUTE FUNCTION set_snapshot_started_at();
```

### 3. 스냅샷 완료 시 타임스탬프 및 통계 계산

```sql
CREATE OR REPLACE FUNCTION finalize_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'processing' THEN
    NEW.completed_at = NOW();

    -- 통계 계산
    SELECT
      AVG(rank) FILTER (WHERE found = true),
      MIN(rank) FILTER (WHERE found = true),
      MAX(rank) FILTER (WHERE found = true),
      COUNT(*) FILTER (WHERE found = true),
      COUNT(*) FILTER (WHERE found = false)
    INTO
      NEW.average_rank,
      NEW.best_rank,
      NEW.worst_rank,
      NEW.found_count,
      NEW.not_found_count
    FROM grid_points
    WHERE snapshot_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rank_snapshots_complete
BEFORE UPDATE ON rank_snapshots
FOR EACH ROW
EXECUTE FUNCTION finalize_snapshot();
```

---

## Views (뷰)

### 1. 스냅샷 요약 뷰

```sql
CREATE OR REPLACE VIEW snapshot_summary AS
SELECT
  rs.id,
  rs.business_id,
  b.name AS business_name,
  rs.status,
  rs.center_lat,
  rs.center_lng,
  rs.radius_miles,
  rs.grid_size,
  rs.total_points,
  rs.completed_points,
  ROUND((rs.completed_points::DECIMAL / NULLIF(rs.total_points, 0)) * 100, 2) AS progress_percentage,
  rs.average_rank,
  rs.best_rank,
  rs.worst_rank,
  rs.found_count,
  rs.not_found_count,
  rs.started_at,
  rs.completed_at,
  rs.created_at,
  EXTRACT(EPOCH FROM (rs.completed_at - rs.started_at)) AS duration_seconds
FROM rank_snapshots rs
JOIN businesses b ON rs.business_id = b.id;

COMMENT ON VIEW snapshot_summary IS '스냅샷 요약 정보 (비즈니스 이름, 진행률 포함)';
```

### 2. 최근 스캔 뷰

```sql
CREATE OR REPLACE VIEW recent_scans AS
SELECT
  rs.id,
  b.name AS business_name,
  rs.status,
  rs.average_rank,
  rs.created_at
FROM rank_snapshots rs
JOIN businesses b ON rs.business_id = b.id
WHERE rs.created_at > NOW() - INTERVAL '30 days'
ORDER BY rs.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_scans IS '최근 30일 스캔 기록';
```

---

## Row Level Security (RLS)

**참고**: 현재는 본인만 사용하므로 RLS 비활성화. 나중에 다중 사용자 지원 시 활성화.

```sql
-- RLS 활성화 (나중에)
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rank_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grid_points ENABLE ROW LEVEL SECURITY;

-- 정책 예시 (다중 사용자 시)
-- CREATE POLICY "Users can view their own businesses"
--   ON businesses FOR SELECT
--   USING (auth.uid() = user_id);
```

---

## 초기 데이터 (Seed Data)

```sql
-- 테스트용 비즈니스
INSERT INTO businesses (name, google_maps_url, place_id, address) VALUES
('Test Pizza Shop', 'https://www.google.com/maps/place/Test+Pizza/@40.7589,-73.9851', 'ChIJTest123', '123 Main St, New York, NY');

-- 확인
SELECT * FROM businesses;
```

---

## Supabase Storage 설정

### 보고서 PDF 저장용 버킷 생성

```sql
-- Supabase Dashboard → Storage → New Bucket
-- Bucket Name: reports
-- Public: false (비공개)
```

### Storage 정책

```sql
-- 업로드 허용 (Service Role만)
-- Supabase Dashboard에서 설정:
-- Policy Name: "Allow service role to upload"
-- Policy Definition:
-- (service_role() = true) OR (auth.role() = 'service_role')
```

---

## 실시간 구독 (Realtime)

### 스캔 진행 상황 실시간 업데이트

```javascript
// Frontend에서 사용
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 스캔 진행 상황 구독
const subscription = supabase
  .channel('rank_snapshots_changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rank_snapshots',
      filter: `id=eq.${scanId}`
    },
    (payload) => {
      console.log('Progress update:', payload.new)
      // UI 업데이트
      setProgress(payload.new.completed_points / payload.new.total_points)
    }
  )
  .subscribe()

// 구독 해제
subscription.unsubscribe()
```

---

## 마이그레이션 순서

### 1단계: 테이블 생성
```sql
-- 위의 CREATE TABLE 문들을 순서대로 실행
-- businesses → rank_snapshots → grid_points → comparisons → comparison_businesses → reports
```

### 2단계: 인덱스 생성
```sql
-- 각 테이블의 CREATE INDEX 문들 실행
```

### 3단계: 트리거 & 함수
```sql
-- update_updated_at 함수 및 트리거
-- set_snapshot_started_at 함수 및 트리거
-- finalize_snapshot 함수 및 트리거
```

### 4단계: 뷰 생성
```sql
-- snapshot_summary 뷰
-- recent_scans 뷰
```

### 5단계: Realtime 활성화
```sql
-- Supabase Dashboard → Database → Replication
-- rank_snapshots 테이블에 Realtime 활성화
```

---

## 백엔드 연결 (Python)

### requirements.txt 추가
```txt
supabase==2.3.0
postgrest-py==0.13.0
```

### database.py
```python
import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 사용 예시
def create_business(name: str, url: str):
    data = supabase.table("businesses").insert({
        "name": name,
        "google_maps_url": url
    }).execute()
    return data.data[0]

def get_snapshot(snapshot_id: str):
    data = supabase.table("rank_snapshots").select("*").eq("id", snapshot_id).single().execute()
    return data.data

def update_snapshot_progress(snapshot_id: str, completed_points: int):
    supabase.table("rank_snapshots").update({
        "completed_points": completed_points
    }).eq("id", snapshot_id).execute()
```

---

## 프론트엔드 연결 (React)

### .env
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### supabaseClient.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 사용 예시
export async function getSnapshot(snapshotId: string) {
  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('*, businesses(*), grid_points(*)')
    .eq('id', snapshotId)
    .single()

  if (error) throw error
  return data
}
```

---

## 데이터 백업

```sql
-- Supabase CLI로 백업
npx supabase db dump -f backup.sql

-- 복원
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup.sql
```

---

## 성능 최적화

### 1. 인덱스 모니터링
```sql
-- 사용되지 않는 인덱스 확인
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

### 2. 쿼리 성능 분석
```sql
-- EXPLAIN ANALYZE 사용
EXPLAIN ANALYZE
SELECT * FROM snapshot_summary
WHERE business_id = 'some-uuid';
```

### 3. Vacuum & Analyze
```sql
-- 정기적으로 실행 (Supabase가 자동으로 처리하지만 수동도 가능)
VACUUM ANALYZE businesses;
VACUUM ANALYZE rank_snapshots;
VACUUM ANALYZE grid_points;
```

---

## 체크리스트

### Supabase 프로젝트 설정
- [ ] Supabase 프로젝트 생성
- [ ] 프로젝트 URL 및 API 키 복사
- [ ] SQL Editor에서 테이블 생성 스크립트 실행
- [ ] 인덱스 생성
- [ ] 트리거 & 함수 생성
- [ ] 뷰 생성
- [ ] Storage 버킷 생성 (reports)
- [ ] Realtime 활성화 (rank_snapshots)

### 백엔드 연결
- [ ] supabase-py 패키지 설치
- [ ] .env 파일에 Supabase 정보 추가
- [ ] database.py 작성
- [ ] 연결 테스트

### 프론트엔드 연결
- [ ] @supabase/supabase-js 패키지 설치
- [ ] .env 파일에 Supabase 정보 추가
- [ ] supabaseClient.ts 작성
- [ ] 실시간 구독 테스트

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Python 라이브러리](https://github.com/supabase-community/supabase-py)
- [Supabase JavaScript 라이브러리](https://github.com/supabase/supabase-js)
- [PostgreSQL 트리거](https://www.postgresql.org/docs/current/plpgsql-trigger.html)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-01-09 | Supabase 기반 데이터베이스 스키마 초안 |
