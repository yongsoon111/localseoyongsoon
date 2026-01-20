'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewAudit } from '@/types';
import { useAuditStore } from '@/stores/audit-store';

interface ReviewAnalysisProps {
  data: ReviewAudit;
  totalReviewCount: number;
}

const DEPTH_OPTIONS = [20, 50, 100, 200, 500];

export function ReviewAnalysis({ data, totalReviewCount }: ReviewAnalysisProps) {
  const { reviews, analysis } = data;
  const { avgRating, ratingDistribution, keywords, responseRate } = analysis;
  const { placeId, reviewDepth, reviewLoading, fetchReviews } = useAuditStore();
  const [selectedDepth, setSelectedDepth] = useState(reviewDepth);

  const handleDepthChange = (depth: number) => {
    setSelectedDepth(depth);
    if (placeId) {
      fetchReviews(placeId, depth);
    }
  };

  const totalInDistribution = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* 리뷰 수 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">수집할 리뷰 수</CardTitle>
          <CardDescription>
            총 {totalReviewCount}개 리뷰 중 분석할 개수를 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEPTH_OPTIONS.map((depth) => (
              <Button
                key={depth}
                variant={selectedDepth === depth ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDepthChange(depth)}
                disabled={reviewLoading || depth > totalReviewCount}
              >
                {depth}개
              </Button>
            ))}
            {totalReviewCount > 500 && (
              <Button
                variant={selectedDepth === totalReviewCount ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDepthChange(totalReviewCount)}
                disabled={reviewLoading}
              >
                전체 ({totalReviewCount}개)
              </Button>
            )}
          </div>
          {reviewLoading && (
            <p className="text-sm text-blue-600 mt-2">
              리뷰 수집 중... (최대 3분 소요)
            </p>
          )}
        </CardContent>
      </Card>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-center">
              {avgRating.toFixed(1)}
            </div>
            <p className="text-sm text-gray-500 text-center">평균 평점</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-center">
              {totalReviewCount}
            </div>
            <p className="text-sm text-gray-500 text-center">총 리뷰 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-center">
              {responseRate.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-500 text-center">응답률</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-center">
              {reviews.length}
            </div>
            <p className="text-sm text-gray-500 text-center">분석된 리뷰</p>
          </CardContent>
        </Card>
      </div>

      {/* 평점 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>평점 분포</CardTitle>
          <CardDescription>
            최근 리뷰 {totalInDistribution}개 기준
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = totalInDistribution > 0
                ? (count / totalInDistribution) * 100
                : 0;

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-8 text-sm">{rating}점</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-right">
                    {count}개 ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 키워드 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>자주 등장하는 키워드</CardTitle>
          <CardDescription>
            리뷰에서 추출한 주요 키워드
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 15).map((kw, i) => (
              <Badge
                key={kw.keyword}
                variant={i < 5 ? 'default' : 'secondary'}
                className="text-sm"
              >
                {kw.keyword} ({kw.count})
              </Badge>
            ))}
            {keywords.length === 0 && (
              <p className="text-gray-500">추출된 키워드가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 최근 리뷰 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 리뷰</CardTitle>
          <CardDescription>
            분석된 리뷰 {reviews.length}개 중 최근 20개 표시
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.slice(0, 20).map((review, i) => (
              <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{review.author}</span>
                    <span className="ml-2 text-yellow-500">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {review.text || '(내용 없음)'}
                </p>
                {review.ownerResponse && (
                  <div className="mt-2 pl-4 border-l-2 border-blue-200 text-sm">
                    <p className="font-medium text-blue-600">사장님 답변</p>
                    <p className="text-gray-600">{review.ownerResponse}</p>
                  </div>
                )}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                리뷰가 없습니다
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
