import { useState } from 'react'
import type { ScanConfig as ScanConfigType } from '../types'

interface ScanConfigProps {
  googleMapsUrl: string
  onSubmit: (config: ScanConfigType) => void
  onBack: () => void
  isLoading?: boolean
}

export default function ScanConfig({
  googleMapsUrl,
  onSubmit,
  onBack,
  isLoading = false
}: ScanConfigProps) {
  const [gridSize, setGridSize] = useState(5)
  const [radiusMiles, setRadiusMiles] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      google_maps_url: googleMapsUrl,
      radius_miles: radiusMiles,
      grid_size: gridSize,
    })
  }

  const totalPoints = gridSize * gridSize
  const estimatedTime = Math.ceil(totalPoints * 3 / 60)

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">스캔 설정</h2>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">URL: {googleMapsUrl}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            그리드 크기: {gridSize}x{gridSize} ({totalPoints}개 포인트)
          </label>
          <input
            type="range"
            min="3"
            max="7"
            step="2"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3x3 (9개)</span>
            <span>5x5 (25개)</span>
            <span>7x7 (49개)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            반경: {radiusMiles} 마일
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 마일</span>
            <span>10 마일</span>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">
            예상 소요 시간: 약 {estimatedTime}분
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '스캔 시작 중...' : '스캔 시작'}
          </button>
        </div>
      </form>
    </div>
  )
}
