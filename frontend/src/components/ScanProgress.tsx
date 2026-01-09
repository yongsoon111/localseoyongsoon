import { useEffect, useState, useRef } from 'react'
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
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] 스캔 시작...`,
    `[${new Date().toLocaleTimeString()}] 총 ${totalPoints}개 포인트 스캔 예정`,
  ])
  const logContainerRef = useRef<HTMLDivElement>(null)
  const prevCompletedRef = useRef<number>(0)

  // 폴링 방식으로 스캔 상태 확인
  useEffect(() => {
    let isMounted = true
    let pollInterval: number

    const fetchScanProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('rank_snapshots')
          .select('completed_points, status')
          .eq('id', scanId)
          .single()

        if (!isMounted) return

        if (data && !error) {
          const prevCompleted = prevCompletedRef.current
          const newCompleted = data.completed_points || 0

          setCompleted(newCompleted)
          setStatus(data.status)
          prevCompletedRef.current = newCompleted

          // 새 포인트가 완료되면 로그 추가
          if (newCompleted > prevCompleted) {
            setLogs(prev => [
              ...prev.slice(-10), // 최근 10개만 유지
              `[${new Date().toLocaleTimeString()}] 포인트 ${newCompleted}/${totalPoints} 완료`
            ])
          }

          // 완료 또는 실패 시 처리
          if (data.status === 'completed') {
            setLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] 스캔 완료! 결과를 불러오는 중...`
            ])
            clearInterval(pollInterval)
            onComplete()
          } else if (data.status === 'failed') {
            setLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] 오류: 스캔 실패`
            ])
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Failed to fetch scan progress:', error)
      }
    }

    // 즉시 한 번 실행
    fetchScanProgress()

    // 1초마다 폴링
    pollInterval = setInterval(fetchScanProgress, 1000)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
    }
  }, [scanId, onComplete, totalPoints])

  // 로그가 업데이트되면 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

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
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-sm text-gray-600">
              각 그리드 포인트에서 순위를 측정하고 있습니다...
            </span>
          </div>

          {/* 로그 창 */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">진행 로그</h3>
            <div
              ref={logContainerRef}
              className="bg-gray-900 rounded p-3 h-40 overflow-y-auto font-mono text-xs"
            >
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))}
              {status === 'in_progress' && (
                <div className="text-green-400 animate-pulse">
                  ▊
                </div>
              )}
            </div>
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
