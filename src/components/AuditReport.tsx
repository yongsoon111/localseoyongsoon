'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BusinessInfo, ReviewAudit, AuditTab, ThemeType, ChecklistItem, DiagnosticStatus } from '@/types';
import { useAuditStore } from '@/stores/audit-store';
import { checkAttributes } from '@/lib/attribute-checklist';
import { analyzeReviewLanguages, getLanguageName } from '@/lib/language-analysis';

// Components
import { AuditHeader } from './AuditHeader';
import { Checklist } from './Checklist';
import { ReviewSection } from './ReviewSection';
import { RankingSection } from './RankingSection';
import { AIReportSection } from './AIReportSection';
import { CompetitorSection } from './CompetitorSection';
import { ReviewQRGenerator } from './ReviewQRGenerator';
import { KeywordResearch } from './KeywordResearch';

interface AuditReportProps {
  business: BusinessInfo;
  basicScore: number;
  reviewData: ReviewAudit | null;
  reviewLoading?: boolean;
  onBack?: () => void;
}

export function AuditReport({
  business,
  basicScore,
  reviewData,
  reviewLoading = false,
  onBack,
}: AuditReportProps) {
  const [activeTab, setActiveTab] = useState<AuditTab>('DIAGNOSTIC');
  const [theme, setTheme] = useState<ThemeType>('light');

  const {
    reviewDepth,
    fetchReviews,
    setReviewDepth,
    teleportResults,
    teleportKeyword,
    scrapedData,
    scrapeLoading,
    fetchScrapedData,
    scrapeError,
  } = useAuditStore();

  // 테마 적용
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => {
      document.body.className = '';
    };
  }, [theme]);

  const isDarkTheme = theme !== 'light';

  // 속성 체크 결과
  const attributeCheck = useMemo(() => {
    return checkAttributes(business.category, business.attributes);
  }, [business.category, business.attributes]);

  // 외국인 리뷰 분석
  const foreignReviewAnalysis = useMemo(() => {
    if (!reviewData?.reviews) return null;
    return analyzeReviewLanguages(reviewData.reviews);
  }, [reviewData?.reviews]);

  // 언어 라벨
  const getLanguageLabels = (languages: string[]): string => {
    const langNames: Record<string, string> = {
      ko: '한국어',
      en: '영어',
      ja: '일본어',
      zh: '중국어',
    };
    return languages.map(l => langNames[l] || l).join('+');
  };

  // 웹사이트 유형 라벨
  const getWebsiteTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      official: '공식 웹사이트',
      sns: 'SNS',
      blog: '블로그',
      other: '기타 플랫폼',
    };
    return labels[type || 'other'] || '기타';
  };

  // 게시물 상태
  const getPostStatus = () => {
    if (!scrapedData) return { value: '확인 필요', status: DiagnosticStatus.WARNING, diagnosis: 'GMaps 스크래핑 버튼 클릭하여 확인' };

    const { posts } = scrapedData;
    if (posts.count === 0) {
      return { value: '게시물 없음', status: DiagnosticStatus.ERROR, diagnosis: '게시물 없음 - 주 2-3회 게시물 발행 권장' };
    }

    const rawDate = posts.lastPostDateRaw || '';
    const actualDate = posts.lastPostDate || '날짜 미확인';
    const isRecent = rawDate.includes('일') || rawDate.includes('시간') || rawDate.includes('분');

    return {
      value: `${posts.count}개 (마지막: ${actualDate})`,
      status: isRecent ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
      diagnosis: isRecent
        ? `최근 게시물 있음 (${rawDate})`
        : `마지막 게시물: ${actualDate} - 더 자주 업데이트 필요`
    };
  };

  // Q&A 상태
  const getQnaStatus = () => {
    if (!scrapedData) return { value: '확인 필요', status: DiagnosticStatus.WARNING, diagnosis: 'GMaps 스크래핑 버튼 클릭하여 확인' };

    const { qna } = scrapedData;
    if (qna.totalCount === 0) {
      return { value: 'Q&A 없음', status: DiagnosticStatus.WARNING, diagnosis: 'Q&A 없음 - 자주 묻는 질문 등록 권장' };
    }

    if (qna.unansweredCount > 0) {
      return {
        value: `${qna.totalCount}개 (미답변 ${qna.unansweredCount}개)`,
        status: DiagnosticStatus.ERROR,
        diagnosis: `미답변 질문 ${qna.unansweredCount}개 - 즉시 답변 필요`
      };
    }

    return {
      value: `${qna.totalCount}개 (모두 답변됨)`,
      status: DiagnosticStatus.SUCCESS,
      diagnosis: '모든 질문에 답변 완료'
    };
  };

  // 체크리스트 데이터 생성
  const checklistData: ChecklistItem[] = useMemo(() => {
    const postStatus = getPostStatus();
    const qnaStatus = getQnaStatus();

    return [
      // 기본 정보
      {
        category: '기본 정보',
        item: '비즈니스명',
        status: business.name ? DiagnosticStatus.SUCCESS : DiagnosticStatus.ERROR,
        currentValue: business.name || '미설정',
        diagnosis: business.name ? '설정 완료' : '미설정 - 필수 항목'
      },
      {
        category: '기본 정보',
        item: '다국어 SEO',
        status: business.hasMultiLanguageName ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.detectedLanguages?.length
          ? getLanguageLabels(business.detectedLanguages)
          : '단일 언어',
        diagnosis: business.hasMultiLanguageName
          ? `다국어 최적화됨 (${getLanguageLabels(business.detectedLanguages || [])})`
          : '단일 언어 - 외국인 검색 노출 불리'
      },
      {
        category: '기본 정보',
        item: '주소',
        status: business.address ? DiagnosticStatus.SUCCESS : DiagnosticStatus.ERROR,
        currentValue: business.address || '미설정',
        diagnosis: business.address ? '설정 완료' : '미설정 - 필수 항목'
      },
      {
        category: '기본 정보',
        item: '전화번호',
        status: business.phone ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.phone || '미설정',
        diagnosis: business.phone ? '설정 완료' : '미설정 - 고객 문의 경로 부재'
      },
      {
        category: '기본 정보',
        item: '카테고리',
        status: business.category !== 'unknown' ? DiagnosticStatus.SUCCESS : DiagnosticStatus.ERROR,
        currentValue: business.category !== 'unknown' ? business.category : '미설정',
        diagnosis: business.category !== 'unknown' ? '메인 카테고리 설정됨' : '미설정 - 검색 노출 불가'
      },
      {
        category: '기본 정보',
        item: '서브 카테고리',
        status: (business.additionalCategories?.length || 0) >= 2
          ? DiagnosticStatus.SUCCESS
          : (business.additionalCategories?.length || 0) >= 1
            ? DiagnosticStatus.WARNING
            : DiagnosticStatus.ERROR,
        currentValue: business.additionalCategories?.length
          ? `${business.additionalCategories.length}개 설정`
          : '미설정',
        diagnosis: (business.additionalCategories?.length || 0) >= 2
          ? `설정됨: ${business.additionalCategories!.slice(0, 2).join(', ')}`
          : '미설정 - 서브 카테고리 추가 권장'
      },
      {
        category: '기본 정보',
        item: '웹사이트',
        status: business.websiteType === 'official'
          ? DiagnosticStatus.SUCCESS
          : business.website
            ? DiagnosticStatus.WARNING
            : DiagnosticStatus.ERROR,
        currentValue: business.website ? getWebsiteTypeLabel(business.websiteType) : '미설정',
        diagnosis: business.websiteType === 'official'
          ? '공식 웹사이트 연결됨'
          : business.website
            ? 'SNS/블로그만 설정 - 공식 웹사이트 연결 권장'
            : '미설정 - 트래픽 전환 손실'
      },
      {
        category: '기본 정보',
        item: '영업시간',
        status: business.openingHours.length > 0 ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.openingHours.length > 0 ? `${business.openingHours.length}일 정보` : '미설정',
        diagnosis: business.openingHours.length > 0 ? '설정 완료' : '미설정 - 방문 전 이탈 발생'
      },
      {
        category: '기본 정보',
        item: '업장 설명',
        status: business.description
          ? (business.description.length >= 100 ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING)
          : DiagnosticStatus.ERROR,
        currentValue: business.description ? `${business.description.slice(0, 30)}...` : '미설정',
        diagnosis: business.description
          ? (business.description.length >= 100 ? '설정 완료' : '내용 부족 - 키워드 포함 상세 설명 필요')
          : '미설정 - 검색 순위 및 신뢰도 하락'
      },
      {
        category: '기본 정보',
        item: '프로필 속성',
        status: attributeCheck.score >= 80
          ? DiagnosticStatus.SUCCESS
          : attributeCheck.score >= 50
            ? DiagnosticStatus.WARNING
            : DiagnosticStatus.ERROR,
        currentValue: `${attributeCheck.present.required.length + attributeCheck.present.recommended.length}개 설정`,
        diagnosis: attributeCheck.missing.required.length > 0
          ? `필수 누락: ${attributeCheck.missing.required.map(a => a.label).join(', ')}`
          : '속성 설정 완료'
      },
      // 평판
      {
        category: '평판',
        item: '평점',
        status: business.rating >= 4.5 ? DiagnosticStatus.SUCCESS : business.rating >= 4.0 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR,
        currentValue: business.rating > 0 ? `★ ${business.rating.toFixed(1)}` : '없음',
        diagnosis: business.rating >= 4.5 ? '우수' : business.rating >= 4.0 ? '보통 - 개선 필요' : '낮음 - 즉시 개선 필요'
      },
      {
        category: '평판',
        item: '리뷰 수',
        status: business.reviewCount >= 100 ? DiagnosticStatus.SUCCESS : business.reviewCount >= 30 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR,
        currentValue: `${business.reviewCount}개`,
        diagnosis: business.reviewCount >= 100 ? '충분' : business.reviewCount >= 30 ? '보통 - 추가 확보 필요' : '부족 - 신뢰도 열위'
      },
      {
        category: '평판',
        item: '리뷰 응답률',
        status: reviewData
          ? (reviewData.analysis.responseRate >= 80 ? DiagnosticStatus.SUCCESS : reviewData.analysis.responseRate >= 50 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR)
          : DiagnosticStatus.WARNING,
        currentValue: reviewData ? `${reviewData.analysis.responseRate.toFixed(0)}%` : '분석 필요',
        diagnosis: reviewData
          ? (reviewData.analysis.responseRate >= 80 ? '우수' : reviewData.analysis.responseRate >= 50 ? '보통 - 개선 필요' : '낮음 - SEO 신호 약함')
          : '리뷰 분석 탭에서 확인 필요'
      },
      {
        category: '평판',
        item: '리뷰 키워드',
        status: reviewData
          ? (reviewData.analysis.keywords.length >= 10 ? DiagnosticStatus.SUCCESS : reviewData.analysis.keywords.length >= 5 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR)
          : DiagnosticStatus.WARNING,
        currentValue: reviewData ? `${reviewData.analysis.keywords.length}개 감지` : '분석 필요',
        diagnosis: reviewData
          ? (reviewData.analysis.keywords.length >= 10 ? '양호' : '부족 - 키워드 유도 필요')
          : '리뷰 분석 탭에서 확인 필요'
      },
      {
        category: '평판',
        item: '외국인 리뷰',
        status: foreignReviewAnalysis
          ? (foreignReviewAnalysis.englishReviewRatio >= 10 ? DiagnosticStatus.SUCCESS : foreignReviewAnalysis.englishReviewRatio >= 5 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR)
          : DiagnosticStatus.WARNING,
        currentValue: foreignReviewAnalysis
          ? `영문 ${foreignReviewAnalysis.englishReviewCount}개 (${foreignReviewAnalysis.englishReviewRatio}%)`
          : '분석 필요',
        diagnosis: foreignReviewAnalysis
          ? (foreignReviewAnalysis.englishReviewRatio >= 10 ? '외국인 타겟팅 적합' : '부족 - 글로벌 타겟팅 어려움')
          : '리뷰 분석 탭에서 확인 필요'
      },
      // 시각
      {
        category: '시각',
        item: '사진 수',
        status: business.photos >= 50 ? DiagnosticStatus.SUCCESS : business.photos >= 20 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR,
        currentValue: `${business.photos}장`,
        diagnosis: business.photos >= 50 ? '충분' : business.photos >= 20 ? '보통 - 추가 필요' : '부족 - 시각적 전환율 하락'
      },
      {
        category: '시각',
        item: '대표 사진',
        status: business.mainImage ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.mainImage ? '설정됨' : '미설정',
        diagnosis: business.mainImage ? '대표 이미지 설정 완료' : '미설정 - 검색 결과에서 시각적 어필 부족'
      },
      // 순위
      {
        category: '순위',
        item: '검색 순위',
        status: teleportResults[0]?.rank
          ? (teleportResults[0].rank <= 3 ? DiagnosticStatus.SUCCESS : teleportResults[0].rank <= 10 ? DiagnosticStatus.WARNING : DiagnosticStatus.ERROR)
          : DiagnosticStatus.WARNING,
        currentValue: teleportResults[0]?.rank ? `${teleportResults[0].rank}위` : '미확인',
        diagnosis: teleportResults[0]?.rank
          ? (teleportResults[0].rank <= 3 ? '로컬팩 진입 - 상위 노출' : teleportResults[0].rank <= 10 ? '10위권 - 개선 필요' : '하위 순위 - 즉시 개선 필요')
          : '순위 체크 탭에서 확인 필요'
      },
      // 알고리즘
      {
        category: '알고리즘',
        item: '게시물 업데이트',
        status: postStatus.status,
        currentValue: postStatus.value,
        diagnosis: postStatus.diagnosis
      },
      {
        category: '알고리즘',
        item: 'Q&A 관리',
        status: qnaStatus.status,
        currentValue: qnaStatus.value,
        diagnosis: qnaStatus.diagnosis
      },
      {
        category: '알고리즘',
        item: '메뉴/서비스 링크',
        status: business.hasMenuLink ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.hasMenuLink ? '설정됨' : '미설정',
        diagnosis: business.hasMenuLink ? '메뉴 링크 연결됨' : '미설정 - 메뉴/서비스 정보 추가 필요'
      },
      {
        category: '알고리즘',
        item: '예약 링크',
        status: business.hasReservationLink ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.hasReservationLink ? '설정됨' : '미설정',
        diagnosis: business.hasReservationLink ? '예약 링크 연결됨' : '미설정 - 온라인 예약 기능 추가 권장'
      },
      {
        category: '알고리즘',
        item: '주문 링크',
        status: business.hasOrderLink ? DiagnosticStatus.SUCCESS : DiagnosticStatus.WARNING,
        currentValue: business.hasOrderLink ? '설정됨' : '미설정',
        diagnosis: business.hasOrderLink ? '주문 링크 연결됨' : '해당 업종인 경우 배달/주문 링크 추가 권장'
      },
      {
        category: '알고리즘',
        item: '리뷰 키워드',
        status: (business.placeTopics?.length || 0) >= 5
          ? DiagnosticStatus.SUCCESS
          : (business.placeTopics?.length || 0) >= 3
            ? DiagnosticStatus.WARNING
            : DiagnosticStatus.ERROR,
        currentValue: business.placeTopics?.length ? `${business.placeTopics.length}개 감지` : '미확인',
        diagnosis: business.placeTopics?.length
          ? `고객 리뷰 키워드: ${business.placeTopics.slice(0, 5).map(t => t.title).join(', ')}`
          : '리뷰에서 키워드 감지 안됨 - 리뷰 유도 전략 필요'
      },
    ];
  }, [business, reviewData, foreignReviewAnalysis, attributeCheck, teleportResults, scrapedData]);

  // 리뷰 불러오기
  const handleFetchReviews = useCallback(() => {
    if (business.name) {
      fetchReviews(business.name, reviewDepth);
    }
  }, [business.name, fetchReviews, reviewDepth]);

  // GMaps 스크래핑
  const handleScrape = useCallback(() => {
    if (business.placeId) {
      fetchScrapedData(business.placeId);
    }
  }, [business.placeId, fetchScrapedData]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      {/* Back Button Bar */}
      {onBack && (
        <div className={`no-print py-3 border-b backdrop-blur-sm ${
          isDarkTheme ? 'bg-black/40 border-slate-800' : 'bg-white/50 border-slate-100'
        }`}>
          <div className="container mx-auto max-w-6xl px-4 flex justify-between items-center">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 font-bold text-sm transition-colors ${
                isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <AuditHeader
        business={business}
        basicScore={basicScore}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTheme={theme}
        onThemeChange={setTheme}
        reviewData={reviewData}
        teleportResults={teleportResults}
        onScrape={handleScrape}
        scrapeLoading={scrapeLoading}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'DIAGNOSTIC' && (
            <section id="checklist">
              <Checklist data={checklistData} theme={theme} />
            </section>
          )}

          {activeTab === 'REVIEWS' && (
            <section id="reviews">
              <ReviewSection
                reviews={reviewData?.reviews || []}
                reviewData={reviewData}
                reviewLoading={reviewLoading || false}
                reviewDepth={reviewDepth}
                onFetchReviews={handleFetchReviews}
                onDepthChange={setReviewDepth}
                theme={theme}
              />
            </section>
          )}

          {activeTab === 'RANKING' && (
            <section id="ranking">
              <RankingSection
                business={business}
                teleportResults={teleportResults}
                teleportKeyword={teleportKeyword}
                theme={theme}
              />
            </section>
          )}

          {activeTab === 'COMPETITORS' && (
            <section id="competitors">
              <CompetitorSection
                business={business}
                theme={theme}
              />
            </section>
          )}

          {activeTab === 'AI_REPORT' && (
            <section id="ai-report">
              <AIReportSection
                business={business}
                checklist={checklistData}
                reviewData={reviewData}
                teleportResults={teleportResults}
                teleportKeyword={teleportKeyword}
                theme={theme}
              />
            </section>
          )}

          {activeTab === 'TOOLS' && (
            <section id="tools">
              <div className="grid md:grid-cols-2 gap-6">
                <KeywordResearch />
                <ReviewQRGenerator
                  placeId={business.placeId}
                  businessName={business.name}
                />
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 mt-auto no-print ${
        isDarkTheme ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className={`container mx-auto px-4 text-center text-sm font-medium ${
          isDarkTheme ? 'text-slate-600' : 'text-gray-400'
        }`}>
          &copy; 2024 BizAudit Pro. All rights reserved. 본 보고서는 AI에 의해 생성된 분석 자료를 포함하고 있습니다.
        </div>
      </footer>
    </div>
  );
}

export default AuditReport;
