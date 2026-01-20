'use client';

import React from 'react';
import {
  Bot, Sparkles, FileDown, Loader2, AlertCircle, ShieldCheck, Zap,
  Target, TrendingUp, Calendar, AlertTriangle, ListFilter, History
} from 'lucide-react';
import { ThemeType, ChecklistItem, ReviewAudit, TeleportResult, BusinessInfo } from '@/types';
import { useAuditStore } from '@/stores/audit-store';

interface AIReportSectionProps {
  business: BusinessInfo;
  checklist: ChecklistItem[];
  reviewData: ReviewAudit | null;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
  theme: ThemeType;
}

export function AIReportSection({
  business,
  checklist,
  reviewData,
  teleportResults,
  teleportKeyword,
  theme,
}: AIReportSectionProps) {
  const {
    aiReport: report,
    aiReportLoading: loading,
    aiReportError: error,
    generateAIReport,
  } = useAuditStore();

  const isDarkTheme = theme !== 'light';

  const handleGenerate = async () => {
    await generateAIReport(checklist);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('SUCCESS')) return <span className="text-green-500 font-bold">✅</span>;
    if (s.includes('WARNING')) return <span className="text-yellow-500 font-bold">⚠️</span>;
    return <span className="text-red-500 font-bold">❌</span>;
  };

  return (
    <div className={`rounded-3xl border shadow-2xl overflow-hidden mb-12 ${
      isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header (No Print) */}
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">주식회사 블링크애드</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">GBP Strategic Insight Engine V4</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl transition-all text-sm font-bold border border-slate-700 shadow-lg active:scale-95"
            >
              <FileDown className="w-4 h-4 text-blue-400" />
              PDF 인쇄
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-6 py-3 rounded-2xl transition-all text-sm font-black shadow-xl shadow-blue-500/20 active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI 심층 마스터 리포트 생성
          </button>
        </div>
      </div>

      <div className={`min-h-[400px] ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
        {error && (
          <div className="py-40 flex flex-col items-center justify-center text-center px-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              isDarkTheme ? 'bg-red-950/30' : 'bg-red-50'
            }`}>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className={`text-xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {error}
            </h3>
            <button
              onClick={handleGenerate}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {!report && !loading && !error && (
          <div className="py-40 flex flex-col items-center justify-center text-center px-6">
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 border relative group ${
              isDarkTheme
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-100'
            }`}>
              <Bot className={`w-12 h-12 relative z-10 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-2xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              심층 진단 마스터 리포트 대기 중
            </h3>
            <p className={`text-sm mt-3 max-w-sm leading-relaxed font-medium ${
              isDarkTheme ? 'text-slate-400' : 'text-slate-500'
            }`}>
              리뷰 트렌드 분석, 부정 패턴 추출 및 전 항목 진단을 포함한<br />
              주식회사 블링크애드 V4 마스터 보고서를 생성합니다.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-40 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className={`w-20 h-20 border-4 border-t-blue-600 rounded-full animate-spin ${
                isDarkTheme ? 'border-slate-800' : 'border-slate-100'
              }`} />
              <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
            </div>
            <p className={`text-xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              마스터 리포트 정밀 분석 및 생성 중...
            </p>
            <p className={`text-sm mt-3 font-medium uppercase tracking-widest ${
              isDarkTheme ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Integrating Trends, Patterns & Diagnostics
            </p>
          </div>
        )}

        {report && !loading && (
          <div className="p-10 md:p-16 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto print:p-8">
            {/* Header Data Section */}
            <div className={`mb-16 border-b-4 pb-12 ${isDarkTheme ? 'border-slate-700' : 'border-slate-900'}`}>
              <div className="flex justify-between items-start mb-10">
                <h1 className={`text-4xl font-black tracking-tighter leading-tight ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  Google Business Profile<br />심층 진단 보고서
                </h1>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Confidential</div>
                  <div className="bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase">V4.0 Master</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-16 text-sm">
                <div className={`flex items-center gap-4 py-3 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-400 w-32 shrink-0">Target Business</span>
                  <span className={`font-black ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>{report.targetBusiness}</span>
                </div>
                <div className={`flex items-center gap-4 py-3 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-400 w-32 shrink-0">Date</span>
                  <span className={`font-black ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>{report.date}</span>
                </div>
                <div className={`flex items-center gap-4 py-3 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-400 w-32 shrink-0">Auditor</span>
                  <span className={`font-black ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>{report.auditor}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Summary Section */}
            <div className="mb-20">
              <h2 className="text-xl font-black text-red-600 flex items-center gap-3 mb-8 uppercase tracking-tight">
                <AlertCircle className="w-6 h-6" />
                진단 요약
              </h2>
              <div className={`border-2 p-10 rounded-[2.5rem] relative shadow-inner ${
                isDarkTheme
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className={`text-2xl font-black mb-6 leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  &quot;{report.summary.headline}&quot;
                </h3>
                <p className={`text-base leading-relaxed font-medium ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  {report.summary.impactDescription}
                </p>
              </div>
            </div>

            {/* Review Trend Analysis */}
            {report.reviewTrend && report.reviewTrend.length > 0 && (
              <div className="mb-20">
                <h2 className={`text-xl font-black flex items-center gap-3 mb-8 uppercase tracking-tight ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  리뷰 트렌드 분석 (최근 6개월)
                </h2>
                <div className={`border-2 rounded-3xl overflow-hidden shadow-sm ${
                  isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b-2 text-sm font-black uppercase tracking-[0.1em] ${
                        isDarkTheme
                          ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}>
                        <th className="px-8 py-5">기간</th>
                        <th className="px-8 py-5">리뷰 수</th>
                        <th className="px-8 py-5">평균 평점</th>
                        <th className="px-8 py-5">응답률</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-black text-base ${
                      isDarkTheme ? 'divide-slate-700 text-slate-200' : 'divide-slate-100 text-slate-900'
                    }`}>
                      {report.reviewTrend.map((trend, i) => (
                        <tr key={i}>
                          <td className="px-8 py-6">{trend.period}</td>
                          <td className="px-8 py-6">{trend.count}개</td>
                          <td className="px-8 py-6 text-yellow-500">★ {trend.rating}</td>
                          <td className={`px-8 py-6 ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>
                            {trend.responseRate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Negative Review Pattern Analysis */}
            {report.negativePatterns && report.negativePatterns.topComplaints.length > 0 && (
              <div className="mb-20">
                <h2 className={`text-xl font-black flex items-center gap-3 mb-8 uppercase tracking-tight ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  <ListFilter className="w-6 h-6 text-red-600" />
                  부정 리뷰 패턴 분석 ({report.negativePatterns.totalNegativeReviews}개 리뷰 기준)
                </h2>
                <div className="space-y-4 mb-10">
                  <div className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">반복 불만 TOP 5</div>
                  {report.negativePatterns.topComplaints.map((comp, i) => (
                    <div key={i} className={`p-6 rounded-2xl border relative group transition-all hover:shadow-lg ${
                      isDarkTheme
                        ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-100 hover:bg-white'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                            {i + 1}
                          </span>
                          <h4 className={`font-black ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>
                            &quot;{comp.category}&quot;
                          </h4>
                        </div>
                        <span className={`font-black text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                          {comp.count}회 ({comp.percentage})
                        </span>
                      </div>
                      <div className={`pl-11 border-l-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-300'}`}>
                        <p className={`text-sm font-semibold italic leading-relaxed ${
                          isDarkTheme ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          - &quot;{comp.quotes}&quot;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> 우선 개선 권장
                  </h4>
                  <ul className="space-y-4">
                    {report.negativePatterns.prioritizedImprovements.map((item, i) => (
                      <li key={i} className="flex gap-4 text-base font-bold">
                        <span className="text-blue-400 font-black">{i + 1}순위:</span>
                        <span>{item.includes(':') ? item.split(':')[1].trim() : item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Itemized Diagnostics */}
            {report.sections && report.sections.length > 0 && (
              <div className="mb-20">
                <h2 className={`text-xl font-black flex items-center gap-3 mb-8 uppercase tracking-tight ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  <History className="w-6 h-6 text-slate-400" />
                  항목별 정밀 진단 내역
                </h2>
                {report.sections.map((section, idx) => (
                  <div key={idx} className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black">
                        {idx + 1}
                      </div>
                      <h3 className={`text-base font-black tracking-tight uppercase ${
                        isDarkTheme ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {section.title}
                      </h3>
                    </div>

                    <div className={`border-2 rounded-3xl overflow-hidden shadow-sm ${
                      isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                    }`}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`border-b-2 text-sm font-black uppercase tracking-[0.1em] ${
                            isDarkTheme
                              ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}>
                            <th className="px-8 py-4 w-1/4">항목</th>
                            <th className="px-8 py-4 w-16 text-center">상태</th>
                            <th className="px-8 py-4">AI 진단 의견</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-bold ${
                          isDarkTheme ? 'divide-slate-700' : 'divide-slate-100'
                        }`}>
                          {section.items.map((item, i) => (
                            <tr key={i} className={`transition-colors ${
                              isDarkTheme ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'
                            }`}>
                              <td className={`px-8 py-5 font-black text-sm ${
                                isDarkTheme ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {item.label}
                              </td>
                              <td className="px-8 py-5 text-center">{getStatusBadge(item.status)}</td>
                              <td className={`px-8 py-5 text-sm leading-relaxed font-bold ${
                                isDarkTheme ? 'text-slate-300' : 'text-slate-800'
                              }`}>
                                {item.diagnosis}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Final Assessment & Roadmap */}
            {report.finalAssessment && (
              <div className={`mt-24 pt-16 border-t-4 ${isDarkTheme ? 'border-slate-700' : 'border-slate-900'}`}>
                <h2 className="text-2xl font-black text-red-600 flex items-center gap-4 mb-10 uppercase tracking-tight">
                  <AlertCircle className="w-8 h-8" />
                  총평 및 액션플랜
                </h2>

                <div className="mb-16 space-y-8">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">현재 상태 요약</h3>
                    <p className={`text-2xl font-black leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      &quot;{report.finalAssessment.oneLineReview}&quot;
                    </p>
                  </div>
                  <div className="bg-red-600 text-white p-8 rounded-3xl shadow-2xl flex items-start gap-4">
                    <AlertTriangle className="w-7 h-7 shrink-0" />
                    <p className="text-base font-black leading-relaxed">
                      {report.finalAssessment.warning}
                    </p>
                  </div>
                </div>

                {report.actionPlan && report.actionPlan.length > 0 && (
                  <div className={`rounded-[3rem] p-12 border ${
                    isDarkTheme
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h3 className={`text-sm font-black uppercase tracking-[0.3em] mb-12 flex items-center gap-3 ${
                      isDarkTheme ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Zap className="w-6 h-6 text-blue-600" />
                      가장 시급한 3가지 실행 과제
                    </h3>

                    <div className="grid grid-cols-1 gap-10">
                      {report.actionPlan.map((plan, i) => (
                        <div key={i} className={`flex gap-10 group ${
                          i < report.actionPlan.length - 1
                            ? `pb-10 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`
                            : ''
                        }`}>
                          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-black text-xl mb-4 tracking-tight ${
                              isDarkTheme ? 'text-white' : 'text-slate-900'
                            }`}>
                              {plan.title}
                            </h4>
                            <div className={`flex items-start gap-3 text-base leading-relaxed font-semibold ${
                              isDarkTheme ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              <TrendingUp className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                              <span>{plan.description}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Official Signature */}
            <div className={`mt-40 pt-16 border-t-2 flex flex-col md:flex-row justify-between items-end gap-10 ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="max-w-xs text-slate-400 text-[10px] leading-relaxed font-bold italic">
                본 리포트는 주식회사 블링크애드의 전략적 분석 알고리즘 V4에 의해 생성되었습니다.
                Google Business Profile의 실시간 신호와 로컬 SEO 데이터를 바탕으로 합니다.
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-6 mb-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-right leading-none">
                    <p className={`text-3xl font-black tracking-tighter ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      주식회사 블링크애드
                    </p>
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase mt-2">
                      Strategic Insight Group
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-2">
                  Authorized Auditor: CEO SOONHYUN KWON
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIReportSection;
