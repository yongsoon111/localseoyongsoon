// src/app/api/generate/review-reply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateReviewReply } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { reviewText, rating, businessName } = await req.json();

    if (!reviewText || rating === undefined || !businessName) {
      return NextResponse.json(
        { error: 'reviewText, rating, businessName이 필요합니다' },
        { status: 400 }
      );
    }

    const reply = await generateReviewReply({
      reviewText,
      rating,
      businessName,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Review reply error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '답변 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
