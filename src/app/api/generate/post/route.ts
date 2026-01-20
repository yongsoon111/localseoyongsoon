// src/app/api/generate/post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateGBPPost } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, category, keywords, tone, postType } = body;

    if (!businessName || !category) {
      return NextResponse.json(
        { error: 'businessName과 category가 필요합니다' },
        { status: 400 }
      );
    }

    const post = await generateGBPPost({
      businessName,
      category,
      keywords,
      tone,
      postType,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Post generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '게시글 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
