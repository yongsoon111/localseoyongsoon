// src/components/PDFReport.tsx
// GBP 심층 진단 보고서 V4 - PDF용 컴포넌트

'use client';

import { BusinessInfo, ReviewAudit, TeleportResult, GMapsScrapedData } from '@/types';
import { forwardRef } from 'react';

interface PDFReportProps {
  business: BusinessInfo;
  basicScore: number;
  reviewData: ReviewAudit | null;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
  scrapedData: GMapsScrapedData | null;
}

// 상태 아이콘
const getStatusIcon = (status: 'good' | 'warning' | 'bad' | 'unknown') => {
  switch (status) {
    case 'good': return '✅';
    case 'warning': return '⚠️';
    case 'bad': return '❌';
    default: return '❓';
  }
};

// 날짜 포맷
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(({
  business,
  basicScore,
  reviewData,
  teleportResults,
  teleportKeyword,
  scrapedData,
}, ref) => {
  // 진단 데이터 계산
  const hasMultiLanguageName = business.hasMultiLanguageName;
  const detectedLanguages = business.detectedLanguages || [];
  const additionalCategories = business.additionalCategories || [];
  const attributes = business.attributes || [];
  const responseRate = reviewData?.analysis?.responseRate || 0;
  const reviewCount = business.reviewCount || 0;
  const rating = business.rating || 0;
  const photos = business.photos || 0;
  const description = business.description || '';
  const lastPostDate = scrapedData?.posts?.lastPostDate || null;
  const postCount = scrapedData?.posts?.count || 0;

  // 외국인 리뷰 분석
  const foreignReviews = reviewData?.reviews?.filter(r => {
    const lang = (r as any).originalLanguage;
    return lang && lang !== 'ko';
  }) || [];
  const foreignReviewRatio = reviewData?.reviews?.length
    ? (foreignReviews.length / reviewData.reviews.length * 100).toFixed(1)
    : '0';

  // 리뷰 키워드
  const placeTopics = business.placeTopics || [];
  const topKeywords = placeTopics.slice(0, 5).map(t => t.title);

  // 텔레포트 순위
  const bestRank = teleportResults.length > 0
    ? Math.min(...teleportResults.filter(r => r.rank !== null).map(r => r.rank!))
    : null;

  // 진단 상태 계산
  const getNameStatus = () => {
    if (detectedLanguages.length >= 3) return 'good';
    if (detectedLanguages.length >= 2) return 'warning';
    return 'bad';
  };

  const getCategoryStatus = () => {
    if (additionalCategories.length >= 2) return 'good';
    if (additionalCategories.length >= 1) return 'warning';
    return 'bad';
  };

  const getAttributeStatus = () => {
    if (attributes.length >= 15) return 'good';
    if (attributes.length >= 5) return 'warning';
    return 'bad';
  };

  const getRankStatus = () => {
    if (!bestRank) return 'unknown';
    if (bestRank <= 3) return 'good';
    if (bestRank <= 10) return 'warning';
    return 'bad';
  };

  const getKeywordStatus = () => {
    if (topKeywords.length >= 5) return 'good';
    if (topKeywords.length >= 2) return 'warning';
    return 'bad';
  };

  const getForeignReviewStatus = () => {
    const ratio = parseFloat(foreignReviewRatio);
    if (ratio >= 20) return 'good';
    if (ratio >= 5) return 'warning';
    return 'bad';
  };

  const getResponseRateStatus = () => {
    if (responseRate >= 80) return 'good';
    if (responseRate >= 40) return 'warning';
    return 'bad';
  };

  const getPhotoStatus = () => {
    if (photos >= 50) return 'good';
    if (photos >= 10) return 'warning';
    return 'bad';
  };

  const getPostStatus = () => {
    if (!lastPostDate) return 'unknown';
    const daysSincePost = Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePost <= 7) return 'good';
    if (daysSincePost <= 30) return 'warning';
    return 'bad';
  };

  const getDescriptionStatus = () => {
    if (description.length >= 150) return 'good';
    if (description.length >= 50) return 'warning';
    return 'bad';
  };

  // 핵심 문제점 파악
  const getMainIssues = () => {
    const issues: string[] = [];
    if (getNameStatus() !== 'good') issues.push('다국어 상호명 최적화 미흡');
    if (getCategoryStatus() !== 'good') issues.push('서브 카테고리 부재');
    if (getAttributeStatus() !== 'good') issues.push('프로필 속성 세팅 미흡');
    if (getRankStatus() !== 'good') issues.push('로컬팩 상위노출 실패');
    if (getResponseRateStatus() !== 'good') issues.push('리뷰 응답률 저조');
    if (getPostStatus() !== 'good') issues.push('게시물 업데이트 부재');
    return issues;
  };

  const mainIssues = getMainIssues();
  const headlineIssue = mainIssues[0] || '전반적인 프로필 최적화 필요';

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm leading-relaxed" style={{ fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      {/* 헤더 */}
      <div className="border-b-4 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Google Business Profile 심층 진단 보고서</h1>
        <div className="text-slate-600 space-y-1">
          <p><strong>Target Business:</strong> {business.name}</p>
          <p><strong>Date:</strong> {formatDate(new Date())}</p>
          <p><strong>Auditor:</strong> 주식회사 스트라디지 대표 정영훈</p>
        </div>
      </div>

      {/* 진단 요약 */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
        <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
          🚨 진단 요약
        </h2>
        <p className="text-red-800 font-bold text-lg mb-3">"{headlineIssue}"</p>
        <p className="text-slate-700">
          현재 프로필 상태는 {mainIssues.length}개의 핵심 문제점이 발견됨.
          {getRankStatus() !== 'good' && ' 주요 키워드에서 로컬팩 진입에 실패하고 있어 잠재 고객 노출이 제한됨.'}
          {getResponseRateStatus() !== 'good' && ` 리뷰 응답률이 ${responseRate.toFixed(0)}%로 저조하여 고객 신뢰도 구축에 실패하고 있음.`}
          {getPostStatus() !== 'good' && ' 게시물 업데이트 공백으로 알고리즘 활성 지수가 하락 중임.'}
          이 상태가 지속될 경우 검색 노출 감소 및 매출 손실이 불가피함.
        </p>
      </div>

      {/* 1. 기초 정보 세팅 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 pb-2 mb-4">
          1. 기초 정보 세팅
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-3 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-3 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-3 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">비즈니스 이름</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getNameStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getNameStatus() === 'good' ? '다국어 SEO 최적화됨' : '상호명 불일치'}]</p>
                <p className="text-slate-600 mt-1">현재 상호: {business.name}</p>
                <p className="text-slate-600">감지된 언어: {detectedLanguages.length > 0 ? detectedLanguages.join(', ') : '단일 언어만 감지'}</p>
                {getNameStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 일본어/영어/한국어 혼합 상호명으로 다국어 검색 대응력 강화 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">카테고리 최적화</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getCategoryStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getCategoryStatus() === 'good' ? '카테고리 최적화됨' : '서브 카테고리 부재'}]</p>
                <p className="text-slate-600 mt-1">현재 카테고리: {business.category}</p>
                {additionalCategories.length > 0 && (
                  <p className="text-slate-600">서브 카테고리: {additionalCategories.join(', ')}</p>
                )}
                {getCategoryStatus() !== 'good' && (
                  <>
                    <p className="text-red-600 mt-1">• 문제점: 서브 카테고리 {additionalCategories.length}개만 설정됨 (권장 2-3개)</p>
                    <p className="text-red-600">• 긴급 수정: 업종 관련 서브 카테고리 추가 필요</p>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">프로필 속성 세팅</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getAttributeStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getAttributeStatus() === 'good' ? '속성 설정 완료' : '속성 설정 미흡'}]</p>
                <p className="text-slate-600 mt-1">현재 설정된 속성: {attributes.length}개</p>
                {getAttributeStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 서비스 옵션, 편의시설, 결제 방법 등 필수 속성 추가 필요</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 2. 평판 및 키워드 분석 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 pb-2 mb-4">
          2. 평판 및 키워드 분석
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-3 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-3 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-3 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">상위노출</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getRankStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getRankStatus() === 'good' ? '로컬팩 진입 성공' : getRankStatus() === 'warning' ? '10위권 진입' : '로컬팩 진입 실패'}]</p>
                {bestRank ? (
                  <>
                    <p className="text-slate-600 mt-1">검색 키워드 "{teleportKeyword}" 기준 최고 순위: {bestRank}위</p>
                    {getRankStatus() !== 'good' && (
                      <p className="text-red-600 mt-1">• 문제점: 로컬팩(1-3위) 진입 실패로 잠재 고객 노출 제한</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-600 mt-1">순위 체크 데이터 없음 - Teleport 분석 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">리뷰 키워드</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getKeywordStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getKeywordStatus() === 'good' ? '키워드 풍부' : '키워드 부족'}]</p>
                {topKeywords.length > 0 ? (
                  <p className="text-slate-600 mt-1">고객 리뷰 키워드: {topKeywords.join(', ')}</p>
                ) : (
                  <p className="text-slate-600 mt-1">리뷰에서 추출된 키워드 없음</p>
                )}
                {getKeywordStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 메뉴명, 서비스명이 포함된 리뷰 유도 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">외국인 구매의향</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getForeignReviewStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getForeignReviewStatus() === 'good' ? '글로벌 타겟팅 양호' : '외국인 리뷰 부족'}]</p>
                <p className="text-slate-600 mt-1">외국어 리뷰 비율: {foreignReviewRatio}% ({foreignReviews.length}개 / {reviewData?.reviews?.length || 0}개)</p>
                {getForeignReviewStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 외국인 관광객 대상 리뷰 요청 캠페인 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">응답률</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getResponseRateStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getResponseRateStatus() === 'good' ? '응답률 양호' : '응답률 저조'}]</p>
                <p className="text-slate-600 mt-1">현재 응답률: {responseRate.toFixed(1)}%</p>
                {getResponseRateStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 리뷰 답글 시 SEO 키워드 자연스럽게 포함하여 신뢰도 및 노출 강화</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 3. 시각적 전환율 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 pb-2 mb-4">
          3. 시각적 전환율
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-3 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-3 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-3 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">배경사진</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(business.mainImage ? 'good' : 'bad')}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{business.mainImage ? '대표 사진 설정됨' : '대표 사진 미설정'}]</p>
                {!business.mainImage && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 비즈니스 정체성을 대변하는 고화질 대표 이미지 설정 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">유저 콘텐츠</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getPhotoStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getPhotoStatus() === 'good' ? '사진 콘텐츠 풍부' : '사진 콘텐츠 부족'}]</p>
                <p className="text-slate-600 mt-1">총 사진 수: {photos}장</p>
                {getPhotoStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 고객 사진 업로드 유도 및 오너 사진 추가 필요</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 4. 알고리즘 신호 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 pb-2 mb-4">
          4. 알고리즘 신호
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-3 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-3 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-3 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">주기적 업데이트</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getPostStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getPostStatus() === 'good' ? '게시물 활성화' : getPostStatus() === 'warning' ? '게시물 갱신 필요' : '게시물 공백'}]</p>
                <p className="text-slate-600 mt-1">마지막 게시물: {lastPostDate || '확인 필요'} ({postCount}개)</p>
                {getPostStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 주 2-3회 게시물 발행으로 알고리즘 활성 지수 회복 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-2 font-medium">업장 설명</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{getStatusIcon(getDescriptionStatus())}</td>
              <td className="border border-slate-300 px-3 py-2">
                <p className="font-bold text-slate-700">[{getDescriptionStatus() === 'good' ? '설명 최적화됨' : '설명 부족'}]</p>
                <p className="text-slate-600 mt-1">현재 설명 길이: {description.length}자</p>
                {getDescriptionStatus() !== 'good' && (
                  <p className="text-red-600 mt-1">• 긴급 수정: 키워드 포함 150자 이상의 상세 설명 작성 필요</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 총평 및 액션플랜 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 pb-2 mb-4">
          🚨 총평 및 액션플랜
        </h2>

        <div className="bg-slate-100 p-4 rounded mb-4">
          <h3 className="font-bold text-slate-800 mb-2">📉 현재 상태 요약</h3>
          <p className="text-slate-700 font-bold mb-2">
            "{mainIssues.length >= 4 ? '즉각적인 프로필 전면 개편이 필요한 위험 상태' :
              mainIssues.length >= 2 ? '핵심 영역 개선이 시급한 상태' :
              '세부 최적화가 필요한 상태'}"
          </p>
          <p className="text-slate-600">
            현재 상태 유지 시 검색 노출 감소 및 잠재 고객 이탈이 지속될 것으로 예상됨.
            즉각적인 개선 조치를 통해 로컬 검색 경쟁력을 확보해야 함.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded">
          <h3 className="font-bold text-orange-800 mb-3">🔥 가장 시급한 3가지 실행 과제</h3>
          <ol className="space-y-3">
            {mainIssues.slice(0, 3).map((issue, index) => (
              <li key={index} className="text-slate-700">
                <p className="font-bold">{index + 1}. {issue}</p>
                <p className="text-slate-600 ml-4 mt-1">
                  {issue.includes('상호명') && '• 일본어/영어/한국어 혼합 상호명으로 다국어 검색 대응력 강화. 외국인 관광객 유입 증가 기대.'}
                  {issue.includes('카테고리') && '• 메인 카테고리 외 관련 서브 카테고리 2-3개 추가. 다양한 검색 쿼리에서 노출 확대.'}
                  {issue.includes('속성') && '• 서비스 옵션, 편의시설, 결제 방법 등 업종 필수 속성 전수 입력. 정보 완성도 상승으로 클릭률 향상.'}
                  {issue.includes('로컬팩') && '• 리뷰 수 및 평점 관리, NAP 일관성 확보, 게시물 활성화로 로컬팩 진입 전략 수립.'}
                  {issue.includes('응답률') && '• 모든 리뷰에 24시간 내 키워드 포함 답글 작성. 고객 신뢰도 및 SEO 효과 동시 확보.'}
                  {issue.includes('게시물') && '• 주 2-3회 이벤트, 메뉴, 후기 등 게시물 발행. 알고리즘 활성 지수 회복 및 노출 증가.'}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 푸터 */}
      <div className="border-t-2 border-slate-300 pt-4 mt-8 text-center text-slate-500 text-xs">
        <p>본 보고서는 주식회사 스트라디지에서 제공하는 GBP 심층 진단 서비스입니다.</p>
        <p>문의: contact@stradigi.co.kr</p>
      </div>
    </div>
  );
});

PDFReport.displayName = 'PDFReport';

export default PDFReport;
