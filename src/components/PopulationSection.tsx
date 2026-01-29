'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, TrendingUp, Loader2, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessInfo } from '@/types';

interface AgeGroup {
  label: string;
  male: number;
  female: number;
  total: number;
}

interface PopulationData {
  date: string;
  hour: string;
  dongCode: string;
  dongName: string;
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  ageGroups: AgeGroup[];
}

interface HourlyData {
  hour: number;
  population: number;
}

interface HourlyResponse {
  district: string;
  dong: string;
  date: string;
  hourlyData: HourlyData[];
  peakHour: HourlyData;
}

interface PopulationSectionProps {
  business: BusinessInfo;
}

// 주소에서 구 추출
function extractDistrict(address: string): string | null {
  const match = address.match(/(강남구|서초구|송파구|마포구|종로구|중구|용산구|성동구|광진구|동대문구|중랑구|성북구|강북구|도봉구|노원구|은평구|서대문구|양천구|강서구|구로구|금천구|영등포구|동작구|관악구|서초구|강동구)/);
  return match ? match[1] : null;
}

// 도로명/지번 주소에서 동 이름 추정
function extractDongFromAddress(address: string): string | null {
  // 도로명에서 동 이름 추정 (압구정로 -> 압구정동)
  const roadMatch = address.match(/([가-힣]+)(로|길|대로)/);
  if (roadMatch) {
    const baseName = roadMatch[1];
    // 흔한 동 이름 패턴
    const possibleDong = baseName.replace(/(대|중앙|북|남|동|서)$/, '');
    return possibleDong;
  }

  // 지번 주소에서 동 추출
  const dongMatch = address.match(/([가-힣]+[0-9]*)동/);
  if (dongMatch) {
    return dongMatch[1] + '동';
  }

  return null;
}

// 동 이름 매칭 (유사 매칭)
function findMatchingDong(dongHint: string, availableDongs: string[]): string | null {
  if (!dongHint) return null;

  // 정확히 일치
  const exact = availableDongs.find(d => d === dongHint || d === dongHint + '동');
  if (exact) return exact;

  // 시작 부분 일치
  const startsWith = availableDongs.find(d => d.startsWith(dongHint) || dongHint.startsWith(d.replace(/동$/, '').replace(/[0-9]/, '')));
  if (startsWith) return startsWith;

  // 포함 여부
  const includes = availableDongs.find(d => d.includes(dongHint) || dongHint.includes(d.replace(/동$/, '').replace(/[0-9]/, '')));
  if (includes) return includes;

  return null;
}

export function PopulationSection({ business }: PopulationSectionProps) {
  const [dongs, setDongs] = useState<string[]>([]);
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);
  const [detectedDong, setDetectedDong] = useState<string | null>(null);
  const [selectedDong, setSelectedDong] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [data, setData] = useState<PopulationData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 비즈니스 주소에서 구/동 자동 감지
  useEffect(() => {
    if (!business?.address) {
      setInitialLoading(false);
      setError('주소 정보가 없습니다');
      return;
    }

    const district = extractDistrict(business.address);
    if (!district) {
      setInitialLoading(false);
      setError('서울시 외 지역은 지원하지 않습니다');
      return;
    }

    setDetectedDistrict(district);

    // 주소에서 동 힌트 추출
    const dongHint = extractDongFromAddress(business.address);

    // 해당 구의 동 목록 가져오기
    fetchDongsAndAutoSelect(district, dongHint);
  }, [business?.address]);

  const fetchDongsAndAutoSelect = async (district: string, dongHint: string | null) => {
    try {
      const res = await fetch('/api/population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district }),
      });
      const result = await res.json();

      if (result.error) {
        setError(result.error);
        setInitialLoading(false);
        return;
      }

      if (result.dongs) {
        setDongs(result.dongs);

        // 동 자동 선택
        if (dongHint) {
          const matchedDong = findMatchingDong(dongHint, result.dongs);
          if (matchedDong) {
            setDetectedDong(matchedDong);
            setSelectedDong(matchedDong);
            // 자동으로 데이터 조회
            await fetchPopulationData(district, matchedDong);
          } else {
            // 첫 번째 동 선택
            setSelectedDong(result.dongs[0]);
          }
        } else {
          setSelectedDong(result.dongs[0]);
        }
      }
    } catch (err) {
      console.error('동 목록 로드 실패:', err);
      setError('동 목록을 불러오는데 실패했습니다');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPopulationData = async (district: string, dong: string) => {
    setLoading(true);
    setError(null);

    try {
      // 현재 시간대 데이터 조회
      const res = await fetch('/api/population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district, dong }),
      });
      const result = await res.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      setData(result);

      // 시간대별 데이터 조회
      const hourlyRes = await fetch(
        `/api/population?district=${encodeURIComponent(district)}&dong=${encodeURIComponent(dong)}`
      );
      const hourlyResult = await hourlyRes.json();

      if (!hourlyResult.error) {
        setHourlyData(hourlyResult);
      }
    } catch (err) {
      setError('유동인구 조회 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!detectedDistrict || !selectedDong) return;
    fetchPopulationData(detectedDistrict, selectedDong);
  };

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  };

  // 연령대 그룹화
  const getGroupedAgeData = () => {
    if (!data?.ageGroups) return [];

    const grouped = [
      { label: '10대 이하', total: 0, male: 0, female: 0 },
      { label: '20대', total: 0, male: 0, female: 0 },
      { label: '30대', total: 0, male: 0, female: 0 },
      { label: '40대', total: 0, male: 0, female: 0 },
      { label: '50대', total: 0, male: 0, female: 0 },
      { label: '60대 이상', total: 0, male: 0, female: 0 },
    ];

    data.ageGroups.forEach(ag => {
      if (ag.label.includes('0-9') || ag.label.includes('10-14') || ag.label.includes('15-19')) {
        grouped[0].total += ag.total;
        grouped[0].male += ag.male;
        grouped[0].female += ag.female;
      } else if (ag.label.includes('20-24') || ag.label.includes('25-29')) {
        grouped[1].total += ag.total;
        grouped[1].male += ag.male;
        grouped[1].female += ag.female;
      } else if (ag.label.includes('30-34') || ag.label.includes('35-39')) {
        grouped[2].total += ag.total;
        grouped[2].male += ag.male;
        grouped[2].female += ag.female;
      } else if (ag.label.includes('40-44') || ag.label.includes('45-49')) {
        grouped[3].total += ag.total;
        grouped[3].male += ag.male;
        grouped[3].female += ag.female;
      } else if (ag.label.includes('50-54') || ag.label.includes('55-59')) {
        grouped[4].total += ag.total;
        grouped[4].male += ag.male;
        grouped[4].female += ag.female;
      } else {
        grouped[5].total += ag.total;
        grouped[5].male += ag.male;
        grouped[5].female += ag.female;
      }
    });

    return grouped;
  };

  const groupedAge = getGroupedAgeData();
  const maxAgeTotal = Math.max(...groupedAge.map(g => g.total), 1);

  // 로딩 중
  if (initialLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">유동인구 분석</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">주소 분석 중...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">유동인구 분석</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {business.address}
          </p>
        </div>
      </div>

      {/* 감지된 위치 & 동 선택 */}
      {detectedDistrict && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {detectedDistrict}
            </span>
          </div>
          <select
            value={selectedDong}
            onChange={(e) => setSelectedDong(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            {dongs.map(d => (
              <option key={d} value={d}>
                {d} {d === detectedDong && '(자동감지)'}
              </option>
            ))}
          </select>
          <Button
            onClick={handleSearch}
            disabled={loading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* 에러 */}
      {error && !data && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* 결과 */}
      {data && (
        <div className="space-y-4">
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">총 유동인구</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(data.totalPopulation)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">남성</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {((data.malePopulation / data.totalPopulation) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">여성</p>
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {((data.femalePopulation / data.totalPopulation) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* 조회 정보 */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(data.date)} {data.hour}시 기준
            </span>
          </div>

          {/* 연령대별 분포 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              연령대별 분포
            </p>
            <div className="space-y-2">
              {groupedAge.map((ag, i) => {
                const width = (ag.total / maxAgeTotal) * 100;
                const maleRatio = ag.total > 0 ? (ag.male / ag.total) * 100 : 50;

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {ag.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatNumber(ag.total)}명
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full flex rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      >
                        <div className="h-full bg-blue-500" style={{ width: `${maleRatio}%` }} />
                        <div className="h-full bg-pink-500" style={{ width: `${100 - maleRatio}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                남성
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
                여성
              </span>
            </div>
          </div>

          {/* 시간대별 유동인구 */}
          {hourlyData && hourlyData.hourlyData.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                시간대별
                {hourlyData.peakHour && (
                  <span className="ml-auto text-emerald-600 dark:text-emerald-400 normal-case">
                    피크 {hourlyData.peakHour.hour}시
                  </span>
                )}
              </p>
              <div className="flex items-end gap-[2px] h-20">
                {hourlyData.hourlyData.map((h, i) => {
                  const maxPop = Math.max(...hourlyData.hourlyData.map(d => d.population), 1);
                  const height = (h.population / maxPop) * 100;
                  const isPeak = hourlyData.peakHour?.hour === h.hour;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${h.hour}시: ${formatNumber(h.population)}명`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>0시</span>
                <span>12시</span>
                <span>23시</span>
              </div>
            </div>
          )}

          {/* 인사이트 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
              마케팅 인사이트
            </p>
            <ul className="text-[11px] text-amber-600 dark:text-amber-300 space-y-1">
              {data.femalePopulation > data.malePopulation ? (
                <li>여성 비율이 높습니다. 여성 타겟 마케팅이 효과적입니다.</li>
              ) : (
                <li>남성 비율이 높습니다. 남성 타겟 마케팅을 고려하세요.</li>
              )}
              {groupedAge[1].total + groupedAge[2].total > data.totalPopulation * 0.4 && (
                <li>20-30대가 많습니다. SNS/인플루언서 마케팅 추천</li>
              )}
              {groupedAge[4].total + groupedAge[5].total > data.totalPopulation * 0.3 && (
                <li>50대 이상이 많습니다. 오프라인 마케팅 병행 권장</li>
              )}
              {hourlyData?.peakHour && (
                <li>피크 시간({hourlyData.peakHour.hour}시)에 맞춰 프로모션 진행</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 데이터 출처 */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 text-center">
        데이터 출처: 서울시 열린데이터광장 (서울시+KT)
      </p>
    </div>
  );
}
