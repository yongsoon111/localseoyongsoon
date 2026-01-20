'use client';

import { TeleportResult } from '@/types';

interface HeatMapProps {
  results: TeleportResult[];
  gridSize: number;
}

export function HeatMap({ results, gridSize }: HeatMapProps) {
  const getRankColor = (rank: number | null) => {
    if (rank === null) return 'bg-gray-300';
    if (rank <= 3) return 'bg-green-500';
    if (rank <= 5) return 'bg-lime-500';
    if (rank <= 10) return 'bg-yellow-400';
    if (rank <= 15) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getTextColor = (rank: number | null) => {
    if (rank === null) return 'text-gray-600';
    if (rank <= 5) return 'text-white';
    return 'text-gray-900';
  };

  // 결과를 그리드 순서대로 정렬 (위에서 아래, 왼쪽에서 오른쪽)
  const sortedResults = [...results].sort((a, b) => {
    if (a.lat !== b.lat) return b.lat - a.lat; // 위도는 내림차순 (북쪽이 위)
    return a.lng - b.lng; // 경도는 오름차순 (서쪽이 왼쪽)
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {sortedResults.map((r, i) => (
          <div
            key={i}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg ${getRankColor(r.rank)} ${getTextColor(r.rank)} transition-transform hover:scale-105 cursor-pointer`}
            title={`위치: ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}\n순위: ${r.rank || '순위권 외'}`}
          >
            <span className="text-xl font-bold">
              {r.rank || '-'}
            </span>
            <span className="text-xs opacity-80">
              {r.rank ? '위' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* 통계 요약 */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          평균 순위:{' '}
          <span className="font-semibold">
            {calculateAverageRank(results)}위
          </span>
        </p>
        <p>
          최고 순위:{' '}
          <span className="font-semibold text-green-600">
            {getBestRank(results)}위
          </span>
        </p>
        <p>
          최저 순위:{' '}
          <span className="font-semibold text-red-600">
            {getWorstRank(results)}위
          </span>
        </p>
      </div>
    </div>
  );
}

function calculateAverageRank(results: TeleportResult[]): string {
  const rankedResults = results.filter((r) => r.rank !== null);
  if (rankedResults.length === 0) return '-';
  const sum = rankedResults.reduce((acc, r) => acc + (r.rank || 0), 0);
  return (sum / rankedResults.length).toFixed(1);
}

function getBestRank(results: TeleportResult[]): string {
  const ranks = results.filter((r) => r.rank !== null).map((r) => r.rank as number);
  if (ranks.length === 0) return '-';
  return Math.min(...ranks).toString();
}

function getWorstRank(results: TeleportResult[]): string {
  const ranks = results.filter((r) => r.rank !== null).map((r) => r.rank as number);
  if (ranks.length === 0) return '-';
  return Math.max(...ranks).toString();
}
