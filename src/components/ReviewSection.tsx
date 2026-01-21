'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquareText, RefreshCcw, Star, Globe, Languages, AlertTriangle, ThumbsDown, TrendingDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Review, ThemeType, ReviewAudit } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ReviewSectionProps {
  reviews: Review[];
  reviewData: ReviewAudit | null;
  reviewLoading: boolean;
  reviewDepth: number;
  onFetchReviews: () => void;
  onDepthChange: (depth: number) => void;
  theme: ThemeType;
}

export function ReviewSection({
  reviews,
  reviewData,
  reviewLoading,
  reviewDepth,
  onFetchReviews,
  onDepthChange,
  theme,
}: ReviewSectionProps) {
  const isDarkTheme = theme !== 'light';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onFetchReviews();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  // 언어 감지 (간단한 버전)
  const detectLanguage = (text: string): string => {
    if (!text) return 'unknown';
    const koreanRegex = /[\uac00-\ud7af]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const chineseRegex = /[\u4e00-\u9fff]/;

    if (koreanRegex.test(text)) return 'ko';
    if (japaneseRegex.test(text)) return 'ja';
    if (chineseRegex.test(text)) return 'zh';
    return 'en';
  };

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      ko: '한국어',
      en: '영어',
      ja: '일본어',
      zh: '중국어',
      unknown: '기타',
    };
    return labels[lang] || '기타';
  };

  const getLanguageFlag = (lang: string): string => {
    const flags: Record<string, string> = {
      ko: '🇰🇷',
      en: '🇺🇸',
      ja: '🇯🇵',
      zh: '🇨🇳',
      unknown: '🌐',
    };
    return flags[lang] || '🌐';
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${
      isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkTheme ? 'border-slate-800' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <MessageSquareText className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            섹션2: 리뷰 분석
          </h2>
          {reviewData && (
            <span className={`text-xs font-medium ml-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
              ({reviewData.reviews.length}개 로드됨)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 no-print">
          <Select value={reviewDepth.toString()} onValueChange={(val) => onDepthChange(parseInt(val))}>
            <SelectTrigger className={`w-[120px] h-9 ${
              isDarkTheme
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개씩</SelectItem>
              <SelectItem value="30">30개씩</SelectItem>
              <SelectItem value="50">50개씩</SelectItem>
              <SelectItem value="100">100개씩</SelectItem>
              <SelectItem value="200">200개씩</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={reviewLoading || isRefreshing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <RefreshCcw className={`w-4 h-4 ${(reviewLoading || isRefreshing) ? 'animate-spin' : ''}`} />
            {reviewData ? '새로고침' : '리뷰 불러오기'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ minHeight: '300px' }}>
        {reviewLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-green-600 mb-4" />
            <p className={`${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              리뷰 데이터 로딩 중... (DataForSEO API 호출)
            </p>
          </div>
        ) : reviewData && reviewData.reviews.length > 0 ? (
          <table className="w-full text-left border-collapse" style={{ minWidth: '1100px' }}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider ${
                isDarkTheme ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-400'
              }`}>
                <th className="px-6 py-4">작성자</th>
                <th className="px-6 py-4">언어</th>
                <th className="px-6 py-4">평점</th>
                <th className="px-6 py-4 w-1/3">리뷰 내용 (원문)</th>
                <th className="px-6 py-4 w-1/4">사장님 답글</th>
                <th className="px-6 py-4">작성일</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {reviewData.reviews.map((review, idx) => {
                const lang = detectLanguage(review.text);
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-6 py-4 font-semibold text-sm ${
                      isDarkTheme ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {review.author}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                        isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span>{getLanguageFlag(lang)}</span>
                        {getLanguageLabel(lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className={`px-6 py-4 text-sm leading-relaxed ${
                      isDarkTheme ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      <div className="max-w-md">
                        {review.text || <span className="text-slate-400 italic">내용 없음</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {review.ownerResponse ? (
                        <div className={`text-xs p-2 rounded-lg border ${
                          isDarkTheme
                            ? 'bg-blue-900/20 text-blue-300 border-blue-900/50'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {review.ownerResponse}
                        </div>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          isDarkTheme
                            ? 'text-red-400 bg-red-900/20 border-red-900/50'
                            : 'text-red-500 bg-red-50 border-red-100'
                        }`}>
                          미답변
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-xs ${
                      isDarkTheme ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      {review.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center">
            <Globe className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-slate-700' : 'text-gray-300'}`} />
            <p className={`${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              리뷰 데이터가 없습니다.
            </p>
            <p className={`text-sm mt-2 ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
              위 버튼을 클릭하여 리뷰를 불러오세요.
            </p>
          </div>
        )}
      </div>

      {/* 리뷰 통계 섹션 */}
      {reviewData && (
        <div className={`p-6 border-t ${isDarkTheme ? 'border-slate-800 bg-slate-800/30' : 'border-gray-100 bg-gray-50'}`}>
          <h3 className={`text-sm font-bold mb-4 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            리뷰 분석 요약
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${
              isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-[10px] font-bold uppercase ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                평균 평점
              </p>
              <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                ★ {reviewData.analysis.avgRating.toFixed(1)}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${
              isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-[10px] font-bold uppercase ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                응답률
              </p>
              <p className={`text-xl font-black ${
                reviewData.analysis.responseRate >= 80
                  ? 'text-green-500'
                  : reviewData.analysis.responseRate >= 50
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }`}>
                {reviewData.analysis.responseRate.toFixed(0)}%
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${
              isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-[10px] font-bold uppercase ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                5점 비율
              </p>
              <p className={`text-xl font-black text-green-500`}>
                {reviewData.reviews.length > 0
                  ? Math.round((reviewData.analysis.ratingDistribution[5] || 0) / reviewData.reviews.length * 100)
                  : 0}%
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${
              isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-[10px] font-bold uppercase ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                1-2점 비율
              </p>
              <p className={`text-xl font-black text-red-500`}>
                {reviewData.reviews.length > 0
                  ? Math.round(
                      ((reviewData.analysis.ratingDistribution[1] || 0) + (reviewData.analysis.ratingDistribution[2] || 0)) /
                      reviewData.reviews.length * 100
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 부정 리뷰 분석 섹션 */}
      {reviewData && <NegativeReviewAnalysis reviews={reviewData.reviews} isDarkTheme={isDarkTheme} />}
    </div>
  );
}

// 부정 리뷰 분석 컴포넌트
function NegativeReviewAnalysis({ reviews, isDarkTheme }: { reviews: Review[]; isDarkTheme: boolean }) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // 1-2-3점 부정 리뷰 필터링
  const negativeReviews = useMemo(() => {
    return reviews.filter(r => r.rating <= 3).sort((a, b) => a.rating - b.rating);
  }, [reviews]);

  // 부정 리뷰 키워드 분석
  const negativeKeywords = useMemo(() => {
    const keywordPatterns: { keyword: string; patterns: RegExp[]; category: string }[] = [
      // 서비스/응대
      { keyword: '불친절', patterns: [/불친절/gi, /친절하지/gi, /무례/gi, /태도/gi, /짜증/gi], category: '서비스' },
      { keyword: '응대 불만', patterns: [/응대/gi, /대응/gi, /직원/gi, /알바/gi, /서빙/gi], category: '서비스' },
      // 대기/시간
      { keyword: '오래 기다림', patterns: [/기다/gi, /대기/gi, /늦/gi, /느리/gi, /오래/gi], category: '시간' },
      { keyword: '예약 문제', patterns: [/예약/gi, /웨이팅/gi, /waiting/gi], category: '시간' },
      // 음식/품질
      { keyword: '맛 실망', patterns: [/맛없/gi, /맛이 없/gi, /별로/gi, /실망/gi, /그저 그/gi], category: '품질' },
      { keyword: '양 적음', patterns: [/양이? 적/gi, /양이? 작/gi, /적은 양/gi, /portion/gi], category: '품질' },
      { keyword: '위생 문제', patterns: [/위생/gi, /더럽/gi, /불결/gi, /청소/gi, /벌레/gi, /머리카락/gi], category: '품질' },
      { keyword: '온도 문제', patterns: [/차갑/gi, /식었/gi, /미지근/gi, /cold/gi, /뜨거/gi], category: '품질' },
      // 가격
      { keyword: '비싸다', patterns: [/비싸/gi, /비쌈/gi, /가격/gi, /expensive/gi, /가성비/gi], category: '가격' },
      // 환경
      { keyword: '시끄러움', patterns: [/시끄/gi, /소음/gi, /noisy/gi, /loud/gi], category: '환경' },
      { keyword: '좁음/불편', patterns: [/좁/gi, /불편/gi, /답답/gi, /cramped/gi], category: '환경' },
      { keyword: '주차 문제', patterns: [/주차/gi, /parking/gi], category: '환경' },
    ];

    const counts: Record<string, { count: number; category: string; examples: string[] }> = {};

    negativeReviews.forEach(review => {
      if (!review.text) return;
      const text = review.text.toLowerCase();

      keywordPatterns.forEach(({ keyword, patterns, category }) => {
        const matched = patterns.some(p => p.test(text));
        if (matched) {
          if (!counts[keyword]) {
            counts[keyword] = { count: 0, category, examples: [] };
          }
          counts[keyword].count++;
          if (counts[keyword].examples.length < 2) {
            counts[keyword].examples.push(review.text.slice(0, 100));
          }
        }
      });
    });

    return Object.entries(counts)
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [negativeReviews]);

  // 카테고리별 그룹핑
  const categoryGroups = useMemo(() => {
    const groups: Record<string, typeof negativeKeywords> = {};
    negativeKeywords.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [negativeKeywords]);

  if (negativeReviews.length === 0) return null;

  const displayReviews = showAllReviews ? negativeReviews : negativeReviews.slice(0, 5);

  return (
    <div className={`border-t ${isDarkTheme ? 'border-slate-800' : 'border-gray-100'}`}>
      {/* 헤더 */}
      <div className={`p-6 ${isDarkTheme ? 'bg-red-900/10' : 'bg-red-50/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${isDarkTheme ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              부정 리뷰 분석 (1-3점)
            </h3>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              총 {negativeReviews.length}개의 부정적 리뷰에서 발견된 문제점
            </p>
          </div>
        </div>

        {/* 문제점 카테고리별 요약 */}
        {negativeKeywords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Object.entries(categoryGroups).map(([category, items]) => (
              <div
                key={category}
                className={`p-4 rounded-xl border ${
                  isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase mb-2 ${
                  isDarkTheme ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  {category}
                </p>
                <div className="space-y-1.5">
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.keyword}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.count}건
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 주요 문제점 TOP 5 */}
        {negativeKeywords.length > 0 && (
          <div className={`p-4 rounded-xl border mb-4 ${
            isDarkTheme ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-xs font-bold uppercase mb-3 ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
              <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
              주요 불만 사항 TOP 5
            </p>
            <div className="space-y-2">
              {negativeKeywords.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                    idx === 0 ? 'bg-red-500 text-white' :
                    idx === 1 ? 'bg-orange-500 text-white' :
                    idx === 2 ? 'bg-yellow-500 text-white' :
                    isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {item.keyword}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isDarkTheme ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full mt-1 ${isDarkTheme ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${Math.min((item.count / negativeReviews.length) * 100 * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-black ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                    {item.count}건
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 부정 리뷰 목록 */}
      <div className={`p-6 ${isDarkTheme ? 'bg-slate-900/30' : 'bg-gray-50/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-sm font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            <ThumbsDown className="w-4 h-4 inline mr-1.5" />
            부정 리뷰 상세 ({negativeReviews.length}건)
          </h4>
          {negativeReviews.length > 5 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isDarkTheme
                  ? 'text-blue-400 hover:bg-slate-800'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              {showAllReviews ? (
                <>접기 <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>전체보기 ({negativeReviews.length}건) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayReviews.map((review, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedReview(review)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                isDarkTheme
                  ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : isDarkTheme ? 'text-slate-700' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                      {review.author}
                    </span>
                    <span className={`text-[10px] ${isDarkTheme ? 'text-slate-600' : 'text-gray-400'}`}>
                      {review.date}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed line-clamp-2 ${
                    isDarkTheme ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {review.text || '내용 없음'}
                  </p>
                </div>
                {!review.ownerResponse && (
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${
                    isDarkTheme
                      ? 'text-red-400 bg-red-900/20 border-red-900/50'
                      : 'text-red-500 bg-red-50 border-red-100'
                  }`}>
                    미답변
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 리뷰 상세 모달 */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
              isDarkTheme ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkTheme ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < selectedReview.rating
                          ? 'text-yellow-400 fill-current'
                          : isDarkTheme ? 'text-slate-700' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {selectedReview.author}
                </span>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className={`text-xs font-bold uppercase mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                  리뷰 내용
                </p>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isDarkTheme ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {selectedReview.text || '내용 없음'}
                </p>
              </div>
              {selectedReview.ownerResponse ? (
                <div className={`p-4 rounded-xl border ${
                  isDarkTheme ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50 border-blue-100'
                }`}>
                  <p className={`text-xs font-bold uppercase mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                    사장님 답변
                  </p>
                  <p className={`text-sm leading-relaxed ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
                    {selectedReview.ownerResponse}
                  </p>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border ${
                  isDarkTheme ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-100'
                }`}>
                  <p className={`text-sm font-bold ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                    ⚠️ 아직 답변하지 않은 리뷰입니다
                  </p>
                  <p className={`text-xs mt-1 ${isDarkTheme ? 'text-red-400/70' : 'text-red-500/70'}`}>
                    부정 리뷰에 신속하게 답변하면 고객 신뢰도를 회복할 수 있습니다
                  </p>
                </div>
              )}
              <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                작성일: {selectedReview.date}
              </p>
            </div>
            <div className={`p-4 border-t ${isDarkTheme ? 'border-slate-700' : 'border-gray-100'}`}>
              <button
                onClick={() => setSelectedReview(null)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
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
      )}
    </div>
  );
}

export default ReviewSection;
