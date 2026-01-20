// src/app/api/generate/review-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateReviewSummary } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { reviews } = await req.json();

    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'reviews 배열이 필요합니다' },
        { status: 400 }
      );
    }

    const summary = await generateReviewSummary(reviews);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Review summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '리뷰 요약 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
