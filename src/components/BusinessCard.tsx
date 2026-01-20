'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SavedBusiness } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BusinessCardProps {
  business: SavedBusiness;
  onDelete: (id: string) => void;
}

export function BusinessCard({ business, onDelete }: BusinessCardProps) {
  const [expanded, setExpanded] = useState(false);
  const latestAudit = business.latest_audit;
  const score = latestAudit?.total_score;

  // 이름이 30자 이상이면 더보기 버튼 표시
  const isLongName = business.name.length > 30;

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getScoreLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined) return '미진단';
    if (score >= 80) return '우수';
    if (score >= 60) return '보통';
    return '개선필요';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">
              {expanded || !isLongName ? (
                <span className="break-words">{business.name}</span>
              ) : (
                <span className="line-clamp-2">{business.name}</span>
              )}
            </CardTitle>
            {isLongName && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-500 hover:text-blue-600 mt-1"
              >
                {expanded ? '접기' : '더보기'}
              </button>
            )}
            {business.category && (
              <p className="text-sm text-muted-foreground mt-1">{business.category}</p>
            )}
          </div>
          <Badge className={`${getScoreColor(score)} shrink-0`}>
            {score !== null && score !== undefined ? `${score}점` : getScoreLabel(score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 평점 & 리뷰 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{business.rating?.toFixed(1) || '-'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>리뷰 {business.review_count || 0}개</span>
            </div>
          </div>

          {/* 주소 */}
          {business.address && (
            <p className="text-sm text-muted-foreground truncate">
              {business.address}
            </p>
          )}

          {/* 최근 감사 */}
          {latestAudit && (
            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>마지막 진단: {formatDate(latestAudit.created_at)}</span>
                {latestAudit.response_rate !== null && (
                  <span>응답률 {latestAudit.response_rate}%</span>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/${business.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                상세보기
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(business.id)}
            >
              삭제
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
