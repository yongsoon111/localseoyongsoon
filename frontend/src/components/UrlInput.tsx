import { useState } from 'react'

interface UrlInputProps {
  onSubmit: (data: { url: string; searchQuery: string; radiusMiles: number }) => void
  isLoading?: boolean
}

export default function UrlInput({ onSubmit, isLoading = false }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(5)
  const [error, setError] = useState('')

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('Google Maps URL을 입력해주세요')
      return false
    }

    const googleMapsPattern = /(google\.com\/maps|maps\.app\.goo\.gl)/i
    if (!googleMapsPattern.test(input)) {
      setError('올바른 Google Maps URL을 입력해주세요')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUrl(url)) {
      return
    }

    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요')
      return
    }

    setError('')
    onSubmit({ url, searchQuery, radiusMiles })
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">스캔 설정</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="maps-url" className="block text-sm font-medium text-gray-700 mb-2">
            비즈니스 Google Maps URL *
          </label>
          <input
            id="maps-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.google.com/maps/place/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
            검색어 *
          </label>
          <input
            id="search-query"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="예: 피자집, 카페, 마사지, 헤어샵 등"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Google Maps에서 검색할 키워드 (비즈니스가 어떤 검색어로 랭킹되는지 측정)
          </p>
        </div>

        <div>
          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
            반경 (마일) *
          </label>
          <input
            id="radius"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            placeholder="예: 0.1, 5, 10"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            0.1 ~ 10 마일 사이의 값을 입력하세요 (비즈니스 위치를 중심으로 측정할 반경)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '비즈니스 정보 가져오는 중...' : '다음 단계'}
        </button>
      </form>
    </div>
  )
}
