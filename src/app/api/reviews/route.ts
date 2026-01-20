// src/app/api/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleReviews, DataForSEOReview } from '@/lib/dataforseo';
import { analyzeReviews } from '@/lib/review-analysis';
import { Review } from '@/types';

// DataForSEO 리뷰를 기존 형식으로 변환 (원본 언어 우선)
function convertDataForSEOReview(review: DataForSEOReview): Review & { originalLanguage?: string } {
  // 원본 텍스트가 있으면 원본 사용, 없으면 번역된 텍스트 사용
  const text = review.original_review_text || review.review_text || '';

  return {
    author: review.profile_name,
    rating: review.rating?.value || 0,
    text,
    date: review.timestamp || review.time_ago,
    ownerResponse: review.owner_answer || undefined,
    responseDate: review.owner_answer_timestamp || undefined,
    originalLanguage: review.original_language || undefined,
  };
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId');
  const keyword = req.nextUrl.searchParams.get('keyword');
  const depthParam = req.nextUrl.searchParams.get('depth');
  const depth = depthParam ? parseInt(depthParam, 10) : 100;

  if (!placeId && !keyword) {
    return NextResponse.json({ error: 'placeId 또는 keyword 파라미터가 필요합니다' }, { status: 400 });
  }

  try {
    console.log(`[Reviews] Using DataForSEO - placeId: ${placeId}, keyword: ${keyword}, depth: ${depth}`);

    const result = await fetchGoogleReviews({
      ...(placeId ? { placeId } : { keyword: keyword! }),
      depth,
      sortBy: 'newest',
    });

    const reviews = result.items.map(convertDataForSEOReview);
    const meta = {
      source: 'dataforseo',
      totalReviews: result.reviews_count,
      fetchedReviews: result.items_count,
      rating: result.rating?.value,
      cid: result.cid,
    };

    const analysis = analyzeReviews(reviews);

    return NextResponse.json({ reviews, analysis, meta });
  } catch (error) {
    console.error('Reviews error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
