import { useState } from 'react'
import UrlInput from './components/UrlInput'
import ScanConfig from './components/ScanConfig'
import ScanProgress from './components/ScanProgress'
import MapView from './components/MapView'
import RankGrid from './components/RankGrid'
import Summary from './components/Summary'
import { scanApi } from './services/api'
import type { ScanConfig as ScanConfigType, ScanResult } from './types'

type AppStep = 'url' | 'config' | 'scanning' | 'results'

function App() {
  const [step, setStep] = useState<AppStep>('url')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [scanId, setScanId] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [gridSize, setGridSize] = useState(5)

  const handleUrlSubmit = (url: string) => {
    setGoogleMapsUrl(url)
    setStep('config')
  }

  const handleConfigSubmit = async (config: ScanConfigType) => {
    setIsLoading(true)
    setGridSize(config.grid_size)

    try {
      const response = await scanApi.create(config)
      setScanId(response.snapshot_id)
      setStep('scanning')
    } catch (error) {
      console.error('Failed to create scan:', error)
      alert('스캔 생성 실패. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanComplete = async () => {
    try {
      const response = await scanApi.getResults(scanId)
      setScanResult(response)
      setStep('results')
    } catch (error) {
      console.error('Failed to fetch results:', error)
      alert('결과 조회 실패. 다시 시도해주세요.')
    }
  }

  const handleNewScan = () => {
    setStep('url')
    setGoogleMapsUrl('')
    setScanId('')
    setScanResult(null)
    setGridSize(5)
  }

  const handleBack = () => {
    setStep('url')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Local SEO Rank Tracker
          </h1>
          <p className="text-gray-600">
            Google Maps 기반 지역별 순위 측정 도구
          </p>
        </header>

        <div className="mb-8">
          {step === 'url' && (
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
          )}

          {step === 'config' && (
            <ScanConfig
              googleMapsUrl={googleMapsUrl}
              onSubmit={handleConfigSubmit}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}

          {step === 'scanning' && (
            <ScanProgress
              scanId={scanId}
              totalPoints={gridSize * gridSize}
              onComplete={handleScanComplete}
            />
          )}

          {step === 'results' && scanResult && (
            <div className="space-y-6">
              <Summary result={scanResult} onNewScan={handleNewScan} />

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">히트맵</h3>
                <MapView
                  gridPoints={scanResult.grid_points}
                  centerLat={scanResult.center_lat}
                  centerLng={scanResult.center_lng}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <RankGrid
                  gridPoints={scanResult.grid_points}
                  gridSize={gridSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
