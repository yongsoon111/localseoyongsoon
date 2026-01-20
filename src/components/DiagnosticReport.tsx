'use client';

import { BusinessInfo, ReviewAudit, TeleportResult } from '@/types';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DiagnosticReportProps {
  business: BusinessInfo;
  reviewData: ReviewAudit | null;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
}

type Status = 'good' | 'warning' | 'bad' | 'unknown';

// 간단한 마크다운 변환 함수
function parseMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 테이블 감지: | 로 시작하고 끝나는 줄
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // 구분선인지 확인 (|---|---|)
      if (/^\|[\s\-:|\s]+\|$/.test(trimmedLine)) {
        continue; // 구분선 스킵
      }

      // 테이블 데이터 행
      const cells = trimmedLine.slice(1, -1).split('|').map(c => c.trim());

      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(cells);
    } else {
      // 테이블 종료
      if (inTable && tableRows.length > 0) {
        result.push(renderTable(tableRows));
        tableRows = [];
        inTable = false;
      }

      // 일반 줄 처리
      result.push(parseLine(trimmedLine));
    }
  }

  // 마지막 테이블 처리
  if (inTable && tableRows.length > 0) {
    result.push(renderTable(tableRows));
  }

  return '<div class="text-slate-700 leading-relaxed">' + result.join('') + '</div>';
}

// 테이블 렌더링
function renderTable(rows: string[][]): string {
  if (rows.length === 0) return '';

  let html = '<table class="w-full border-collapse my-4 shadow-sm">';

  // 첫 번째 행은 헤더
  html += '<thead class="bg-slate-100"><tr>';
  html += rows[0].map(cell => `<th class="border border-slate-300 px-4 py-3 text-left font-bold text-slate-900">${parseInline(cell)}</th>`).join('');
  html += '</tr></thead>';

  // 나머지 행은 본문
  if (rows.length > 1) {
    html += '<tbody>';
    for (let i = 1; i < rows.length; i++) {
      html += '<tr class="hover:bg-slate-50">';
      html += rows[i].map(cell => `<td class="border border-slate-300 px-4 py-3 text-slate-700">${parseInline(cell)}</td>`).join('');
      html += '</tr>';
    }
    html += '</tbody>';
  }

  html += '</table>';
  return html;
}

// 인라인 마크다운 (굵은 글씨, 이모지 등)
function parseInline(text: string): string {
  // 굵은 글씨
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  return text;
}

// 한 줄 파싱
function parseLine(line: string): string {
  if (!line) return '<br />';

  // 헤더
  if (line.startsWith('## ')) {
    return `<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4 pb-3 border-b-2 border-slate-200">${parseInline(line.slice(3))}</h2>`;
  }
  if (line.startsWith('### ')) {
    return `<h3 class="text-xl font-semibold text-slate-800 mt-6 mb-3">${parseInline(line.slice(4))}</h3>`;
  }
  if (line.startsWith('#### ')) {
    return `<h4 class="text-lg font-semibold text-slate-700 mt-4 mb-2">${parseInline(line.slice(5))}</h4>`;
  }

  // 인용문 ("..." 형식)
  if (/^"(.+)"$/.test(line)) {
    const match = line.match(/^"(.+)"$/);
    if (match) {
      return `<blockquote class="border-l-4 border-red-500 bg-red-50 pl-4 py-2 my-3 text-lg font-semibold text-red-900 italic">"${match[1]}"</blockquote>`;
    }
  }

  // 번호 리스트 (1. **제목**)
  const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/);
  if (numberedMatch) {
    return `<div class="flex gap-3 my-4"><div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">${numberedMatch[1]}</div><div class="flex-1"><p class="font-bold text-slate-900 mb-1">${numberedMatch[2]}</p><p class="text-sm text-slate-600">${parseInline(numberedMatch[3])}</p></div></div>`;
  }

  // 일반 번호 리스트
  const simpleNumberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (simpleNumberedMatch) {
    return `<div class="flex gap-3 my-2"><div class="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">${simpleNumberedMatch[1]}</div><div class="flex-1">${parseInline(simpleNumberedMatch[2])}</div></div>`;
  }

  // 불릿 리스트
  if (line.startsWith('- ') || line.startsWith('• ')) {
    return `<li class="ml-6 my-2 text-slate-700 list-disc">${parseInline(line.slice(2))}</li>`;
  }

  // 구분선
  if (line === '---') {
    return '<hr class="my-6 border-slate-300">';
  }

  // 일반 텍스트
  return `<p class="mb-3 text-slate-700 leading-relaxed">${parseInline(line)}</p>`;
}

function StatusBadge({ status }: { status: Status }) {
  const badges = {
    good: { text: '양호', bg: 'bg-green-100', color: 'text-green-700', border: 'border-green-300' },
    warning: { text: '주의', bg: 'bg-yellow-100', color: 'text-yellow-700', border: 'border-yellow-300' },
    bad: { text: '위험', bg: 'bg-red-100', color: 'text-red-700', border: 'border-red-300' },
    unknown: { text: '미확인', bg: 'bg-gray-100', color: 'text-gray-500', border: 'border-gray-300' },
  };
  const badge = badges[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${badge.bg} ${badge.color} border ${badge.border}`}>
      {badge.text}
    </span>
  );
}

export function DiagnosticReport({
  business,
  reviewData,
  teleportResults,
  teleportKeyword,
}: DiagnosticReportProps) {
  const today = new Date().toISOString().split('T')[0];

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const generateAiReport = async () => {
    setLoadingAi(true);
    setAiError(null);

    try {
      // Gemini에게 전달할 데이터 구조 생성
      const auditData = {
        business: {
          name: business.name,
          category: business.category,
          address: business.address,
          phone: business.phone,
          website: business.website,
          rating: business.rating,
          reviewCount: business.reviewCount,
          photos: business.photos,
          openingHours: business.openingHours,
        },
        reviews: reviewData ? {
          total: business.reviewCount,
          avgRating: reviewData.analysis.avgRating,
          responseRate: reviewData.analysis.responseRate,
          ratingDistribution: reviewData.analysis.ratingDistribution,
          keywords: reviewData.analysis.keywords.map(k => k.keyword),
          recentReviews: reviewData.reviews.slice(0, 10).map(r => ({
            rating: r.rating,
            text: r.text,
            time: r.date,
            ownerResponse: r.ownerResponse,
          })),
        } : undefined,
        teleportData: teleportResults.map(t => ({
          keyword: teleportKeyword,
          avgRank: t.rank || 999,
          bestRank: t.rank || 999,
          worstRank: t.rank || 999,
          inLocalPack: t.rank ? t.rank <= 3 : false,
        })),
      };

      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI 보고서 생성 실패');
      }

      const data = await response.json();
      setAiReport(data.report);
    } catch (error) {
      console.error('AI report generation error:', error);
      setAiError(error instanceof Error ? error.message : 'AI 보고서 생성 중 오류가 발생했습니다');
    } finally {
      setLoadingAi(false);
    }
  };

  // 경쟁사 데이터
  const competitors = teleportResults[0]?.competitors?.filter(c => c.placeId !== business.placeId) || [];
  const myRank = teleportResults[0]?.rank || null;
  const topCompetitor = competitors[0];

  // 응답률
  const responseRate = reviewData?.analysis.responseRate || 0;

  // 상태 판단 함수들
  const getNameStatus = (): Status => {
    if (!business.name) return 'bad';
    // 영문 포함 여부 체크 (외국인 타겟용)
    const hasEnglish = /[a-zA-Z]/.test(business.name);
    return hasEnglish ? 'good' : 'warning';
  };

  const getCategoryStatus = (): Status => {
    if (!business.category || business.category === 'unknown') return 'bad';
    return 'good';
  };

  const getRankStatus = (): Status => {
    if (!myRank) return 'unknown';
    if (myRank <= 3) return 'good';
    if (myRank <= 10) return 'warning';
    return 'bad';
  };

  const getKeywordStatus = (): Status => {
    if (!reviewData) return 'unknown';
    if (reviewData.analysis.keywords.length >= 10) return 'good';
    if (reviewData.analysis.keywords.length >= 5) return 'warning';
    return 'bad';
  };

  const getResponseStatus = (): Status => {
    if (!reviewData) return 'unknown';
    if (responseRate >= 80) return 'good';
    if (responseRate >= 50) return 'warning';
    return 'bad';
  };

  const getRatingStatus = (): Status => {
    if (business.rating >= 4.5) return 'good';
    if (business.rating >= 4.0) return 'warning';
    return 'bad';
  };

  const getReviewCountStatus = (): Status => {
    if (business.reviewCount >= 100) return 'good';
    if (business.reviewCount >= 30) return 'warning';
    return 'bad';
  };

  // 핵심 문제점 생성
  const generateHeadline = () => {
    const issues: string[] = [];
    if (getRankStatus() === 'bad') issues.push('검색 노출 실패');
    if (getResponseStatus() === 'bad') issues.push('리뷰 응답 부재');
    if (getReviewCountStatus() === 'bad') issues.push('리뷰 수 부족');
    if (getRatingStatus() === 'bad') issues.push('평점 저조');

    if (issues.length === 0) return '전반적으로 양호하나 지속적 관리 필요';
    return issues.slice(0, 2).join(' + ') + '으로 인한 잠재 고객 이탈 심각';
  };

  // 진단 요약 서술
  const generateSummary = () => {
    const lines: string[] = [];

    if (myRank && myRank > 3) {
      lines.push(`현재 "${teleportKeyword}" 키워드 검색 시 ${myRank}위에 노출되고 있어, 로컬팩(상위 3개) 진입에 실패한 상태임.`);
      lines.push(`Google 검색 사용자의 약 92%가 로컬팩 내 업체만 클릭하므로, 현재 순위에서는 대부분의 잠재 고객이 경쟁사로 이탈하고 있음.`);
    }

    if (responseRate < 50 && reviewData) {
      lines.push(`리뷰 응답률이 ${responseRate.toFixed(0)}%로 매우 낮아, 고객 신뢰도 및 재방문율에 부정적 영향을 미치고 있음.`);
    }

    if (business.reviewCount < 50) {
      lines.push(`누적 리뷰 수가 ${business.reviewCount}개로 경쟁사 대비 신뢰도 열위 상태임.`);
    }

    if (lines.length === 0) {
      lines.push('기본적인 프로필 설정은 완료되었으나, 경쟁사 대비 우위를 점하기 위해서는 적극적인 리뷰 관리와 콘텐츠 업데이트가 필요함.');
    }

    return lines;
  };

  return (
    <div className="space-y-6">
      {/* AI 보고서 생성 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 진단 보고서</CardTitle>
        </CardHeader>
        <CardContent>
          {!aiReport && !loadingAi && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Gemini AI를 활용하여 전문적인 GMB 진단 보고서를 생성합니다.
              </p>
              <div className="flex gap-2">
                <Button onClick={generateAiReport} size="lg">
                  AI 보고서 생성
                </Button>
                <Button onClick={() => setShowManual(!showManual)} variant="outline" size="lg">
                  수동 보고서 {showManual ? '숨기기' : '보기'}
                </Button>
              </div>
            </div>
          )}

          {loadingAi && (
            <div className="flex items-center gap-3 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-blue-600" />
              <p className="text-gray-600">AI 보고서 생성 중...</p>
            </div>
          )}

          {aiError && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800">{aiError}</p>
              <Button onClick={generateAiReport} variant="outline" size="sm" className="mt-2">
                다시 시도
              </Button>
            </div>
          )}

          {aiReport && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-600 font-medium">✓ AI 보고서가 생성되었습니다</p>
                <div className="flex gap-2">
                  <Button onClick={generateAiReport} variant="outline" size="sm">
                    다시 생성
                  </Button>
                  <Button onClick={() => setShowManual(!showManual)} variant="outline" size="sm">
                    수동 보고서 {showManual ? '숨기기' : '보기'}
                  </Button>
                </div>
              </div>
              <div className="max-w-none bg-white border-2 border-slate-200 rounded-lg p-8 shadow-sm">
                <div
                  id="ai-report-content"
                  className="ai-report-content"
                  style={{ fontSize: '15px', lineHeight: '1.7' }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(aiReport) }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 기존 수동 보고서 */}
      {showManual && (
        <div className="bg-white text-slate-800 max-w-4xl mx-auto p-8 space-y-8 border rounded-lg">

      {/* 헤더 */}
      <div className="border-b-4 border-slate-800 pb-6">
        <h1 className="text-2xl font-black mb-4">📊 Google Business Profile 심층 진단 보고서</h1>
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Target Business:</span> {business.name}</p>
          <p><span className="font-semibold">Date:</span> {today}</p>
          <p><span className="font-semibold">Auditor:</span> 주식회사 스트라디지 대표 정영훈</p>
        </div>
      </div>

      {/* 진단 요약 */}
      <div className="bg-red-50 border-l-4 border-red-500 p-6">
        <h2 className="text-xl font-bold mb-3">🚨 진단 요약</h2>
        <p className="text-lg font-bold text-red-800 mb-4">
          &ldquo;{generateHeadline()}&rdquo;
        </p>
        <div className="text-slate-700 space-y-2">
          {generateSummary().map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* 1. 기초 정보 세팅 */}
      <div>
        <h2 className="text-lg font-bold border-b-2 border-slate-300 pb-2 mb-4">1. 기초 정보 세팅</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-4 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-4 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">비즈니스 이름</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getNameStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">현재 상호: {business.name}</p>
                {getNameStatus() === 'warning' && (
                  <p className="text-sm text-amber-700 mt-1">• 영문 상호 미포함으로 외국인 검색 대응력 부족. 영문명 병기 권장</p>
                )}
                {getNameStatus() === 'good' && (
                  <p className="text-sm text-green-700 mt-1">• 국문/영문 상호 설정 완료</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">카테고리 최적화</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getCategoryStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[{getCategoryStatus() === 'good' ? '적정' : '점검 필요'}]</p>
                <p className="mt-1">현재 카테고리: <span className="font-semibold">{business.category || '미설정'}</span></p>
                {getCategoryStatus() !== 'good' && (
                  <>
                    <p className="text-sm text-red-700 mt-1">• 문제점: 카테고리 미설정 또는 검색어와 불일치 가능성</p>
                    <p className="text-sm text-blue-700 mt-1">• 긴급 수정: 업종에 맞는 메인 카테고리 및 서브 카테고리 설정 필요</p>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">프로필 속성 세팅</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="warning" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">아래 항목 중 누락 여부 확인 필요:</p>
                <div className="text-sm text-slate-600 mt-2 grid grid-cols-2 gap-1">
                  <span>• 서비스 옵션 (매장식사/포장/배달)</span>
                  <span>• 접근성 (휠체어 이용 가능)</span>
                  <span>• 편의시설 (Wi-Fi/화장실)</span>
                  <span>• 결제 방법 (카드/현금/모바일)</span>
                  <span>• 예약 가능 여부</span>
                  <span>• 특수 식단 (채식/비건/할랄)</span>
                </div>
                <p className="text-sm text-red-700 mt-2">• 속성 누락 시 Google 필터 검색에서 제외되어 노출 기회 상실</p>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">연락처 정보</td>
              <td className="border border-slate-300 px-4 py-3 text-center">
                <StatusBadge status={business.phone && business.website ? 'good' : business.phone ? 'warning' : 'bad'} />
              </td>
              <td className="border border-slate-300 px-4 py-3">
                <p>전화번호: <span className={business.phone ? 'text-green-700' : 'text-red-700'}>{business.phone || '미설정 ❌'}</span></p>
                <p>웹사이트: <span className={business.website ? 'text-green-700' : 'text-amber-700'}>{business.website ? '연결됨 ✓' : '미연결'}</span></p>
                <p>주소: <span className={business.address ? 'text-green-700' : 'text-red-700'}>{business.address ? '설정됨 ✓' : '미설정 ❌'}</span></p>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">영업시간</td>
              <td className="border border-slate-300 px-4 py-3 text-center">
                <StatusBadge status={business.openingHours.length > 0 ? 'good' : 'warning'} />
              </td>
              <td className="border border-slate-300 px-4 py-3">
                {business.openingHours.length > 0 ? (
                  <p className="text-green-700">설정 완료 ({business.openingHours.length}일 정보 등록)</p>
                ) : (
                  <p className="text-amber-700">미설정 - 고객이 방문 전 영업 여부 확인 불가로 이탈 발생</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. 평판 및 키워드 분석 */}
      <div>
        <h2 className="text-lg font-bold border-b-2 border-slate-300 pb-2 mb-4">2. 평판 및 키워드 분석</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-4 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-4 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">상위노출</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getRankStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                {myRank ? (
                  <>
                    <p className="font-medium">[{getRankStatus() === 'good' ? '양호' : getRankStatus() === 'warning' ? '개선 필요' : '심각'}]</p>
                    <p className="mt-1">키워드 &ldquo;{teleportKeyword}&rdquo; 검색 시 <span className="font-bold text-lg">{myRank}위</span> 노출</p>
                    {myRank > 3 && (
                      <>
                        <p className="text-sm text-red-700 mt-2">• 로컬팩(상위 3개) 미진입으로 클릭률 급감</p>
                        <p className="text-sm text-red-700">• 1위 경쟁사: {topCompetitor?.name || '-'} (★{topCompetitor?.rating.toFixed(1) || '-'})</p>
                      </>
                    )}
                    {competitors.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">상위 경쟁사 현황:</p>
                        {competitors.slice(0, 3).map((c, i) => (
                          <p key={i} className="text-slate-600">  {c.rank}위: {c.name} (★{c.rating.toFixed(1)})</p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">순위 체크 탭에서 키워드 검색 후 데이터 반영</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">평점</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getRatingStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[{getRatingStatus() === 'good' ? '우수' : getRatingStatus() === 'warning' ? '관리 필요' : '심각'}]</p>
                <p className="mt-1">현재 평점: <span className="font-bold text-2xl">★ {business.rating.toFixed(1)}</span></p>
                {business.rating < 4.5 && (
                  <p className="text-sm text-amber-700 mt-1">• 4.5점 이상 유지 시 클릭률 및 전환율 상승 효과</p>
                )}
                {topCompetitor && business.rating < topCompetitor.rating && (
                  <p className="text-sm text-red-700 mt-1">• 1위 경쟁사({topCompetitor.name}) 평점 {topCompetitor.rating.toFixed(1)}점 대비 {(topCompetitor.rating - business.rating).toFixed(1)}점 열위</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">리뷰 수</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getReviewCountStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[{getReviewCountStatus() === 'good' ? '충분' : getReviewCountStatus() === 'warning' ? '보통' : '부족'}]</p>
                <p className="mt-1">누적 리뷰: <span className="font-bold text-2xl">{business.reviewCount.toLocaleString()}개</span></p>
                {business.reviewCount < 100 && (
                  <p className="text-sm text-amber-700 mt-1">• 100개 이상 확보 시 신뢰도 및 검색 순위 상승 효과</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">리뷰 키워드</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getKeywordStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                {reviewData ? (
                  <>
                    <p className="font-medium">[{getKeywordStatus() === 'good' ? '양호' : '개선 필요'}]</p>
                    <p className="mt-1">감지된 키워드: {reviewData.analysis.keywords.length}개</p>
                    {reviewData.analysis.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {reviewData.analysis.keywords.slice(0, 8).map((kw, i) => (
                          <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-sm">
                            {kw.keyword} ({kw.count})
                          </span>
                        ))}
                      </div>
                    )}
                    {reviewData.analysis.keywords.length < 10 && (
                      <p className="text-sm text-amber-700 mt-2">• 리뷰 내 업종/메뉴/서비스 관련 키워드 부족 - 고객에게 키워드 포함 리뷰 유도 필요</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">리뷰 분석 탭에서 데이터 로드 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">응답률</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status={getResponseStatus()} /></td>
              <td className="border border-slate-300 px-4 py-3">
                {reviewData ? (
                  <>
                    <p className="font-medium">[{getResponseStatus() === 'good' ? '우수' : getResponseStatus() === 'warning' ? '개선 필요' : '심각'}]</p>
                    <p className="mt-1">현재 응답률: <span className="font-bold text-2xl">{responseRate.toFixed(0)}%</span></p>
                    {responseRate < 80 && (
                      <>
                        <p className="text-sm text-red-700 mt-1">• 리뷰 답글을 통한 SEO 키워드 주입 기회 상실</p>
                        <p className="text-sm text-red-700">• 무응답 리뷰는 잠재 고객에게 '관리 부재' 인상 전달</p>
                        <p className="text-sm text-blue-700 mt-1">• 권장: 모든 리뷰에 24시간 이내 답변, 답변 내 핵심 키워드 포함</p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">리뷰 분석 탭에서 데이터 로드 필요</p>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">외국인 구매의향</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="unknown" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">• 영문 리뷰 수량 및 내용의 구체성 확인 필요</p>
                <p className="text-sm text-slate-600">• 글로벌 타겟팅 시 영문 리뷰 유도 전략 수립 권장</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. 시각적 전환율 */}
      <div>
        <h2 className="text-lg font-bold border-b-2 border-slate-300 pb-2 mb-4">3. 시각적 전환율</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-4 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-4 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">배경사진</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="unknown" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">• 비즈니스 정체성을 대변하는 고화질 이미지 사용 여부 확인</p>
                <p className="text-sm text-slate-600">• 권장: 1920x1080 이상, 업장 대표 이미지 또는 시그니처 메뉴/서비스 이미지</p>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">유저 콘텐츠</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="unknown" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">• 고객 업로드 사진의 양과 질이 신규 고객 신뢰도에 직접적 영향</p>
                <p className="text-sm text-slate-600">• 부정적 이미지(위생 문제 등) 포함 여부 모니터링 필요</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. 알고리즘 신호 */}
      <div>
        <h2 className="text-lg font-bold border-b-2 border-slate-300 pb-2 mb-4">4. 알고리즘 신호</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2 text-left w-32">항목</th>
              <th className="border border-slate-300 px-4 py-2 text-center w-16">상태</th>
              <th className="border border-slate-300 px-4 py-2 text-left">진단 및 핵심 문제점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">주기적 업데이트</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="unknown" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">• 마지막 게시물 발행일 확인 필요</p>
                <p className="text-sm text-slate-600">• 게시물 공백 7일 이상 시 알고리즘 활성 지수 하락</p>
                <p className="text-sm text-blue-700 mt-1">• 권장: 주 2-3회 게시물 발행 (이벤트, 메뉴 소개, 후기 등)</p>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-4 py-3 font-medium">업장 설명</td>
              <td className="border border-slate-300 px-4 py-3 text-center"><StatusBadge status="unknown" /></td>
              <td className="border border-slate-300 px-4 py-3">
                <p className="font-medium">[수동 확인 필요]</p>
                <p className="text-sm text-slate-600 mt-1">• 설명글 내 핵심 키워드(업종명, 지역명, 특장점) 배치 여부</p>
                <p className="text-sm text-slate-600">• 예약/홈페이지 링크 정상 작동 여부 점검</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 총평 및 액션플랜 */}
      <div className="bg-slate-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🚨 총평 및 액션플랜</h2>

        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">📉 현재 상태 요약</h3>
          <p className="text-lg font-bold text-red-800 mb-2">
            &ldquo;{generateHeadline()}&rdquo;
          </p>
          <p className="text-slate-700">
            현재 상태 유지 시 경쟁사 대비 검색 노출 열위가 지속되며, 이로 인한 잠재 고객 이탈 및 매출 손실이 누적될 것으로 예상됨.
            아래 실행 과제의 즉각적인 이행이 필요함.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">🔥 가장 시급한 3가지 실행 과제</h3>
          <div className="space-y-4">
            {getResponseStatus() !== 'good' && reviewData && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-bold">리뷰 응답률 즉시 개선</p>
                  <p className="text-sm text-slate-600 mt-1">
                    • 모든 미응답 리뷰에 24시간 이내 답변 작성. 답변 내 &ldquo;{business.category}&rdquo;, 지역명, 대표 서비스명 등 핵심 키워드 자연스럽게 포함하여 SEO 신호 강화. 목표 응답률 90% 이상.
                  </p>
                </div>
              </div>
            )}
            {getRankStatus() !== 'good' && myRank && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-bold">검색 순위 개선 (현재 {myRank}위 → 목표 3위 이내)</p>
                  <p className="text-sm text-slate-600 mt-1">
                    • 카테고리 및 속성 최적화, 리뷰 내 키워드 언급 유도, 주기적 게시물 발행을 통해 로컬팩 진입. 예상 소요 기간: 4-8주.
                  </p>
                </div>
              </div>
            )}
            {getReviewCountStatus() !== 'good' && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-bold">리뷰 수 확보 캠페인</p>
                  <p className="text-sm text-slate-600 mt-1">
                    • 현재 {business.reviewCount}개 → 단기 목표 100개. 서비스 완료 후 리뷰 요청 프로세스 구축, QR코드/문자 발송 등 적극적 유도. 월 20-30개 신규 리뷰 확보 목표.
                  </p>
                </div>
              </div>
            )}
            {getResponseStatus() === 'good' && getRankStatus() === 'good' && getReviewCountStatus() === 'good' && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">✓</div>
                <div>
                  <p className="font-bold">현재 상태 유지 및 모니터링</p>
                  <p className="text-sm text-slate-600 mt-1">
                    • 주 1회 이상 게시물 업데이트, 리뷰 실시간 모니터링 및 응답, 경쟁사 동향 파악 지속.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div className="border-t-2 border-slate-300 pt-6 text-center text-sm text-slate-500">
        <p>본 보고서는 Google Business Profile 공개 데이터를 기반으로 작성되었습니다.</p>
        <p className="mt-1">© 주식회사 스트라디지 | contact@stradegy.co.kr</p>
      </div>

        </div>
      )}
    </div>
  );
}
