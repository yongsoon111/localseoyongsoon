// src/app/api/place-id/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleBusinessInfo } from '@/lib/dataforseo';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // 1. 이미 Place ID인 경우
    if (trimmedUrl.startsWith('ChIJ')) {
      return NextResponse.json({ placeId: trimmedUrl });
    }

    // 2. Google Maps URL에서 비즈니스명 추출
    let searchKeyword = trimmedUrl;

    // place/비즈니스명 형식
    const placeMatch = trimmedUrl.match(/place\/([^/@?]+)/);
    if (placeMatch) {
      searchKeyword = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // URL이 아닌 경우 그대로 검색어로 사용
    if (!trimmedUrl.startsWith('http')) {
      searchKeyword = trimmedUrl;
    }

    console.log('[Place ID] Searching for:', searchKeyword);

    // DataForSEO로 비즈니스 정보 조회
    const result = await fetchGoogleBusinessInfo({
      keyword: searchKeyword,
    });

    if (result?.place_id) {
      console.log('[Place ID] Found:', result.place_id);
      return NextResponse.json({
        placeId: result.place_id,
        businessInfo: result,
      });
    }

    return NextResponse.json(
      { error: 'Place ID를 찾을 수 없습니다. 비즈니스명을 정확히 입력해주세요.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Place ID extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
