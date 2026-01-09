import { useState, useEffect } from 'react'
import type { ScanConfig as ScanConfigType } from '../types'

interface ScrapedBusinessInfo {
  name?: string
  address?: string
  phone?: string
  website?: string
  category?: string
  rating?: string
  review_count?: string
  place_id?: string
  lat?: string
  lng?: string
}

interface ScanConfigProps {
  googleMapsUrl: string
  searchQuery: string
  radiusMiles: number
  scrapedInfo?: ScrapedBusinessInfo | null
  onSubmit: (config: ScanConfigType) => void
  onBack: () => void
  isLoading?: boolean
}

export default function ScanConfig({
  googleMapsUrl,
  searchQuery: initialSearchQuery,
  radiusMiles: initialRadiusMiles,
  scrapedInfo,
  onSubmit,
  onBack,
  isLoading = false
}: ScanConfigProps) {
  const [gridSize, setGridSize] = useState(5)
  const [radiusMiles, setRadiusMiles] = useState(initialRadiusMiles)
  const [searchQuery] = useState(initialSearchQuery)
  const [businessName, setBusinessName] = useState('')
  const [centerLat, setCenterLat] = useState(37.5665)
  const [centerLng, setCenterLng] = useState(126.9780)

  // 스크래핑된 정보로 자동 채우기
  useEffect(() => {
    if (scrapedInfo) {
      if (scrapedInfo.name) setBusinessName(scrapedInfo.name)
      if (scrapedInfo.lat) setCenterLat(parseFloat(scrapedInfo.lat))
      if (scrapedInfo.lng) setCenterLng(parseFloat(scrapedInfo.lng))
    }
  }, [scrapedInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      alert('검색어를 입력해주세요.')
      return
    }
    if (!businessName.trim()) {
      alert('비즈니스 이름을 입력해주세요.')
      return
    }
    onSubmit({
      google_maps_url: googleMapsUrl,
      business_name: businessName,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_miles: radiusMiles,
      grid_size: gridSize,
      search_query: searchQuery,
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

      {scrapedInfo && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-800">비즈니스 정보 자동 입력 완료</p>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            {scrapedInfo.name && <p>• 비즈니스 이름: {scrapedInfo.name}</p>}
            {scrapedInfo.category && <p>• 카테고리: {scrapedInfo.category}</p>}
            {scrapedInfo.address && <p>• 주소: {scrapedInfo.address}</p>}
            {scrapedInfo.lat && scrapedInfo.lng && (
              <p>• 좌표: {scrapedInfo.lat}, {scrapedInfo.lng}</p>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>검색어:</strong> {searchQuery}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          이 키워드로 Google Maps에서 순위를 측정합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비즈니스 이름 *
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="예: 빨간그네 다낭"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            검색 결과에서 찾을 비즈니스 이름
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              중심 위도
            </label>
            <input
              type="number"
              step="0.0001"
              value={centerLat}
              onChange={(e) => setCenterLat(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              중심 경도
            </label>
            <input
              type="number"
              step="0.0001"
              value={centerLng}
              onChange={(e) => setCenterLng(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>
        </div>

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
            min="0.1"
            max="10"
            step="0.1"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1 마일</span>
            <span>10 마일</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            비즈니스 위치를 중심으로 측정할 반경 거리
          </p>
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
