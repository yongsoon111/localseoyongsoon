import type { ScanResult } from '../types'

interface SummaryProps {
  result: ScanResult
  onNewScan: () => void
}

export default function Summary({ result, onNewScan }: SummaryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = [
    {
      label: '평균 순위',
      value: result.average_rank?.toFixed(1) || 'N/A',
      color: 'text-blue-600'
    },
    {
      label: '최고 순위',
      value: result.best_rank?.toString() || 'N/A',
      color: 'text-green-600'
    },
    {
      label: '최저 순위',
      value: result.worst_rank?.toString() || 'N/A',
      color: 'text-red-600'
    },
    {
      label: '발견됨',
      value: `${result.found_count}개`,
      color: 'text-gray-700'
    },
    {
      label: '미발견',
      value: `${result.not_found_count}개`,
      color: 'text-gray-500'
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">스캔 완료</h2>
        <p className="text-sm text-gray-600">
          스캔 완료 시각: {formatDate(result.completed_at || '')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={onNewScan}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          새 스캔 시작
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
            PDF 다운로드
          </button>
          <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
            CSV 다운로드
          </button>
        </div>
      </div>
    </div>
  )
}
