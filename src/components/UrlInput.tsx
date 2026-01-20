'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditStore } from '@/stores/audit-store';

interface UrlInputProps {
  onSubmit: (placeId: string) => void;
  loading?: boolean;
}

const DEPTH_OPTIONS = [20, 50, 100, 200, 500];

export function UrlInput({ onSubmit, loading: externalLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState('');
  const { reviewDepth, setReviewDepth } = useAuditStore();

  const loading = externalLoading || internalLoading;

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('URL 또는 비즈니스명을 입력해주세요');
      return;
    }

    setInternalLoading(true);
    setError('');

    try {
      const res = await fetch('/api/place-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (data.placeId) {
        onSubmit(data.placeId);
      } else {
        setError(data.error || '유효하지 않은 URL입니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>GBP 진단 시작</CardTitle>
        <CardDescription>
          Google Maps URL, Place ID, 또는 비즈니스명을 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://www.google.com/maps/place/... 또는 비즈니스명"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '분석 중...' : '분석 시작'}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 리뷰 수집 개수 선택 */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">수집할 리뷰 개수</p>
          <div className="flex flex-wrap gap-2">
            {DEPTH_OPTIONS.map((depth) => (
              <Button
                key={depth}
                variant={reviewDepth === depth ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReviewDepth(depth)}
                disabled={loading}
              >
                {depth}개
              </Button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>지원하는 형식:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Google Maps URL (예: https://www.google.com/maps/place/...)</li>
            <li>Place ID (예: ChIJ...)</li>
            <li>비즈니스명 (예: 스타벅스 강남역점)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
