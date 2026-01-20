// src/app/api/ai-report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateDiagnosticReport, DiagnosticReportInput } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, checklist, reviews, rankingInfo } = body;

    console.log('[AI Report] 요청 수신:', {
      businessName,
      checklistCount: checklist?.length || 0,
      reviewsCount: reviews?.length || 0,
      rankingInfo,
    });

    // 환경변수 체크
    const hasApiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
    console.log('[AI Report] GOOGLE_GEMINI_API_KEY 설정됨:', hasApiKey);

    if (!businessName) {
      return NextResponse.json(
        { error: '비즈니스 정보가 필요합니다' },
        { status: 400 }
      );
    }

    console.log('[AI Report] Generating report for:', businessName);

    const report = await generateDiagnosticReport(
      businessName,
      checklist || [],
      reviews as DiagnosticReportInput[] || [],
      rankingInfo || '순위 미확인'
    );

    // 보고서가 오류 상태인지 확인
    if (report.summary?.headline === 'AI 분석 중 오류가 발생했습니다') {
      console.log('[AI Report] 보고서 생성 실패 - 오류 메시지:', report.summary.impactDescription);
    } else {
      console.log('[AI Report] Report generated successfully');
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('[AI Report] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
