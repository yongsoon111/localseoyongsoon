-- 비즈니스 테이블: 사용자가 등록한 비즈니스 목록
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, place_id)
);

-- 감사 히스토리 테이블: 각 비즈니스의 감사 결과 기록
CREATE TABLE IF NOT EXISTS audit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  basic_score INTEGER,
  review_score INTEGER,
  total_score INTEGER,
  response_rate DECIMAL(5,2),
  avg_rating DECIMAL(2,1),
  rating_distribution JSONB,
  keywords JSONB,
  audit_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 정책
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 비즈니스만 조회/수정/삭제 가능
CREATE POLICY "Users can view own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- 감사 히스토리는 비즈니스 소유자만 접근 가능
CREATE POLICY "Users can view own audit history" ON audit_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = audit_history.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own audit history" ON audit_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = audit_history.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_business_id ON audit_history(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_created_at ON audit_history(created_at DESC);
