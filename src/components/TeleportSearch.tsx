'use client';

import { useState, useRef } from 'react';
import { MapPicker } from './MapPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeleportResult } from '@/types';
import { useAuditStore } from '@/stores/audit-store';

interface TeleportSearchProps {
  targetPlaceId: string;
  businessLocation: { lat: number; lng: number };
  businessName: string;
}

// 헬퍼 함수들
function calculateAverageRank(results: TeleportResult[]): string {
  const rankedResults = results.filter((r) => r.rank !== null);
  if (rankedResults.length === 0) return '-';
  const sum = rankedResults.reduce((acc, r) => acc + (r.rank || 0), 0);
  return (sum / rankedResults.length).toFixed(1);
}

function getBestRank(results: TeleportResult[]): string {
  const ranks = results.filter((r) => r.rank !== null).map((r) => r.rank as number);
  if (ranks.length === 0) return '-';
  return Math.min(...ranks).toString();
}

function getWorstRank(results: TeleportResult[]): string {
  const ranks = results.filter((r) => r.rank !== null).map((r) => r.rank as number);
  if (ranks.length === 0) return '-';
  return Math.max(...ranks).toString();
}

export function TeleportSearch({
  targetPlaceId,
  businessLocation,
  businessName,
}: TeleportSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [singleResult, setSingleResult] = useState<TeleportResult | null>(null);
  const [gridResults, setGridResults] = useState<TeleportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'grid'>('single');
  const [gridRadius, setGridRadius] = useState<number>(0.5); // 마일 단위
  const [gridSize, setGridSize] = useState<number>(3); // 그리드 크기 (3x3, 5x5, 7x7)
  const [mapState, setMapState] = useState<{
    zoom: number;
    center: { lat: number; lng: number };
    bounds: { north: number; south: number; east: number; west: number } | null;
  } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 순위에 따른 색상 반환
  const getRankColorHex = (rank: number | null): string => {
    if (rank === null) return '#9CA3AF';
    if (rank <= 3) return '#22C55E';
    if (rank <= 5) return '#84CC16';
    if (rank <= 10) return '#EAB308';
    if (rank <= 15) return '#F97316';
    return '#EF4444';
  };

  // 핀 마커를 Canvas에 그리는 함수
  const drawPinMarker = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string
  ) => {
    const pinWidth = 40;
    const pinHeight = 50;
    const circleRadius = 14;

    // 핀 모양 그리기
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x - pinWidth / 2, y - pinHeight * 0.4,
      x - pinWidth / 2, y - pinHeight * 0.8,
      x, y - pinHeight
    );
    ctx.bezierCurveTo(
      x + pinWidth / 2, y - pinHeight * 0.8,
      x + pinWidth / 2, y - pinHeight * 0.4,
      x, y
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 흰색 원 그리기
    ctx.beginPath();
    ctx.arc(x, y - pinHeight + circleRadius + 8, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // 텍스트 그리기
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - pinHeight + circleRadius + 8);
  };

  // 위경도를 픽셀 좌표로 변환
  const latLngToPixel = (
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    zoom: number,
    mapWidth: number,
    mapHeight: number
  ) => {
    const scale = Math.pow(2, zoom);
    const worldCoordinateCenter = project(centerLat, centerLng);
    const worldCoordinate = project(lat, lng);

    const pixelX = (worldCoordinate.x - worldCoordinateCenter.x) * scale + mapWidth / 2;
    const pixelY = (worldCoordinate.y - worldCoordinateCenter.y) * scale + mapHeight / 2;

    return { x: pixelX, y: pixelY };
  };

  // Mercator 투영
  const project = (lat: number, lng: number) => {
    const siny = Math.sin((lat * Math.PI) / 180);
    const boundedSiny = Math.max(-0.9999, Math.min(0.9999, siny));
    return {
      x: 256 * (0.5 + lng / 360),
      y: 256 * (0.5 - Math.log((1 + boundedSiny) / (1 - boundedSiny)) / (4 * Math.PI)),
    };
  };

  // 지도 캡처 함수 - Google Maps Static API + Canvas 마커 합성
  const handleCaptureMap = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      alert('Google Maps API 키가 설정되지 않았습니다');
      return;
    }

    try {
      const mapWidth = 800;
      const mapHeight = 600;

      // 현재 지도 상태 사용 (없으면 기본값)
      const currentZoom = mapState?.zoom || 15;
      const currentCenter = mapState?.center || businessLocation;

      // Static Map URL (마커 없이 기본 지도만)
      let staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?`;
      staticMapUrl += `center=${currentCenter.lat},${currentCenter.lng}`;
      staticMapUrl += `&zoom=${currentZoom}`;
      staticMapUrl += `&size=${mapWidth}x${mapHeight}`;
      staticMapUrl += `&scale=2`;
      staticMapUrl += `&maptype=roadmap`;
      staticMapUrl += `&key=${apiKey}`;

      // 이미지 로드
      const response = await fetch(staticMapUrl);
      const blob = await response.blob();
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      // Canvas 생성 (scale=2 이므로 실제 크기는 2배)
      const canvas = document.createElement('canvas');
      canvas.width = mapWidth * 2;
      canvas.height = mapHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context 생성 실패');

      // 지도 이미지 그리기
      ctx.drawImage(img, 0, 0, mapWidth * 2, mapHeight * 2);

      // 마커 그리기
      if (mode === 'grid' && gridResults.length > 0) {
        gridResults.forEach((r) => {
          const pixel = latLngToPixel(
            r.lat,
            r.lng,
            currentCenter.lat,
            currentCenter.lng,
            currentZoom,
            mapWidth * 2,
            mapHeight * 2
          );
          const label = r.rank?.toString() || '-';
          const color = getRankColorHex(r.rank);
          drawPinMarker(ctx, pixel.x, pixel.y, label, color);
        });
      }

      // 업장 위치 마커 (빨간 원)
      const businessPixel = latLngToPixel(
        businessLocation.lat,
        businessLocation.lng,
        currentCenter.lat,
        currentCenter.lng,
        currentZoom,
        mapWidth * 2,
        mapHeight * 2
      );
      ctx.beginPath();
      ctx.arc(businessPixel.x, businessPixel.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 단일 검색 선택 위치 마커
      if (mode === 'single' && selectedLocation) {
        const selectedPixel = latLngToPixel(
          selectedLocation.lat,
          selectedLocation.lng,
          currentCenter.lat,
          currentCenter.lng,
          currentZoom,
          mapWidth * 2,
          mapHeight * 2
        );
        ctx.beginPath();
        ctx.arc(selectedPixel.x, selectedPixel.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#4285F4';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Canvas를 이미지로 다운로드
      const link = document.createElement('a');
      link.download = `teleport-map-${keyword}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(img.src);
    } catch (error) {
      console.error('지도 캡처 오류:', error);
      alert('지도 캡처 중 오류가 발생했습니다');
    }
  };

  const handleSingleCheck = async () => {
    if (!keyword || !selectedLocation) return;

    setLoading(true);
    setSingleResult(null);

    // store 함수 사용 (백그라운드 작업 지원)
    const { fetchTeleportSingle } = useAuditStore.getState();
    const result = await fetchTeleportSingle(keyword, selectedLocation.lat, selectedLocation.lng, targetPlaceId);

    if (result) {
      setSingleResult(result);
    }
    setLoading(false);
  };

  const handleGridSearch = async () => {
    if (!keyword) return;

    setLoading(true);
    setGridResults([]);

    // store 함수 사용 (백그라운드 작업 지원)
    const { fetchTeleportGrid } = useAuditStore.getState();
    const results = await fetchTeleportGrid(
      keyword,
      businessLocation.lat,
      businessLocation.lng,
      targetPlaceId,
      gridSize,
      gridRadius
    );

    setGridResults(results);
    setLoading(false);
  };

  const getRankColor = (rank: number | null) => {
    if (rank === null) return '#9CA3AF';
    if (rank <= 3) return '#22C55E';
    if (rank <= 5) return '#84CC16';
    if (rank <= 10) return '#EAB308';
    if (rank <= 15) return '#F97316';
    return '#EF4444';
  };

  const gridMarkers = gridResults.map((r) => ({
    lat: r.lat,
    lng: r.lng,
    label: r.rank?.toString() || '-',
    color: getRankColor(r.rank),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teleport - 순위 체크</CardTitle>
          <CardDescription>
            &quot;{businessName}&quot;의 특정 위치에서의 검색 순위를 확인합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="검색 키워드 (예: 강남 성형외과)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button
              variant={mode === 'single' ? 'default' : 'outline'}
              onClick={() => setMode('single')}
            >
              단일 검색
            </Button>
            <Button
              variant={mode === 'grid' ? 'default' : 'outline'}
              onClick={() => setMode('grid')}
            >
              그리드 검색
            </Button>
          </div>

          {mode === 'single' ? (
            <>
              <p className="text-sm text-gray-500">
                지도에서 순위를 확인할 위치를 클릭하세요
              </p>
              <div ref={mapContainerRef} className="relative">
                <MapPicker
                  center={businessLocation}
                  onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                  size="large"
                  onMapStateChange={setMapState}
                />
                {singleResult && (
                  <Button
                    onClick={handleCaptureMap}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
                  >
                    📸 지도 캡처
                  </Button>
                )}
              </div>
              {selectedLocation && (
                <p className="text-sm text-gray-500">
                  선택 좌표: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              )}
              <Button
                onClick={handleSingleCheck}
                disabled={loading || !keyword || !selectedLocation}
                className="w-full"
              >
                {loading ? '검색 중...' : '순위 확인'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-gray-500">
                  비즈니스 위치 중심 {gridSize}x{gridSize} 그리드로 순위를 검색합니다
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">그리드:</label>
                    <Select value={gridSize.toString()} onValueChange={(val) => setGridSize(parseInt(val))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 x 3</SelectItem>
                        <SelectItem value="5">5 x 5</SelectItem>
                        <SelectItem value="7">7 x 7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">범위:</label>
                    <Select value={gridRadius.toString()} onValueChange={(val) => setGridRadius(parseFloat(val))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.01">0.01 mi (16m)</SelectItem>
                        <SelectItem value="0.05">0.05 mi (80m)</SelectItem>
                        <SelectItem value="0.1">0.1 mi (160m)</SelectItem>
                        <SelectItem value="0.25">0.25 mi (400m)</SelectItem>
                        <SelectItem value="0.5">0.5 mi (800m)</SelectItem>
                        <SelectItem value="1">1 mi (1.6km)</SelectItem>
                        <SelectItem value="2">2 mi (3.2km)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div ref={mapContainerRef} className="relative">
                <MapPicker
                  center={businessLocation}
                  onLocationSelect={() => {}}
                  markers={gridMarkers}
                  clickable={false}
                  size="large"
                  showGrid={true}
                  gridRadiusMiles={gridRadius}
                  gridSize={gridSize}
                  onMapStateChange={setMapState}
                />
                {gridResults.length > 0 && (
                  <Button
                    onClick={handleCaptureMap}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
                  >
                    📸 지도 캡처
                  </Button>
                )}
              </div>
              <Button
                onClick={handleGridSearch}
                disabled={loading || !keyword}
                className="w-full"
              >
                {loading ? '그리드 검색 중...' : '그리드 검색 시작'}
              </Button>
              {gridResults.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">평균 순위</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {calculateAverageRank(gridResults)}위
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">최고 순위</p>
                      <p className="text-2xl font-bold text-green-600">
                        {getBestRank(gridResults)}위
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">최저 순위</p>
                      <p className="text-2xl font-bold text-red-600">
                        {getWorstRank(gridResults)}위
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 단일 검색 결과 */}
      {mode === 'single' && singleResult && (
        <Card>
          <CardHeader>
            <CardTitle>검색 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold" style={{ color: getRankColor(singleResult.rank) }}>
                {singleResult.rank ? `${singleResult.rank}위` : '순위권 외'}
              </p>
              <p className="text-sm text-gray-500">
                키워드: {keyword}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">상위 경쟁사</h4>
              <div className="space-y-2">
                {singleResult.competitors.map((c) => (
                  <div
                    key={c.placeId}
                    className={`flex justify-between items-center p-2 rounded ${
                      c.placeId === targetPlaceId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{c.rank}위</span>
                      <span className="ml-2">{c.name}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {c.rating > 0 && `★ ${c.rating.toFixed(1)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
