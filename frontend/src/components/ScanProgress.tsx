import { useEffect, useState } from 'react'
import { supabase } from '../services/api'

interface ScanProgressProps {
  scanId: string
  totalPoints: number
  onComplete: () => void
}

export default function ScanProgress({
  scanId,
  totalPoints,
  onComplete
}: ScanProgressProps) {
  const [completed, setCompleted] = useState(0)
  const [status, setStatus] = useState<string>('in_progress')

  useEffect(() => {
    const subscription = supabase
      .channel(`scan-${scanId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rank_snapshots',
          filter: `id=eq.${scanId}`
        },
        (payload) => {
          const data = payload.new
          setCompleted(data.completed_points || 0)
          setStatus(data.status)

          if (data.status === 'completed') {
            onComplete()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [scanId, onComplete])

  const progress = Math.round((completed / totalPoints) * 100)

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">스캔 진행 중...</h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>진행률</span>
            <span>{completed} / {totalPoints} 포인트</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-blue-600">{progress}%</span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-sm text-gray-600">
              각 그리드 포인트에서 순위를 측정하고 있습니다...
            </span>
          </div>
        </div>

        {status === 'failed' && (
          <div className="p-4 bg-red-50 rounded border border-red-200">
            <p className="text-red-700">스캔 중 오류가 발생했습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
