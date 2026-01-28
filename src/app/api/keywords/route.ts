// src/app/api/keywords/route.ts

import { NextRequest, NextResponse } from 'next/server';

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  competitionLevel: string;
  cpc: number;
  monthlySearches?: { year: number; month: number; search_volume: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const { keyword, locationCode = 2410 } = await req.json(); // 2410 = South Korea

    if (!keyword) {
      return NextResponse.json({ error: '키워드를 입력해주세요' }, { status: 400 });
    }

    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      return NextResponse.json({ error: 'DataForSEO API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

    // 연관 키워드 조회 (Keywords For Keywords)
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keywords: [keyword],
          location_code: locationCode,
          language_code: 'ko',
          include_seed_keyword: true,
          sort_by: 'search_volume',
        },
      ]),
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[Keywords API] Invalid JSON response:', responseText.slice(0, 200));
      return NextResponse.json({ error: 'API 응답 파싱 오류' }, { status: 500 });
    }

    if (data.status_code !== 20000) {
      console.error('[Keywords API] Error:', data);
      return NextResponse.json({ error: data.status_message || 'API 오류' }, { status: 500 });
    }

    const results = data.tasks?.[0]?.result;
    if (!results || results.length === 0) {
      return NextResponse.json({ error: '결과를 찾을 수 없습니다' }, { status: 404 });
    }

    // 결과 가공 - result 배열이 바로 키워드 목록
    const keywords: KeywordData[] = results.slice(0, 50).map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      competition: typeof item.competition === 'number' ? item.competition : (item.competition_index || 0) / 100,
      competitionLevel: typeof item.competition === 'string' ? item.competition : 'UNKNOWN',
      cpc: item.cpc || 0,
      monthlySearches: item.monthly_searches || [],
    }));

    // 검색량 기준 정렬
    keywords.sort((a, b) => b.searchVolume - a.searchVolume);

    return NextResponse.json({
      seedKeyword: keyword,
      totalResults: results.length || 0,
      keywords,
    });
  } catch (error) {
    console.error('[Keywords API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '키워드 조회 실패' },
      { status: 500 }
    );
  }
}
