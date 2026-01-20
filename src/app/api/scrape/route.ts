// src/app/api/scrape/route.ts
// Google Maps 스크래핑 API

import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoogleMaps, scrapeByPlaceId } from '@/lib/gmaps-scraper';

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid');
  const placeId = req.nextUrl.searchParams.get('placeId');

  if (!cid && !placeId) {
    return NextResponse.json(
      { error: 'cid 또는 placeId 파라미터가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    console.log('[Scrape API] 스크래핑 시작:', { cid, placeId });

    let result;
    if (cid) {
      result = await scrapeGoogleMaps(cid);
    } else if (placeId) {
      result = await scrapeByPlaceId(placeId);
    }

    console.log('[Scrape API] 스크래핑 완료:', result);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '스크래핑 중 오류가 발생했습니다';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Scrape API] 스크래핑 오류:', {
      message: errorMessage,
      stack: errorStack,
      cid,
      placeId,
    });

    // 에러 유형별 상세 메시지
    let detailedError = errorMessage;
    let errorType = 'UNKNOWN';

    if (errorMessage.includes('Timeout')) {
      errorType = 'TIMEOUT';
      detailedError = `타임아웃: Google Maps 페이지 로딩이 너무 오래 걸립니다. (${errorMessage})`;
    } else if (errorMessage.includes('net::ERR')) {
      errorType = 'NETWORK';
      detailedError = `네트워크 오류: 인터넷 연결을 확인하세요. (${errorMessage})`;
    } else if (errorMessage.includes('blocked') || errorMessage.includes('denied')) {
      errorType = 'BLOCKED';
      detailedError = `차단됨: Google이 봇 요청을 차단했을 수 있습니다. (${errorMessage})`;
    } else if (errorMessage.includes('Browser') || errorMessage.includes('Chromium')) {
      errorType = 'BROWSER';
      detailedError = `브라우저 오류: Playwright/Chromium 실행 실패. (${errorMessage})`;
    }

    return NextResponse.json(
      {
        error: detailedError,
        errorType,
        originalError: errorMessage,
        params: { cid, placeId },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
