// src/app/api/competitor-reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

interface PlaceDetailsResponse {
  result: {
    name: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: PlaceReview[];
    delivery?: boolean;
    dine_in?: boolean;
    takeout?: boolean;
    reservable?: boolean;
    serves_beer?: boolean;
    serves_wine?: boolean;
    wheelchair_accessible_entrance?: boolean;
  };
  status: string;
  error_message?: string;
}

export interface CompetitorReviewData {
  placeId: string;
  name: string;
  rating: number;
  totalReviews: number;
  reviews: {
    author: string;
    rating: number;
    text: string;
    date: string;
    relativeTime: string;
  }[];
  negativeReviews: {
    author: string;
    rating: number;
    text: string;
    date: string;
    relativeTime: string;
  }[];
  features: string[];
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId가 필요합니다' }, { status: 400 });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    // Place Details API 호출 - 리뷰 및 서비스 옵션 가져오기
    const fields = 'name,rating,user_ratings_total,reviews,delivery,dine_in,takeout,reservable,serves_beer,serves_wine,wheelchair_accessible_entrance';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ko&reviews_sort=newest&key=${GOOGLE_MAPS_API_KEY}`;

    console.log('[Competitor Reviews API] Fetching details for:', placeId);

    const response = await fetch(url);
    const data: PlaceDetailsResponse = await response.json();

    if (data.status !== 'OK') {
      console.error('[Competitor Reviews API] Google API error:', data.status, data.error_message);
      return NextResponse.json({ error: `Google API 오류: ${data.status}` }, { status: 500 });
    }

    const result = data.result;

    // 서비스 특징 추출
    const features: string[] = [];
    if (result.delivery) features.push('배달');
    if (result.dine_in) features.push('매장식사');
    if (result.takeout) features.push('포장');
    if (result.reservable) features.push('예약가능');
    if (result.serves_beer || result.serves_wine) features.push('주류');
    if (result.wheelchair_accessible_entrance) features.push('휠체어');

    // 리뷰 변환
    const reviews = (result.reviews || []).map(review => ({
      author: review.author_name,
      rating: review.rating,
      text: review.text || '',
      date: new Date(review.time * 1000).toISOString().split('T')[0],
      relativeTime: review.relative_time_description,
    }));

    // 부정적 리뷰 필터링 (1-3점)
    const negativeReviews = reviews.filter(r => r.rating <= 3);

    const responseData: CompetitorReviewData = {
      placeId,
      name: result.name,
      rating: result.rating || 0,
      totalReviews: result.user_ratings_total || 0,
      reviews,
      negativeReviews,
      features: features.length > 0 ? features : ['정보없음'],
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Competitor Reviews API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '리뷰 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 여러 경쟁사 리뷰 일괄 조회
export async function POST(req: NextRequest) {
  try {
    const { placeIds } = await req.json();

    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      return NextResponse.json({ error: 'placeIds 배열이 필요합니다' }, { status: 400 });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ error: 'Google Maps API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    console.log('[Competitor Reviews API] Batch fetching for', placeIds.length, 'places');

    // 병렬로 모든 경쟁사 리뷰 조회 (최대 20개)
    const limitedPlaceIds = placeIds.slice(0, 20);

    const results = await Promise.all(
      limitedPlaceIds.map(async (placeId: string) => {
        try {
          const fields = 'name,rating,user_ratings_total,reviews,delivery,dine_in,takeout,reservable,serves_beer,serves_wine';
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ko&reviews_sort=newest&key=${GOOGLE_MAPS_API_KEY}`;

          const response = await fetch(url);
          const data: PlaceDetailsResponse = await response.json();

          if (data.status !== 'OK') {
            return { placeId, error: data.status };
          }

          const result = data.result;

          // 서비스 특징 추출
          const features: string[] = [];
          if (result.delivery) features.push('배달');
          if (result.dine_in) features.push('매장식사');
          if (result.takeout) features.push('포장');
          if (result.reservable) features.push('예약가능');
          if (result.serves_beer || result.serves_wine) features.push('주류');

          // 리뷰 변환
          const reviews = (result.reviews || []).map(review => ({
            author: review.author_name,
            rating: review.rating,
            text: review.text || '',
            date: new Date(review.time * 1000).toISOString().split('T')[0],
            relativeTime: review.relative_time_description,
          }));

          // 부정적 리뷰 필터링 (1-3점)
          const negativeReviews = reviews.filter(r => r.rating <= 3);

          return {
            placeId,
            name: result.name,
            rating: result.rating || 0,
            totalReviews: result.user_ratings_total || 0,
            reviews,
            negativeReviews,
            features: features.length > 0 ? features : ['정보없음'],
          };
        } catch (err) {
          return { placeId, error: 'fetch_failed' };
        }
      })
    );

    // 부정적 리뷰 키워드 분석
    const allNegativeReviews = results
      .filter(r => !('error' in r) && r.negativeReviews)
      .flatMap(r => (r as CompetitorReviewData).negativeReviews);

    const negativeKeywordAnalysis = analyzeNegativeKeywords(allNegativeReviews);

    return NextResponse.json({
      competitors: results,
      totalCompetitors: results.length,
      negativeAnalysis: negativeKeywordAnalysis,
    });
  } catch (error) {
    console.error('[Competitor Reviews API] Batch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일괄 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 부정적 리뷰 키워드 분석
function analyzeNegativeKeywords(reviews: { text: string; rating: number }[]) {
  const keywordPatterns: { keyword: string; patterns: RegExp[]; category: string }[] = [
    { keyword: '불친절', patterns: [/불친절/gi, /친절하지/gi, /무례/gi, /태도/gi], category: '서비스' },
    { keyword: '응대 불만', patterns: [/응대/gi, /대응/gi, /직원/gi, /서빙/gi], category: '서비스' },
    { keyword: '오래 기다림', patterns: [/기다/gi, /대기/gi, /늦/gi, /느리/gi, /오래/gi], category: '시간' },
    { keyword: '맛 실망', patterns: [/맛없/gi, /맛이 없/gi, /별로/gi, /실망/gi], category: '품질' },
    { keyword: '양 적음', patterns: [/양이? 적/gi, /양이? 작/gi, /portion/gi], category: '품질' },
    { keyword: '위생 문제', patterns: [/위생/gi, /더럽/gi, /불결/gi, /벌레/gi, /머리카락/gi], category: '품질' },
    { keyword: '비싸다', patterns: [/비싸/gi, /비쌈/gi, /가격/gi, /expensive/gi], category: '가격' },
    { keyword: '시끄러움', patterns: [/시끄/gi, /소음/gi, /noisy/gi], category: '환경' },
    { keyword: '좁음/불편', patterns: [/좁/gi, /불편/gi, /답답/gi], category: '환경' },
  ];

  const counts: Record<string, { count: number; category: string }> = {};

  reviews.forEach(review => {
    if (!review.text) return;
    const text = review.text.toLowerCase();

    keywordPatterns.forEach(({ keyword, patterns, category }) => {
      const matched = patterns.some(p => p.test(text));
      if (matched) {
        if (!counts[keyword]) {
          counts[keyword] = { count: 0, category };
        }
        counts[keyword].count++;
      }
    });
  });

  return Object.entries(counts)
    .map(([keyword, data]) => ({ keyword, ...data }))
    .sort((a, b) => b.count - a.count);
}
