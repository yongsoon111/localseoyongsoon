'use client';

import React, { useState } from 'react';
import { MessageSquareText, RefreshCcw, Star, Globe, Languages } from 'lucide-react';
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
    </div>
  );
}

export default ReviewSection;
