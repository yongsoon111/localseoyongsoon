'use client';

import React, { useState } from 'react';
import { MapPin, Search, Grid, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';
import { ThemeType, BusinessInfo, TeleportResult } from '@/types';
import { TeleportSearch } from './TeleportSearch';

interface RankingSectionProps {
  business: BusinessInfo;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
  theme: ThemeType;
}

export function RankingSection({
  business,
  teleportResults,
  teleportKeyword,
  theme,
}: RankingSectionProps) {
  const isDarkTheme = theme !== 'light';
  const currentRank = teleportResults[0]?.rank;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${
      isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkTheme ? 'border-slate-800' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            섹션3: 검색 순위 체크
          </h2>
        </div>
      </div>

      <div className={`p-8 ${isDarkTheme ? 'bg-slate-800/30' : 'bg-gray-50/50'}`}>
        {/* 현재 순위 표시 */}
        {currentRank && (
          <div className="flex flex-col items-center justify-center py-8 text-center mb-8">
            <div className="relative mb-6">
              <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center shadow-xl ${
                isDarkTheme
                  ? 'border-red-900/50 bg-slate-800'
                  : 'border-red-100 bg-white'
              }`}>
                <div className="text-center">
                  <span className={`text-4xl font-black ${
                    currentRank <= 3 ? 'text-green-500' : currentRank <= 10 ? 'text-yellow-500' : 'text-red-600'
                  }`}>
                    {currentRank}
                  </span>
                  <span className={`text-sm font-bold ml-1 ${isDarkTheme ? 'text-slate-400' : 'text-gray-400'}`}>
                    위
                  </span>
                </div>
              </div>
              <div className={`absolute -top-2 -right-2 p-2 rounded-full shadow-lg ${
                currentRank <= 3
                  ? 'bg-green-500 text-white'
                  : currentRank <= 10
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
              }`}>
                {currentRank <= 10 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                키워드: &apos;{teleportKeyword || '미설정'}&apos;
              </h3>
              <p className={`text-sm leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                현재 해당 키워드에 대해{' '}
                <span className={`font-bold ${
                  currentRank <= 3 ? 'text-green-500' : currentRank <= 10 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  상위 {currentRank}위
                </span>
                를 기록하고 있습니다.
                {currentRank <= 3 && ' 로컬팩에 진입한 상태입니다!'}
                {currentRank > 3 && currentRank <= 10 && ' 10위권 내로 양호한 순위입니다.'}
                {currentRank > 10 && currentRank <= 20 && ' 상위 노출을 위해 개선이 필요합니다.'}
                {currentRank > 20 && ' 즉시 개선이 필요한 상태입니다.'}
              </p>

              <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border shadow-sm ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-gray-100'
              }`}>
                <Info className="w-4 h-4 text-blue-500" />
                <span className={`text-xs font-medium italic ${isDarkTheme ? 'text-slate-400' : 'text-gray-600'}`}>
                  DataForSEO Teleport 엔진을 통한 정확한 순위 측정 결과입니다.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TeleportSearch 컴포넌트 */}
        <div className={`rounded-2xl border p-6 ${
          isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          {business.location ? (
            <TeleportSearch
              targetPlaceId={business.placeId}
              businessLocation={business.location}
              businessName={business.name}
            />
          ) : (
            <div className="py-12 text-center">
              <MapPin className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-slate-700' : 'text-gray-300'}`} />
              <p className={`${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                비즈니스 위치 정보가 없어 순위 체크를 사용할 수 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RankingSection;
