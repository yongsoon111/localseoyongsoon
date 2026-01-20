'use client';

import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, XCircle, Search, TrendingUp, AlertOctagon, Info } from 'lucide-react';
import { ChecklistItem, DiagnosticStatus, ThemeType } from '@/types';

interface ChecklistProps {
  data: ChecklistItem[];
  theme: ThemeType;
}

export function Checklist({ data, theme }: ChecklistProps) {
  const isDarkTheme = theme !== 'light';

  // 상태별 카운트
  const successCount = data.filter(d => d.status === DiagnosticStatus.SUCCESS).length;
  const warningCount = data.filter(d => d.status === DiagnosticStatus.WARNING).length;
  const errorCount = data.filter(d => d.status === DiagnosticStatus.ERROR).length;

  const getStatusIcon = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.SUCCESS:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case DiagnosticStatus.WARNING:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case DiagnosticStatus.ERROR:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBgColor = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.SUCCESS:
        return isDarkTheme ? 'bg-green-900/10' : 'bg-green-50/50';
      case DiagnosticStatus.WARNING:
        return isDarkTheme ? 'bg-amber-900/10' : 'bg-amber-50/50';
      case DiagnosticStatus.ERROR:
        return isDarkTheme ? 'bg-red-900/10' : 'bg-red-50/50';
      default:
        return '';
    }
  };

  const getStatusTextColor = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.SUCCESS:
        return isDarkTheme ? 'text-green-400' : 'text-green-700';
      case DiagnosticStatus.WARNING:
        return isDarkTheme ? 'text-amber-400' : 'text-amber-700';
      case DiagnosticStatus.ERROR:
        return isDarkTheme ? 'text-red-400' : 'text-red-700';
      default:
        return isDarkTheme ? 'text-slate-400' : 'text-slate-600';
    }
  };

  return (
    <div className={`rounded-3xl border shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ${
      isDarkTheme
        ? 'bg-slate-900/80 border-slate-800 shadow-slate-900/50'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      {/* Header Section */}
      <div className={`p-6 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDarkTheme ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                프로필 진단 체크리스트
              </h2>
              <p className={`text-xs font-medium mt-0.5 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                GBP 최적화 상태를 실시간으로 분석합니다
              </p>
            </div>
          </div>

          {/* Status Summary Pills */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isDarkTheme ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {successCount}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isDarkTheme ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {warningCount}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              <AlertOctagon className="w-3.5 h-3.5" />
              {errorCount}
            </div>
          </div>
        </div>

        <div className={`mt-4 flex items-center gap-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
          <Search className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">게시물/Q&A 최적화 상태 확인</span>
          <div className={`h-px flex-1 ml-2 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">총 {data.length}개 항목</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            <tr className={`text-[11px] font-bold uppercase tracking-wider ${
              isDarkTheme
                ? 'bg-slate-800/30 text-slate-500'
                : 'bg-slate-50/80 text-slate-400'
            }`}>
              <th className="px-6 py-4">카테고리</th>
              <th className="px-6 py-4">항목</th>
              <th className="px-6 py-4 text-center">상태</th>
              <th className="px-6 py-4">현재값</th>
              <th className="px-6 py-4">진단</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
            {data.map((item, idx) => (
              <tr
                key={idx}
                className={`transition-all ${getStatusBgColor(item.status)} ${
                  isDarkTheme ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'
                }`}
              >
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap uppercase tracking-wide ${
                    isDarkTheme
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.category}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold text-sm whitespace-nowrap ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  {item.item}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    {getStatusIcon(item.status)}
                  </div>
                </td>
                <td className={`px-6 py-4 text-sm max-w-[200px] truncate ${
                  isDarkTheme ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {item.currentValue}
                </td>
                <td className={`px-6 py-4 text-sm font-medium ${getStatusTextColor(item.status)}`}>
                  {item.diagnosis}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with improvement suggestions */}
      {errorCount > 0 && (
        <div className={`px-6 py-4 border-t ${isDarkTheme ? 'border-slate-800 bg-red-900/10' : 'border-slate-100 bg-red-50/50'}`}>
          <div className="flex items-center gap-2">
            <AlertOctagon className={`w-4 h-4 ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`} />
            <span className={`text-xs font-bold ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
              {errorCount}개 항목이 즉시 개선이 필요합니다
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checklist;
