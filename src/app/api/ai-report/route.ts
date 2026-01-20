// src/app/api/ai-report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateDiagnosticReport, DiagnosticReportInput } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, checklist, reviews, rankingInfo } = body;

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

    console.log('[AI Report] Report generated successfully');

    return NextResponse.json(report);
  } catch (error) {
    console.error('AI Report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
