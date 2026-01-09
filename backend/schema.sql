-- Local SEO Rank Tracker Database Schema
-- Supabase에서 실행할 SQL

-- 1. businesses 테이블
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    google_maps_url TEXT NOT NULL UNIQUE,
    place_id VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    website TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. rank_snapshots 테이블
CREATE TABLE IF NOT EXISTS public.rank_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_miles DECIMAL(4, 1) NOT NULL CHECK (radius_miles >= 0.1 AND radius_miles <= 10),
    grid_size INTEGER NOT NULL CHECK (grid_size IN (3, 5, 7)),
    search_query VARCHAR(255) NOT NULL,
    total_points INTEGER,
    completed_points INTEGER DEFAULT 0,
    average_rank DECIMAL(5, 2),
    best_rank INTEGER,
    worst_rank INTEGER,
    found_count INTEGER DEFAULT 0,
    not_found_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. grid_points 테이블
CREATE TABLE IF NOT EXISTS public.grid_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES public.rank_snapshots(id) ON DELETE CASCADE,
    grid_row INTEGER NOT NULL,
    grid_col INTEGER NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    rank INTEGER CHECK (rank >= 1 AND rank <= 20),
    found BOOLEAN DEFAULT FALSE,
    business_name_in_result VARCHAR(255),
    scraped_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(snapshot_id, grid_row, grid_col)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_businesses_google_maps_url ON public.businesses(google_maps_url);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_business_id ON public.rank_snapshots(business_id);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_status ON public.rank_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_grid_points_snapshot_id ON public.grid_points(snapshot_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_points ENABLE ROW LEVEL SECURITY;

-- Service Role은 모든 권한 (이미 설정되어 있음)
-- Anon Role은 읽기만 가능하도록 설정
CREATE POLICY "Enable read access for anon users" ON public.businesses
    FOR SELECT TO anon USING (true);

CREATE POLICY "Enable read access for anon users" ON public.rank_snapshots
    FOR SELECT TO anon USING (true);

CREATE POLICY "Enable read access for anon users" ON public.grid_points
    FOR SELECT TO anon USING (true);

-- Service Role은 모든 작업 가능 (기본적으로 RLS 우회)
