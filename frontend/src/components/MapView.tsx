import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { GridPoint } from '../types'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  gridPoints: GridPoint[]
  centerLat: number
  centerLng: number
}

const getRankColor = (rank: number | null): string => {
  if (rank === null) return '#9CA3AF' // gray - not found
  if (rank >= 1 && rank <= 3) return '#10B981' // green
  if (rank >= 4 && rank <= 7) return '#84CC16' // light green
  if (rank >= 8 && rank <= 12) return '#FBBF24' // yellow
  if (rank >= 13 && rank <= 17) return '#FB923C' // orange
  return '#EF4444' // red - 18-20
}

const getRankLabel = (rank: number | null): string => {
  if (rank === null) return 'Not Found'
  return `순위: ${rank}`
}

export default function MapView({ gridPoints, centerLat, centerLng }: MapViewProps) {
  useEffect(() => {
    // Fix Leaflet default marker icon issue in React
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    })
  }, [])

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {gridPoints.map((point, idx) => (
          <CircleMarker
            key={idx}
            center={[point.lat, point.lng]}
            radius={12}
            fillColor={getRankColor(point.rank)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{getRankLabel(point.rank ?? null)}</p>
                <p className="text-gray-600">
                  그리드: ({point.grid_row}, {point.grid_col})
                </p>
                <p className="text-gray-500 text-xs">
                  {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
