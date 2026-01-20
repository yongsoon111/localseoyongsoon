// src/app/api/teleport/grid/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRankingWithGooglePlaces, RankingResult } from '@/lib/google-places';

export async function POST(req: NextRequest) {
  try {
    const { keyword, centerLat, centerLng, targetPlaceId, businessName, gridSize = 3, radiusMiles = 0.5 } = await req.json();

    if (!keyword || centerLat === undefined || centerLng === undefined || !targetPlaceId) {
      return NextResponse.json(
        { error: 'keyword, centerLat, centerLng, targetPlaceId 파라미터가 모두 필요합니다' },
        { status: 400 }
      );
    }

    // 그리드 크기 제한 (최대 7x7 = 49건)
    const safeGridSize = Math.min(Math.max(gridSize, 3), 7);
    const results: RankingResult[] = [];

    // 마일을 위도/경도 단위로 변환
    // 1마일 ≈ 0.0145도 (위도 기준, 적도 근처)
    // radiusMiles는 그리드 전체 범위의 절반 (중심에서 끝까지)
    const offset = (radiusMiles * 0.0145) / Math.floor(safeGridSize / 2);

    console.log(`[Grid Search] Starting for place ID: ${targetPlaceId}, keyword: ${keyword}, radius: ${radiusMiles} mi, grid: ${safeGridSize}x${safeGridSize}`);

    for (let i = -Math.floor(safeGridSize / 2); i <= Math.floor(safeGridSize / 2); i++) {
      for (let j = -Math.floor(safeGridSize / 2); j <= Math.floor(safeGridSize / 2); j++) {
        const lat = centerLat + i * offset;
        const lng = centerLng + j * offset;

        try {
          const result = await checkRankingWithGooglePlaces(keyword, lat, lng, targetPlaceId);
          results.push(result);
          console.log(`[Grid] Position (${lat.toFixed(4)}, ${lng.toFixed(4)}): Rank ${result.rank || 'N/A'}`);
        } catch (error) {
          console.error(`Grid search error at (${lat}, ${lng}):`, error);
          results.push({ lat, lng, rank: null, competitors: [] });
        }

        // API 속도 제한 대응 (500ms 간격)
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Grid search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
