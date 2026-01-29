'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Loader2, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KeywordResult {
  keyword: string;
  searchVolume: number;
  competition: number;
  competitionLevel: string;
  cpc: number;
}

export function KeywordResearch() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('키워드 조회 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'LOW':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HIGH':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getCompetitionLabel = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'LOW':
        return '낮음';
      case 'MEDIUM':
        return '중간';
      case 'HIGH':
        return '높음';
      default:
        return '-';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">키워드 검색량</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Google 월간 검색량 조회</p>
        </div>
      </div>

      {/* 검색 입력 */}
      <div className="flex gap-2 mb-6">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="예: 강남 맛집, 명동 성형외과"
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !keyword.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          {/* 키워드 이름 */}
          <div className="text-center mb-6">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {result.keyword}
            </h4>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getCompetitionColor(
                result.competitionLevel
              )}`}
            >
              경쟁도: {getCompetitionLabel(result.competitionLevel)}
            </span>
          </div>

          {/* 지표들 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">월간 검색량</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(result.searchVolume)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">클릭당 비용</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.cpc > 0 ? `₩${Math.round(result.cpc * 1300).toLocaleString()}` : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 사용 팁 */}
      {!result && !loading && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">검색 팁</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>• 지역명 + 업종으로 검색하세요 (예: 강남 성형외과)</li>
            <li>• 검색량이 높고 경쟁도가 낮은 키워드가 좋습니다</li>
            <li>• CPC가 높은 키워드는 상업적 가치가 높습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
