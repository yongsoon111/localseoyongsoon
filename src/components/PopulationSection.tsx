'use client';

import React from 'react';
import { Users, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessInfo } from '@/types';

interface PopulationSectionProps {
  business: BusinessInfo;
}

export function PopulationSection({ business }: PopulationSectionProps) {
  const lat = business?.location?.lat;
  const lng = business?.location?.lng;
  const hasCoordinates = lat && lng;

  // 외부 유동인구 지도 서비스 링크들
  const getPopulationLinks = () => {
    if (!hasCoordinates) return [];

    return [
      {
        name: '서울 생활인구 지도',
        description: '서울시 실시간 유동인구 (KT 기반)',
        url: 'https://data.seoul.go.kr/dataVisual/seoul/seoulLivingPopulation.do',
        color: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        name: 'SGIS 통계지도',
        description: '통계청 인구/상권 분석',
        url: `https://sgis.kostat.go.kr/view/map/interactiveMap/main?coords=${lng},${lat}`,
        color: 'bg-emerald-500 hover:bg-emerald-600',
      },
      {
        name: '소상공인 상권정보',
        description: '상권분석 및 유동인구',
        url: 'https://sg.sbiz.or.kr/godo/index.sg',
        color: 'bg-orange-500 hover:bg-orange-600',
      },
    ];
  };

  const links = getPopulationLinks();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">유동인구 분석</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            외부 서비스에서 상세 데이터 확인
          </p>
        </div>
      </div>

      {/* 좌표 정보 */}
      {hasCoordinates && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">{business.name}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-6">
            좌표: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* 외부 링크 버튼들 */}
      {hasCoordinates ? (
        <div className="space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {link.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {link.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              </Button>
            </a>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            위치 좌표 정보가 없어 유동인구 분석을 할 수 없습니다.
          </p>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>TIP:</strong> 서울 생활인구 지도에서 해당 위치의 시간대별, 연령별, 성별 유동인구를 확인하세요.
          소상공인 상권정보에서는 매출 분석도 가능합니다.
        </p>
      </div>

      {/* 데이터 출처 */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 text-center">
        외부 서비스 연결 | 서울시, 통계청, 소상공인진흥공단
      </p>
    </div>
  );
}
