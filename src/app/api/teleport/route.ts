// src/app/api/teleport/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRankingWithGooglePlaces } from '@/lib/google-places';

export async function POST(req: NextRequest) {
  try {
    const { keyword, lat, lng, targetPlaceId } = await req.json();

    if (!keyword || lat === undefined || lng === undefined || !targetPlaceId) {
      return NextResponse.json(
        { error: 'keyword, lat, lng, targetPlaceId 파라미터가 모두 필요합니다' },
        { status: 400 }
      );
    }

    const result = await checkRankingWithGooglePlaces(keyword, lat, lng, targetPlaceId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Teleport error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
