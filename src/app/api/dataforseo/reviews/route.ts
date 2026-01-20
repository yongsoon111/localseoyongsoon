// src/app/api/dataforseo/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleReviews, DataForSEOReview } from '@/lib/dataforseo';
import { Review, ReviewAnalysis } from '@/types';

// DataForSEO 리뷰를 기존 형식으로 변환
function convertReview(review: DataForSEOReview): Review {
  return {
    author: review.profile_name,
    rating: review.rating?.value || 0,
    text: review.review_text || '',
    date: review.timestamp || review.time_ago,
    ownerResponse: review.owner_answer || undefined,
    responseDate: review.owner_answer_timestamp || undefined,
  };
}

// 키워드 추출 함수
function extractKeywords(reviews: Review[]): { keyword: string; count: number }[] {
  const wordCount = new Map<string, number>();

  // 한국어 불용어
  const stopWords = new Set([
    '이', '가', '은', '는', '을', '를', '의', '에', '에서', '로', '으로', '와', '과',
    '도', '만', '부터', '까지', '처럼', '같이', '보다', '라고', '하고', '이고',
    '그', '저', '이것', '저것', '그것', '여기', '저기', '거기',
    '하다', '되다', '있다', '없다', '같다', '이다', '아니다',
    '그리고', '그러나', '하지만', '그래서', '따라서', '또한', '및',
    '수', '것', '등', '때', '곳', '점', '중', '후', '전', '더', '잘', '좀', '매우', '정말', '너무', '아주',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'it', 'its',
    'very', 'really', 'so', 'too', 'also', 'just', 'only',
  ]);

  reviews.forEach((review) => {
    if (!review.text) return;

    // 한국어와 영어 단어 추출
    const words = review.text
      .toLowerCase()
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 2 && !stopWords.has(word));

    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
  });

  return Array.from(wordCount.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

// 리뷰 분석 함수
function analyzeReviews(reviews: Review[]): ReviewAnalysis {
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let responseCount = 0;

  reviews.forEach((review) => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
    }
    totalRating += review.rating;
    if (review.ownerResponse) {
      responseCount++;
    }
  });

  return {
    responseRate: reviews.length > 0 ? Math.round((responseCount / reviews.length) * 100) : 0,
    avgRating: reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
    ratingDistribution,
    keywords: extractKeywords(reviews),
  };
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId');
  const keyword = req.nextUrl.searchParams.get('keyword');
  const depthParam = req.nextUrl.searchParams.get('depth');
  const depth = depthParam ? parseInt(depthParam, 10) : 100;

  if (!placeId && !keyword) {
    return NextResponse.json(
      { error: 'placeId 또는 keyword 파라미터가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    console.log(`[DataForSEO] Fetching reviews - placeId: ${placeId}, keyword: ${keyword}, depth: ${depth}`);

    const result = await fetchGoogleReviews({
      placeId: placeId || undefined,
      keyword: keyword || undefined,
      depth,
      sortBy: 'newest',
    });

    console.log(`[DataForSEO] Received ${result.items_count} reviews`);

    // 기존 형식으로 변환
    const reviews = result.items.map(convertReview);
    const analysis = analyzeReviews(reviews);

    return NextResponse.json({
      reviews,
      analysis,
      meta: {
        source: 'dataforseo',
        totalReviews: result.reviews_count,
        fetchedReviews: result.items_count,
        rating: result.rating?.value,
        placeId: result.place_id,
        cid: result.cid,
      },
    });
  } catch (error) {
    console.error('[DataForSEO] Reviews fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '리뷰 수집 실패' },
      { status: 500 }
    );
  }
}
