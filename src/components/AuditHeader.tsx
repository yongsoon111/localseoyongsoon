'use client';

import React, { useState } from 'react';
import {
  Star, MessageSquare, Image, RotateCcw, TrendingUp, CheckCircle2,
  History, ClipboardCheck, Search, Bot, Database, Loader2, Users,
  Palette, Sun, Moon, Droplets, Leaf, Anchor, Wrench, Building2, ExternalLink
} from 'lucide-react';
import { BusinessInfo, AuditTab, ThemeType, ReviewAudit, TeleportResult } from '@/types';

interface AuditHeaderProps {
  business: BusinessInfo;
  basicScore: number;
  activeTab: AuditTab;
  onTabChange: (tab: AuditTab) => void;
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  reviewData: ReviewAudit | null;
  teleportResults: TeleportResult[];
  onScrape: () => void;
  scrapeLoading: boolean;
}

export function AuditHeader({
  business,
  basicScore,
  activeTab,
  onTabChange,
  currentTheme,
  onThemeChange,
  reviewData,
  teleportResults,
  onScrape,
  scrapeLoading,
}: AuditHeaderProps) {
  const [showThemes, setShowThemes] = useState(false);

  const themes: { id: ThemeType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'light', label: '라이트', icon: <Sun className="w-3.5 h-3.5" />, color: 'bg-white' },
    { id: 'dark', label: '블랙', icon: <Moon className="w-3.5 h-3.5" />, color: 'bg-black' },
    { id: 'blue', label: '짙은 블루', icon: <Droplets className="w-3.5 h-3.5" />, color: 'bg-blue-900' },
    { id: 'green', label: '짙은 초록', icon: <Leaf className="w-3.5 h-3.5" />, color: 'bg-emerald-900' },
    { id: 'navy', label: '네이비', icon: <Anchor className="w-3.5 h-3.5" />, color: 'bg-slate-900' },
  ];

  const metrics = [
    { label: '완성도', value: basicScore, unit: '%', icon: <CheckCircle2 className="w-4 h-4 text-blue-500" /> },
    { label: '평점', value: business.rating > 0 ? business.rating.toFixed(1) : '-', unit: '', icon: <Star className="w-4 h-4 text-yellow-400 fill-current" /> },
    { label: '리뷰수', value: business.reviewCount, unit: '개', icon: <MessageSquare className="w-4 h-4 text-green-500" /> },
    { label: '사진수', value: business.photos, unit: '장', icon: <Image className="w-4 h-4 text-purple-500" /> },
    { label: '응답률', value: reviewData ? Math.round(reviewData.analysis.responseRate) : '-', unit: '%', icon: <RotateCcw className="w-4 h-4 text-orange-500" /> },
    { label: '검색순위', value: teleportResults[0]?.rank || '-', unit: '위', icon: <TrendingUp className="w-4 h-4 text-red-500" /> },
  ];

  const isDarkTheme = currentTheme !== 'light';

  // 등급 계산
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', label: '최우수' };
    if (score >= 80) return { grade: 'A', label: '우수' };
    if (score >= 70) return { grade: 'B', label: '양호' };
    if (score >= 60) return { grade: 'C', label: '보통' };
    return { grade: 'D', label: '개선 필요' };
  };

  const gradeInfo = getGrade(basicScore);

  return (
    <header className="glass-header border-b no-print">
      <div className="container mx-auto px-0 py-4 max-w-3xl">
        {/* Upper Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg shrink-0 border ${
              isDarkTheme
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-900 border-slate-700/50 text-white'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
              <span className="text-2xl font-black">{basicScore}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-header)' }}>
                  {business.name}
                </h1>
                <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                  gradeInfo.grade === 'A+'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {gradeInfo.grade} {gradeInfo.grade === 'A+' && gradeInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-header-sub)' }}>
                  {business.category} • {business.address}
                </p>
                <div className="h-3 w-px mx-1 bg-slate-500/30" />
                <div className={`flex items-center gap-1 text-xs font-bold ${
                  (business.scoreHistory?.[business.scoreHistory.length - 1]?.score || basicScore) >= (business.scoreHistory?.[business.scoreHistory.length - 2]?.score || basicScore)
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  <History className="w-3 h-3" />
                  {business.scoreHistory && business.scoreHistory.length > 1 ? (
                    <>
                      전주 대비 {(() => {
                        const current = business.scoreHistory[business.scoreHistory.length - 1]?.score || basicScore;
                        const prev = business.scoreHistory[business.scoreHistory.length - 2]?.score || basicScore;
                        const diff = current - prev;
                        return diff >= 0 ? `+${diff}` : diff;
                      })()}점 {(business.scoreHistory[business.scoreHistory.length - 1]?.score || basicScore) >= (business.scoreHistory[business.scoreHistory.length - 2]?.score || basicScore) ? '상승' : '하락'}
                    </>
                  ) : (
                    <>신규 진단</>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Theme Selector */}
            <div className="relative mr-2">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 border ${
                  isDarkTheme
                    ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">테마</span>
              </button>
              {showThemes && (
                <div className={`absolute top-full right-0 mt-2 rounded-2xl shadow-2xl border p-2 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 ${
                  isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { onThemeChange(t.id); setShowThemes(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-bold mb-1 last:mb-0 ${
                        currentTheme === t.id
                          ? 'bg-blue-600 text-white'
                          : isDarkTheme
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${t.color} ${t.id === 'light' ? 'border-slate-200' : 'border-white/20'}`}>
                        {t.icon}
                      </div>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nav Tabs */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isDarkTheme ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
            }`}>
              <button
                onClick={() => onTabChange('DIAGNOSTIC')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold ${
                  activeTab === 'DIAGNOSTIC'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                프로필 진단
              </button>

              {activeTab === 'DIAGNOSTIC' && (
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-500/30">
                  <button
                    onClick={onScrape}
                    disabled={scrapeLoading}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[10px] font-black transition-all disabled:opacity-50 ${
                      isDarkTheme
                        ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700'
                        : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {scrapeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    GMaps 스크래핑
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onTabChange('REVIEWS')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                activeTab === 'REVIEWS'
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : isDarkTheme
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/50'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              리뷰 분석
            </button>
            <button
              onClick={() => onTabChange('RANKING')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                activeTab === 'RANKING'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : isDarkTheme
                    ? 'bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/50'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              검색순위 체크
            </button>
            <button
              onClick={() => onTabChange('COMPETITORS')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                activeTab === 'COMPETITORS'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : isDarkTheme
                    ? 'bg-orange-900/30 text-orange-400 border-orange-900/50 hover:bg-orange-900/50'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              경쟁사 분석
            </button>
            <button
              onClick={() => onTabChange('AI_REPORT')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                activeTab === 'AI_REPORT'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : isDarkTheme
                    ? 'bg-purple-900/30 text-purple-400 border-purple-900/50 hover:bg-purple-900/50'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              AI 진단 보고서
            </button>
            <button
              onClick={() => onTabChange('TOOLS')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                activeTab === 'TOOLS'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : isDarkTheme
                    ? 'bg-teal-900/30 text-teal-400 border-teal-900/50 hover:bg-teal-900/50'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              도구
            </button>
            {business.location?.lat && business.location?.lng && (
              <button
                onClick={() => {
                  const naverLandUrl = `https://m.land.naver.com/map/${business.location!.lat}:${business.location!.lng}:17:0/SG/B2#mapList`;
                  window.open(naverLandUrl, '_blank');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border ${
                  isDarkTheme
                    ? 'bg-green-900/30 text-green-400 border-green-900/50 hover:bg-green-900/50'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                네이버 부동산
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Lower Row: Metrics Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {metrics.map((m, idx) => (
            <div key={idx} className={`flex flex-col items-center p-2 rounded-xl border transition-all hover:shadow-sm ${
              isDarkTheme
                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                : 'bg-gray-50 border-gray-100 hover:bg-white'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-center">
                {m.icon}
                <span className={`text-[10px] md:text-[11px] font-semibold uppercase tracking-tight ${
                  isDarkTheme ? 'text-slate-400' : 'text-gray-500'
                }`}>{m.label}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-base md:text-lg font-bold ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>{m.value}</span>
                <span className={`text-[10px] font-medium ${
                  isDarkTheme ? 'text-slate-500' : 'text-gray-400'
                }`}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export default AuditHeader;
