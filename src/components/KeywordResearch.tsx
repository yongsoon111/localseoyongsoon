'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Loader2, BarChart3, DollarSign, Target, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  competitionLevel: string;
  cpc: number;
}

interface KeywordResult {
  seedKeyword: string;
  totalResults: number;
  keywords: KeywordData[];
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
    switch (level) {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleExportCSV = () => {
    if (!result) return;

    const headers = ['키워드', '월간 검색량', '경쟁도', '경쟁 수준', 'CPC (원)'];
    const rows = result.keywords.map((k) => [
      k.keyword,
      k.searchVolume.toString(),
      (k.competition * 100).toFixed(1) + '%',
      k.competitionLevel,
      Math.round(k.cpc * 1300).toString(), // USD to KRW 대략 환산
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `키워드_${keyword}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">키워드 리서치</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">연관 키워드와 검색량을 조회합니다</p>
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
        <div>
          {/* 요약 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                "<span className="font-bold text-slate-700 dark:text-slate-300">{result.seedKeyword}</span>" 연관 키워드
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                총 {result.keywords.length}개 키워드 발견
              </p>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV 내보내기
            </Button>
          </div>

          {/* 키워드 테이블 */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                    키워드
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-4 h-4" />
                      검색량
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="w-4 h-4" />
                      경쟁도
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-4 h-4" />
                      CPC
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {result.keywords.map((kw, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      {kw.keyword}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(kw.searchVolume)}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">/월</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getCompetitionColor(
                          kw.competitionLevel
                        )}`}
                      >
                        {kw.competitionLevel === 'LOW'
                          ? '낮음'
                          : kw.competitionLevel === 'MEDIUM'
                          ? '중간'
                          : kw.competitionLevel === 'HIGH'
                          ? '높음'
                          : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      {kw.cpc > 0 ? `₩${Math.round(kw.cpc * 1300).toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 검색량 상위 키워드 시각화 */}
          {result.keywords.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                검색량 TOP 10
              </p>
              <div className="space-y-2">
                {result.keywords.slice(0, 10).map((kw, i) => {
                  const maxVolume = result.keywords[0]?.searchVolume || 1;
                  const width = (kw.searchVolume / maxVolume) * 100;

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-bold text-slate-400">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                            {kw.keyword}
                          </span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-2">
                            {formatNumber(kw.searchVolume)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 사용 팁 */}
      {!result && !loading && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">💡 검색 팁</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>• 지역명 + 업종으로 검색하세요 (예: 강남 성형외과)</li>
            <li>• 검색량이 높고 경쟁도가 낮은 키워드를 노리세요</li>
            <li>• CPC가 높은 키워드는 상업적 가치가 높습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
