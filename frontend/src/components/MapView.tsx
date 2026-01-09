import { GoogleMap, useJsApiLoader, Circle, InfoWindow, OverlayView } from '@react-google-maps/api'
import { useState } from 'react'
import type { GridPoint } from '../types'

interface MapViewProps {
  gridPoints: GridPoint[]
  centerLat: number
  centerLng: number
}

const mapContainerStyle = {
  width: '100%',
  height: '500px'
}

const getRankColor = (rank: number | null): string => {
  if (rank === null) return '#DC2626' // dark red - not found (20+)
  if (rank >= 1 && rank <= 3) return '#059669' // dark green
  if (rank >= 4 && rank <= 7) return '#65A30D' // dark lime
  if (rank >= 8 && rank <= 12) return '#D97706' // dark amber
  if (rank >= 13 && rank <= 17) return '#EA580C' // dark orange
  return '#DC2626' // dark red - 18-20
}

const getRankLabel = (rank: number | null): string => {
  if (rank === null) return '순위: 20+'
  return `순위: ${rank}`
}

const getRankDisplayNumber = (rank: number | null): string => {
  if (rank === null) return '20+'
  return rank.toString()
}

export default function MapView({ gridPoints, centerLat, centerLng }: MapViewProps) {
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  if (loadError) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 font-bold mb-2">지도를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-600">
            Google Maps API 키를 확인해주세요
          </p>
          <p className="text-xs text-gray-500 mt-2">
            .env 파일에 VITE_GOOGLE_MAPS_API_KEY 설정 필요
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      </div>
    )
  }

  const center = { lat: centerLat, lng: centerLng }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-md">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={{
          mapTypeId: 'roadmap',
          streetViewControl: false,
          mapTypeControl: true,
        }}
      >
        {/* 그리드 포인트들을 원으로 표시 */}
        {gridPoints.map((point, idx) => (
          <div key={idx}>
            <Circle
              center={{ lat: point.lat, lng: point.lng }}
              radius={12} // 12미터 반경
              options={{
                fillColor: getRankColor(point.rank),
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
                clickable: true,
              }}
              onClick={() => setSelectedPoint(point)}
            />
            {/* 순위 숫자 표시 */}
            <OverlayView
              position={{ lat: point.lat, lng: point.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {getRankDisplayNumber(point.rank)}
              </div>
            </OverlayView>
          </div>
        ))}

        {/* 선택된 포인트의 정보창 */}
        {selectedPoint && (
          <InfoWindow
            position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            onCloseClick={() => setSelectedPoint(null)}
          >
            <div className="p-2">
              <p className="font-bold text-base mb-1">
                {getRankLabel(selectedPoint.rank ?? null)}
              </p>
              <p className="text-gray-600 text-sm">
                그리드: ({selectedPoint.grid_row}, {selectedPoint.grid_col})
              </p>
              {selectedPoint.business_name_in_result && (
                <p className="text-gray-700 text-sm mt-1">
                  발견: {selectedPoint.business_name_in_result}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
