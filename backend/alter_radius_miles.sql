-- radius_miles 컬럼 타입을 INTEGER에서 DECIMAL(4,1)로 변경

-- 1. 제약 조건 제거
ALTER TABLE public.rank_snapshots
DROP CONSTRAINT IF EXISTS rank_snapshots_radius_miles_check;

-- 2. 컬럼 타입 변경
ALTER TABLE public.rank_snapshots
ALTER COLUMN radius_miles TYPE DECIMAL(4, 1);

-- 3. 새로운 제약 조건 추가
ALTER TABLE public.rank_snapshots
ADD CONSTRAINT rank_snapshots_radius_miles_check
CHECK (radius_miles >= 0.1 AND radius_miles <= 10);
