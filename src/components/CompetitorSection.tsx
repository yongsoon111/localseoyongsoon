'use client';

import React, { useState } from 'react';
import {
  Users, Trophy, Star, Lightbulb,
  ChevronRight, Info, Radar, AlertCircle, Search,
  MessageSquare, X, ThumbsDown, Loader2, ExternalLink,
  TrendingDown, AlertTriangle
} from 'lucide-react';
import { ThemeType, BusinessInfo, CompetitorAnalysis, CompetitorReview } from '@/types';
import { useAuditStore } from '@/stores/audit-store';

interface CompetitorReviewData {
  placeId: string;
  name: string;
  rating: number;
  totalReviews: number;
  reviews: CompetitorReview[];
  negativeReviews: CompetitorReview[];
  features: string[];
}

interface CompetitorSectionProps {
  business: BusinessInfo;
  theme: ThemeType;
}

export function CompetitorSection({ business, theme }: CompetitorSectionProps) {
  const {
    competitorData,
    competitorLoading: loading,
    competitorError: error,
    fetchCompetitors,
  } = useAuditStore();

  const isDarkTheme = theme !== 'light';
  const [keyword, setKeyword] = useState('');

  // 리뷰 관련 상태
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorAnalysis | null>(null);
  const [competitorReviews, setCompetitorReviews] = useState<CompetitorReviewData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // 경쟁사 리뷰 조회
  const fetchCompetitorReviews = async (competitor: CompetitorAnalysis) => {
    if (!competitor.placeId) {
      setReviewsError('장소 ID가 없습니다');
      return;
    }

    setSelectedCompetitor(competitor);
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const response = await fetch(`/api/competitor-reviews?placeId=${competitor.placeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '리뷰 조회 실패');
      }

      setCompetitorReviews(data);
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : '리뷰 조회 중 오류 발생');
    } finally {
      setReviewsLoading(false);
    }
  };

  // 모달 닫기
  const closeReviewModal = () => {
    setSelectedCompetitor(null);
    setCompetitorReviews(null);
    setReviewsError(null);
  };

  // 경쟁사 분석 실행
  const handleAnalyze = () => {
    if (keyword.trim()) {
      fetchCompetitors(keyword.trim());
    }
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyword.trim()) {
      handleAnalyze();
    }
  };

  // 경쟁사 데이터 or 기본값
  const competitors: CompetitorAnalysis[] = competitorData?.competitors || [
    { id: 'me', name: `${business.name} (나)`, rating: business.rating, reviews: business.reviewCount, photos: business.photos, distance: '-', features: ['정보없음'], isMe: true, placeId: business.placeId },
  ];

  // 정렬: 리뷰 수 기준 내림차순
  const sortedCompetitors = [...competitors].sort((a, b) => b.reviews - a.reviews);

  // API 응답 사용, 없으면 계산
  const summary = competitorData?.summary || {
    total: competitors.length,
    avgRating: competitors.length > 0
      ? parseFloat((competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length).toFixed(1))
      : 0,
    avgReviews: competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + c.reviews, 0) / competitors.length)
      : 0,
  };

  // 내 비즈니스 순위 - API 응답 사용
  const myBusiness = sortedCompetitors.find(c => c.isMe);
  const myRanks = competitorData?.myRanks || (myBusiness ? {
    rating: `${sortedCompetitors.filter(c => c.rating > myBusiness.rating).length + 1}위`,
    reviews: `${sortedCompetitors.filter(c => c.reviews > myBusiness.reviews).length + 1}위`,
    photos: `${sortedCompetitors.filter(c => c.photos > myBusiness.photos).length + 1}위`,
    overall: `${Math.round((
      (sortedCompetitors.filter(c => c.rating > myBusiness.rating).length + 1) +
      (sortedCompetitors.filter(c => c.reviews > myBusiness.reviews).length + 1) +
      (sortedCompetitors.filter(c => c.photos > myBusiness.photos).length + 1)
    ) / 3)}위`,
  } : { rating: '-', reviews: '-', photos: '-', overall: '-' });

  // 키워드 입력 UI (분석 전 또는 로딩 중)
  if (!competitorData || loading) {
    return (
      <div className={`rounded-3xl border shadow-sm overflow-hidden ${
        isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-8 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${
              isDarkTheme
                ? 'bg-orange-950/30 border-orange-900/50'
                : 'bg-orange-50 border-orange-100'
            }`}>
              <Users className={`w-6 h-6 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                경쟁사 분석
              </h2>
              <p className={`text-xs mt-1 font-bold uppercase tracking-wider ${
                isDarkTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>
                키워드 기준 • 반경 500m 이내
              </p>
            </div>
          </div>
        </div>

        {/* 키워드 입력 섹션 */}
        <div className="p-8">
          {loading ? (
            // 로딩 UI
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-8">
                <Radar className="w-16 h-16 text-orange-500 animate-pulse" />
                <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full animate-ping" />
              </div>
              <h3 className={`text-xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                경쟁사 마켓 데이터 스캐닝 중...
              </h3>
              <p className={`text-sm mt-3 font-bold uppercase tracking-wider ${
                isDarkTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>
                [Google Places API] &quot;{keyword}&quot; • 반경 500m
              </p>
              <div className="mt-6 flex gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : (
            // 키워드 입력 UI
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                  isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <Search className={`w-8 h-8 ${isDarkTheme ? 'text-orange-400' : 'text-orange-500'}`} />
                </div>
                <h3 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  검색 키워드를 입력하세요
                </h3>
                <p className={`text-sm mt-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  해당 키워드로 반경 500m 내 경쟁사를 검색합니다
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 딤섬 맛집, 중국집, 레스토랑..."
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!keyword.trim()}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    keyword.trim()
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : isDarkTheme
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  분석 시작
                </button>
              </div>

              {error && (
                <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                  isDarkTheme
                    ? 'bg-red-900/20 text-red-400'
                    : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className={`mt-6 p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <p className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  키워드 예시: 업종명(카페, 미용실), 메뉴명(치킨, 피자), 특징(24시간, 배달)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Error Alert */}
      {error && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
          isDarkTheme
            ? 'bg-amber-900/20 border-amber-900/50 text-amber-400'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Overview Section */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden ${
        isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isDarkTheme ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${
              isDarkTheme
                ? 'bg-orange-950/30 border-orange-900/50'
                : 'bg-orange-50 border-orange-100'
            }`}>
              <Users className={`w-6 h-6 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                경쟁사 분석
              </h2>
              <p className={`text-xs mt-1 font-bold uppercase tracking-wider ${
                isDarkTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>
                &quot;{competitorData?.searchKeyword || keyword}&quot; 키워드 • 반경 500m 이내
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                검색된 경쟁사
              </p>
              <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {summary.total}<span className="text-sm ml-0.5 font-bold">개</span>
              </p>
            </div>
            <div className={`w-px h-8 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                평균 평점
              </p>
              <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                ★{summary.avgRating}
              </p>
            </div>
            <div className={`w-px h-8 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                평균 리뷰
              </p>
              <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {summary.avgReviews}<span className="text-sm ml-0.5 font-bold">개</span>
              </p>
            </div>
          </div>
        </div>

        {/* My Business Ranking */}
        <div className={`p-8 ${isDarkTheme ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
          <h3 className={`text-sm font-black flex items-center gap-2 mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            <Trophy className="w-4 h-4 text-yellow-500" />
            내 비즈니스 순위
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '평점 순위', val: myRanks.rating, total: sortedCompetitors.length },
              { label: '리뷰수 순위', val: myRanks.reviews, total: sortedCompetitors.length },
              { label: '사진수 순위', val: myRanks.photos, total: sortedCompetitors.length },
              { label: '종합 순위', val: myRanks.overall, total: sortedCompetitors.length },
            ].map((rank, i) => (
              <div key={i} className={`p-4 rounded-2xl border shadow-sm text-center ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-100'
              }`}>
                <p className={`text-[10px] font-black uppercase mb-1 ${
                  isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {rank.label}
                </p>
                <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {rank.val}
                  <span className={`text-xs ml-1 font-bold ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                    / {rank.total}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Competitors Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
            <thead>
              <tr className={`border-y text-[10px] font-black uppercase tracking-[0.1em] ${
                isDarkTheme
                  ? 'bg-slate-800/50 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
                <th className="px-6 py-4 text-center">순위</th>
                <th className="px-6 py-4">비즈니스명</th>
                <th className="px-6 py-4">평점</th>
                <th className="px-6 py-4">리뷰</th>
                <th className="px-6 py-4">거리</th>
                <th className="px-6 py-4">특징</th>
                <th className="px-6 py-4 text-center">리뷰 분석</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-slate-50'}`}>
              {sortedCompetitors.map((comp, idx) => (
                <tr
                  key={comp.id}
                  className={`transition-colors group font-medium text-sm ${
                    comp.isMe
                      ? isDarkTheme ? 'bg-orange-900/10' : 'bg-orange-50/50'
                      : isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                      comp.isMe
                        ? 'bg-orange-600 text-white'
                        : idx < 3
                          ? isDarkTheme ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                          : isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {comp.isMe ? '⭐' : idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${
                        comp.isMe
                          ? isDarkTheme ? 'text-orange-400' : 'text-orange-700'
                          : isDarkTheme ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {comp.name}
                      </span>
                      {comp.isMe && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                          isDarkTheme
                            ? 'text-orange-400 bg-orange-950'
                            : 'text-orange-600 bg-orange-100'
                        }`}>
                          My Biz
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className={`font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        {comp.rating}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-5 font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    {comp.reviews.toLocaleString()}
                  </td>
                  <td className={`px-6 py-5 font-bold ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {comp.distance}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {comp.features.map((f, i) => (
                        <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDarkTheme
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {!comp.isMe && comp.placeId && (
                      <button
                        onClick={() => fetchCompetitorReviews(comp)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          isDarkTheme
                            ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-900/50'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        리뷰 보기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight Box */}
      <div className={`rounded-3xl border shadow-lg overflow-hidden border-l-8 border-l-blue-500 ${
        isDarkTheme
          ? 'bg-slate-900 border-blue-900/50'
          : 'bg-white border-blue-100'
      }`}>
        <div className="p-8">
          <h2 className={`text-lg font-black flex items-center gap-3 mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            <Lightbulb className="w-6 h-6 text-blue-500" />
            경쟁사 비교 분석 인사이트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <p className={`text-sm leading-relaxed font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  평점은{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                    {business.rating}로 상위권
                  </span>
                  이나, 리뷰 수는 1위 업체 대비{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`}>
                    {sortedCompetitors[0] ? Math.round(business.reviewCount / sortedCompetitors[0].reviews * 100) : 0}% 수준
                  </span>
                  으로 신뢰도 열위에 있음.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <p className={`text-sm leading-relaxed font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  사진 수 {business.photos}장으로 경쟁사 평균({summary.avgReviews}장) 대비{' '}
                  <span className={`font-black ${
                    business.photos >= Number(summary.avgReviews)
                      ? isDarkTheme ? 'text-green-400' : 'text-green-600'
                      : isDarkTheme ? 'text-red-400' : 'text-red-500'
                  }`}>
                    {business.photos >= Number(summary.avgReviews) ? '충분' : '부족'}
                  </span>
                  함. {business.photos < Number(summary.avgReviews) && '시각적 정보 강화가 시급함.'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <p className={`text-sm leading-relaxed font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  상위 경쟁사 대부분{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>
                    WiFi, 배달, 24시간
                  </span>
                  {' '}속성 보유. 내 프로필에도 누락된 속성 추가 권장.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <p className={`text-sm leading-relaxed font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  1위 {sortedCompetitors[0]?.name} 대비 강점:{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                    평점 {(business.rating - (sortedCompetitors[0]?.rating || 0)).toFixed(1)}점 {business.rating > (sortedCompetitors[0]?.rating || 0) ? '높음' : '낮음'}
                  </span>
                  {' '}/ 약점:{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`}>
                    리뷰수 {sortedCompetitors[0] ? (sortedCompetitors[0].reviews / business.reviewCount).toFixed(1) : 0}배 차이
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-10 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDarkTheme
              ? 'bg-blue-900/20 border-blue-900/50'
              : 'bg-blue-50 border-blue-100'
          }`}>
            <div className="flex items-center gap-3">
              <Info className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-xs font-bold leading-relaxed ${isDarkTheme ? 'text-blue-400' : 'text-blue-700'}`}>
                DataForSEO API를 통한 실시간 경쟁사 수집 결과입니다. 특정 경쟁사를 클릭하여 1:1 심층 비교 보고서를 생성할 수 있습니다.
              </p>
            </div>
            <button className={`flex items-center gap-1 text-xs font-black hover:underline shrink-0 ${
              isDarkTheme ? 'text-blue-400' : 'text-blue-600'
            }`}>
              비교 보고서 더보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 경쟁사 리뷰 모달 */}
      {selectedCompetitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeReviewModal}
        >
          <div
            className={`w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              isDarkTheme ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              isDarkTheme ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {selectedCompetitor.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className={`text-sm font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      {selectedCompetitor.rating}
                    </span>
                  </div>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    리뷰 {selectedCompetitor.reviews.toLocaleString()}개
                  </span>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className={`p-2 rounded-full transition-colors ${
                  isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    리뷰 데이터를 불러오는 중...
                  </p>
                </div>
              ) : reviewsError ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`}>
                    {reviewsError}
                  </p>
                </div>
              ) : competitorReviews ? (
                <div className="p-5 space-y-6">
                  {/* 특징 및 서비스 */}
                  {competitorReviews.features.length > 0 && competitorReviews.features[0] !== '정보없음' && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                        제공 서비스
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {competitorReviews.features.map((f, i) => (
                          <span key={i} className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isDarkTheme
                              ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 부정적 리뷰 요약 */}
                  {competitorReviews.negativeReviews.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      isDarkTheme ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50/50 border-red-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h4 className={`text-sm font-bold ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                          부정적 리뷰 ({competitorReviews.negativeReviews.length}건)
                        </h4>
                      </div>
                      <p className={`text-xs mb-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        이 경쟁사의 약점을 파악하여 우리 비즈니스의 강점으로 활용하세요
                      </p>
                      <div className="space-y-2">
                        {competitorReviews.negativeReviews.slice(0, 3).map((review, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${
                            isDarkTheme ? 'bg-slate-800/50' : 'bg-white'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : isDarkTheme ? 'text-slate-700' : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                                {review.relativeTime}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${
                              isDarkTheme ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {review.text || '내용 없음'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 전체 리뷰 목록 */}
                  <div>
                    <h4 className={`text-xs font-bold uppercase mb-3 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                      최근 리뷰 ({competitorReviews.reviews.length}건)
                    </h4>
                    <div className="space-y-3">
                      {competitorReviews.reviews.map((review, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          review.rating <= 3
                            ? isDarkTheme ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50/30 border-red-100'
                            : isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                                {review.author}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : isDarkTheme ? 'text-slate-700' : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                              {review.relativeTime}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${
                            isDarkTheme ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {review.text || '내용 없음'}
                          </p>
                          {review.rating <= 3 && (
                            <div className="mt-2 flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3 text-red-500" />
                              <span className={`text-[10px] font-bold ${
                                isDarkTheme ? 'text-red-400' : 'text-red-500'
                              }`}>
                                부정적 리뷰
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 모달 푸터 */}
            <div className={`p-4 border-t shrink-0 ${isDarkTheme ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Google Places API 제공 리뷰 (최대 5개)
                </p>
                <button
                  onClick={closeReviewModal}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitorSection;
