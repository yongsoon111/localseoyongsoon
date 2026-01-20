// src/app/api/dataforseo/test/route.ts

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/dataforseo';

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'DataForSEO API 연결 성공'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'DataForSEO API 연결 실패 - 인증 정보를 확인하세요'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '연결 테스트 실패'
    }, { status: 500 });
  }
}
