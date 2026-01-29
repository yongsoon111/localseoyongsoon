'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, TrendingUp, Loader2, BarChart3, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function PopulationSection() {
  const [districts, setDistricts] = useState<string[]>([]);
  const [dongs, setDongs] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PopulationData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 구 목록 로드
  useEffect(() => {
    fetchDistricts();
  }, []);

  // 구 선택 시 동 목록 로드
  useEffect(() => {
    if (selectedDistrict) {
      fetchDongs(selectedDistrict);
      setSelectedDong('');
      setData(null);
      setHourlyData(null);
    }
  }, [selectedDistrict]);

  const fetchDistricts = async () => {
    try {
      const res = await fetch('/api/population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.districts) {
        setDistricts(result.districts);
      }
    } catch (err) {
      console.error('구 목록 로드 실패:', err);
    }
  };

  const fetchDongs = async (district: string) => {
    try {
      const res = await fetch('/api/population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district }),
      });
      const result = await res.json();
      if (result.dongs) {
        setDongs(result.dongs);
      }
    } catch (err) {
      console.error('동 목록 로드 실패:', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedDistrict || !selectedDong) return;

    setLoading(true);
    setError(null);

    try {
      // 현재 시간대 데이터 조회
      const res = await fetch('/api/population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selectedDistrict,
          dong: selectedDong,
        }),
      });
      const result = await res.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      setData(result);

      // 시간대별 데이터 조회
      const hourlyRes = await fetch(
        `/api/population?district=${encodeURIComponent(selectedDistrict)}&dong=${encodeURIComponent(selectedDong)}`
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

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  };

  // 연령대 그룹화 (더 넓은 범위로)
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">유동인구 분석</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">서울시 생활인구 데이터 기반</p>
        </div>
      </div>

      {/* 지역 선택 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            구 선택
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">구를 선택하세요</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            동 선택
          </label>
          <select
            value={selectedDong}
            onChange={(e) => setSelectedDong(e.target.value)}
            disabled={!selectedDistrict}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
          >
            <option value="">동을 선택하세요</option>
            {dongs.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={loading || !selectedDistrict || !selectedDong}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            조회 중...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            유동인구 조회
          </>
        )}
      </Button>

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* 결과 */}
      {data && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">총 유동인구</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(data.totalPopulation)}
              </p>
              <p className="text-xs text-slate-400">명</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">남성</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(data.malePopulation)}
              </p>
              <p className="text-xs text-slate-400">
                ({((data.malePopulation / data.totalPopulation) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">여성</p>
              <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                {formatNumber(data.femalePopulation)}
              </p>
              <p className="text-xs text-slate-400">
                ({((data.femalePopulation / data.totalPopulation) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* 조회 정보 */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selectedDistrict} {data.dongName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(data.date)} {data.hour}시
            </span>
          </div>

          {/* 연령대별 분포 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              연령대별 분포
            </p>
            <div className="space-y-3">
              {groupedAge.map((ag, i) => {
                const width = (ag.total / maxAgeTotal) * 100;
                const maleRatio = ag.total > 0 ? (ag.male / ag.total) * 100 : 50;

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {ag.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatNumber(ag.total)}명
                      </span>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full flex rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      >
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${maleRatio}%` }}
                        />
                        <div
                          className="h-full bg-pink-500"
                          style={{ width: `${100 - maleRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded-full" />
                남성
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-pink-500 rounded-full" />
                여성
              </span>
            </div>
          </div>

          {/* 시간대별 유동인구 */}
          {hourlyData && hourlyData.hourlyData.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                시간대별 유동인구
                {hourlyData.peakHour && (
                  <span className="ml-auto text-emerald-600 dark:text-emerald-400 normal-case">
                    피크: {hourlyData.peakHour.hour}시 ({formatNumber(hourlyData.peakHour.population)}명)
                  </span>
                )}
              </p>
              <div className="flex items-end gap-1 h-32">
                {hourlyData.hourlyData.map((h, i) => {
                  const maxPop = Math.max(...hourlyData.hourlyData.map(d => d.population), 1);
                  const height = (h.population / maxPop) * 100;
                  const isPeak = hourlyData.peakHour?.hour === h.hour;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${h.hour}시: ${formatNumber(h.population)}명`}
                      />
                      {h.hour % 6 === 0 && (
                        <span className="text-[10px] text-slate-400 mt-1">{h.hour}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0시</span>
                <span>6시</span>
                <span>12시</span>
                <span>18시</span>
                <span>23시</span>
              </div>
            </div>
          )}

          {/* 인사이트 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
              인사이트
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
              {data.femalePopulation > data.malePopulation ? (
                <li>여성 비율이 높은 지역입니다. 여성 타겟 마케팅이 효과적일 수 있습니다.</li>
              ) : (
                <li>남성 비율이 높은 지역입니다. 남성 타겟 마케팅을 고려해보세요.</li>
              )}
              {groupedAge[1].total + groupedAge[2].total > data.totalPopulation * 0.4 && (
                <li>20-30대 유동인구가 많습니다. SNS 마케팅이 효과적입니다.</li>
              )}
              {groupedAge[4].total + groupedAge[5].total > data.totalPopulation * 0.3 && (
                <li>50대 이상 유동인구가 많습니다. 오프라인 마케팅을 병행하세요.</li>
              )}
              {hourlyData?.peakHour && (
                <li>피크 시간대({hourlyData.peakHour.hour}시)에 맞춰 프로모션을 진행해보세요.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 안내 */}
      {!data && !loading && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">서울시 생활인구 데이터</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>서울시와 KT가 제공하는 유동인구 추정 데이터입니다</li>
            <li>5일 전까지의 데이터가 제공됩니다</li>
            <li>시간대별, 연령대별, 성별 유동인구를 확인할 수 있습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
