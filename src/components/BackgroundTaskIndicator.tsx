'use client';

import { useAuditStore, TaskType } from '@/stores/audit-store';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

const taskLabels: Record<TaskType, string> = {
  audit: '프로필 진단',
  reviews: '리뷰 분석',
  teleport: '검색순위 체크',
  scrape: 'GMaps 스크래핑',
  competitors: '경쟁사 분석',
  ai_report: 'AI 보고서 생성',
};

export function BackgroundTaskIndicator() {
  const { backgroundTasks, clearCompletedTasks } = useAuditStore();

  if (backgroundTasks.length === 0) return null;

  const runningTasks = backgroundTasks.filter((t) => t.status === 'running');
  const completedTasks = backgroundTasks.filter((t) => t.status === 'completed');
  const failedTasks = backgroundTasks.filter((t) => t.status === 'failed');

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* 실행 중인 작업 */}
      {runningTasks.map((task) => (
        <div
          key={task.id}
          className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right"
        >
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{taskLabels[task.type]}</p>
            <p className="text-xs text-blue-200 truncate">{task.businessName}</p>
          </div>
        </div>
      ))}

      {/* 완료된 작업 */}
      {completedTasks.map((task) => (
        <div
          key={task.id}
          className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{taskLabels[task.type]} 완료</p>
            <p className="text-xs text-green-200 truncate">{task.businessName}</p>
          </div>
        </div>
      ))}

      {/* 실패한 작업 */}
      {failedTasks.map((task) => (
        <div
          key={task.id}
          className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right"
        >
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{taskLabels[task.type]} 실패</p>
            <p className="text-xs text-red-200 truncate">{task.error || task.businessName}</p>
          </div>
          <button
            onClick={clearCompletedTasks}
            className="p-1 hover:bg-red-500 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
