import { useState } from 'react'

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading?: boolean
}

export default function UrlInput({ onSubmit, isLoading = false }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('Google Maps URL을 입력해주세요')
      return false
    }

    const googleMapsPattern = /google\.com\/maps/i
    if (!googleMapsPattern.test(input)) {
      setError('올바른 Google Maps URL을 입력해주세요')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateUrl(url)) {
      onSubmit(url)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Google Maps URL 입력</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="maps-url" className="block text-sm font-medium text-gray-700 mb-2">
            비즈니스 Google Maps URL
          </label>
          <input
            id="maps-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.google.com/maps/place/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '처리 중...' : '다음 단계'}
        </button>
      </form>
    </div>
  )
}
