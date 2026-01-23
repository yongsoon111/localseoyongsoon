'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BusinessInfo } from '@/types';

interface RentArticle {
  id: string;
  name: string;
  type: string;
  tradeType: string;
  floor: string;
  deposit: number;
  depositDisplay: string;
  monthlyRent: number;
  supplyArea: number;
  exclusiveArea: number;
  direction: string;
  description: string;
  buildingName: string;
  agentName: string;
  lat: number;
  lng: number;
  confirmedDate: string;
  tags: string[];
  imageUrl: string | null;
}

interface RentStats {
  avgDeposit: number;
  avgMonthlyRent: number;
  avgArea: number;
}

interface RentInfoSectionProps {
  business: BusinessInfo;
}

export function RentInfoSection({ business }: RentInfoSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<RentArticle[]>([]);
  const [stats, setStats] = useState<RentStats | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchRentInfo = async () => {
    if (!business.location?.lat || !business.location?.lng) {
      setError('매장 위치 정보가 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: business.location.lat.toString(),
        lng: business.location.lng.toString(),
        radius: '0.008',  // 약 800m 반경
      });

      const res = await fetch(`/api/naver-land?${params}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setArticles(data.articles || []);
      setStats(data.stats || null);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('[RentInfo] Error:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 만원 단위를 보기 좋게 변환
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const man = price % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억`;
    }
    return `${price.toLocaleString()}만원`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>주변 상가 월세 시세</span>
          <Button
            onClick={fetchRentInfo}
            disabled={loading}
            size="sm"
          >
            {loading ? '조회 중...' : articles.length > 0 ? '새로고침' : '시세 조회'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>버튼을 눌러 주변 상가 월세 시세를 조회하세요.</p>
            <p className="text-sm mt-2">매장 위치 기준 반경 800m 내 상가 매물을 검색합니다.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary" />
          </div>
        )}

        {/* 통계 요약 */}
        {stats && articles.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">평균 보증금</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(stats.avgDeposit)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">평균 월세</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatPrice(stats.avgMonthlyRent)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">평균 면적</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.avgArea}㎡
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              {business.name} 주변 반경 800m 내 상가 {articles.length}개 매물 기준
            </p>
          </div>
        )}

        {/* 매물 목록 */}
        {articles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">매물 목록</h4>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{article.name}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {article.floor}
                        </span>
                      </div>
                      <div className="text-lg font-bold">
                        <span className="text-blue-600 dark:text-blue-400">
                          {article.depositDisplay || formatPrice(article.deposit)}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-red-600 dark:text-red-400">
                          {article.monthlyRent}만원
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        전용 {article.exclusiveArea}㎡ ({Math.round(article.exclusiveArea * 0.3025)}평)
                      </div>
                      {article.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {article.description}
                        </p>
                      )}
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {article.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-muted px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <p className="text-sm text-center text-muted-foreground">
                + 더 많은 매물이 있습니다
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
