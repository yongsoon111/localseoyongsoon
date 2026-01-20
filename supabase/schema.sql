-- GBP Audit Database Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 프로필 테이블 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 비즈니스 테이블 (분석한 비즈니스 정보)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  cid TEXT,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  photos_count INTEGER DEFAULT 0,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  is_claimed BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- 3. 감사(Audit) 결과 테이블
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  basic_score INTEGER,
  review_score INTEGER,
  activity_score INTEGER,
  total_score INTEGER,
  review_count INTEGER,
  avg_rating DECIMAL(2,1),
  response_rate DECIMAL(5,2),
  keywords JSONB,
  recommendations JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 리뷰 데이터 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  review_id TEXT,
  author TEXT,
  rating INTEGER,
  text TEXT,
  date TIMESTAMPTZ,
  owner_response TEXT,
  response_date TIMESTAMPTZ,
  is_local_guide BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, review_id)
);

-- 5. AI 생성 게시글 테이블
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  post_type TEXT CHECK (post_type IN ('update', 'offer', 'event', 'product')),
  tone TEXT CHECK (tone IN ('professional', 'friendly', 'promotional')),
  content TEXT NOT NULL,
  keywords TEXT[],
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI 생성 리뷰 답변 테이블
CREATE TABLE IF NOT EXISTS generated_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 텔레포트(순위 체크) 결과 테이블
CREATE TABLE IF NOT EXISTS teleport_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  rank INTEGER,
  competitors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 사용량/크레딧 테이블
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'audit', 'review_fetch', 'post_generate', 'teleport'
  credits_used INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teleport_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles 정책
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Businesses 정책
CREATE POLICY "Users can view own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- Audits 정책
CREATE POLICY "Users can view own audits" ON audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits" ON audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews 정책 (business를 통해 간접 접근)
CREATE POLICY "Users can view reviews of own businesses" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = reviews.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reviews for own businesses" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = reviews.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Generated Posts 정책
CREATE POLICY "Users can view own posts" ON generated_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON generated_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON generated_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON generated_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Generated Replies 정책
CREATE POLICY "Users can view own replies" ON generated_replies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own replies" ON generated_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teleport Results 정책
CREATE POLICY "Users can view own teleport results" ON teleport_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teleport results" ON teleport_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Logs 정책
CREATE POLICY "Users can view own usage" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 트리거: 자동 프로필 생성
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 사용자 생성 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON businesses(place_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_business_id ON audits(business_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_teleport_business_id ON teleport_results(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
