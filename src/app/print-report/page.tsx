// src/app/print-report/page.tsx
// 인쇄용 보고서 페이지 - 브라우저 인쇄 기능으로 PDF 저장

'use client';

import { useEffect } from 'react';
import { useAuditStore } from '@/stores/audit-store';
import { PDFReport } from '@/components/PDFReport';

export default function PrintReportPage() {
  const {
    business,
    basicScore,
    reviewData,
    teleportResults,
    teleportKeyword,
    scrapedData,
  } = useAuditStore();

  // 페이지 로드 후 자동으로 인쇄 다이얼로그 열기
  useEffect(() => {
    if (business) {
      // 잠시 대기 후 인쇄 (렌더링 완료 대기)
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [business]);

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">비즈니스 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          body {
            background: #f1f5f9;
          }
        }
      `}</style>

      {/* PDF 보고서 */}
      <PDFReport
        business={business}
        basicScore={basicScore}
        reviewData={reviewData}
        teleportResults={teleportResults}
        teleportKeyword={teleportKeyword}
        scrapedData={scrapedData}
      />
    </>
  );
}
