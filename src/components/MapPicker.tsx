'use client';

import { useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/maps-loader';

interface MapPickerProps {
  center: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
  markers?: Array<{ lat: number; lng: number; label?: string; color?: string }>;
  clickable?: boolean; // 지도 클릭 활성화 여부
  size?: 'default' | 'large'; // 지도 크기
  gridRadiusMiles?: number; // 그리드 범위 (마일)
  showGrid?: boolean; // 그리드 표시 여부
  gridSize?: number; // 그리드 크기 (3, 5, 7)
  onMapStateChange?: (state: { zoom: number; center: { lat: number; lng: number }; bounds: { north: number; south: number; east: number; west: number } | null }) => void;
}

export function MapPicker({ center, onLocationSelect, markers, clickable = true, size = 'default', gridRadiusMiles, showGrid = false, gridSize = 3, onMapStateChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const onMapStateChangeRef = useRef(onMapStateChange);
  const clickMarkerRef = useRef<google.maps.Marker | null>(null);
  const gridMarkersRef = useRef<google.maps.Marker[]>([]);
  const businessMarkerRef = useRef<google.maps.Marker | null>(null);
  const gridOverlayRef = useRef<google.maps.Rectangle | null>(null);
  const gridLinesRef = useRef<google.maps.Polyline[]>([]);
  const onLocationSelectRef = useRef(onLocationSelect);
  const centerRef = useRef(center);

  // 최신 값을 ref에 저장
  onLocationSelectRef.current = onLocationSelect;
  onMapStateChangeRef.current = onMapStateChange;
  centerRef.current = center;

  // 지도 상태 변경 알림
  const notifyMapStateChange = useCallback(() => {
    if (!mapInstanceRef.current || !onMapStateChangeRef.current) return;
    const map = mapInstanceRef.current;
    const center = map.getCenter();
    const bounds = map.getBounds();
    onMapStateChangeRef.current({
      zoom: map.getZoom() || 15,
      center: center ? { lat: center.lat(), lng: center.lng() } : centerRef.current,
      bounds: bounds ? {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng(),
      } : null,
    });
  }, []);

  const initMap = useCallback(async () => {
    try {
      await loadGoogleMaps();

      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: centerRef.current,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      // 업장 위치 마커 (빨간색)
      businessMarkerRef.current = new google.maps.Marker({
        position: centerRef.current,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        title: '업장 위치',
        zIndex: 1000,
      });

      // clickable이 true일 때만 클릭 리스너 추가
      if (clickable) {
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onLocationSelectRef.current(lat, lng);

            // 기존 클릭 마커가 있으면 제거
            if (clickMarkerRef.current) {
              clickMarkerRef.current.setMap(null);
            }

            // 새 마커 생성
            clickMarkerRef.current = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
              title: '선택한 위치',
            });
          }
        });
      }

      mapInstanceRef.current = mapInstance;

      // 지도 상태 변경 이벤트 리스너 추가
      mapInstance.addListener('idle', () => {
        notifyMapStateChange();
      });
      mapInstance.addListener('zoom_changed', () => {
        notifyMapStateChange();
      });

      // 초기 상태 알림 (지도가 완전히 로드된 후)
      google.maps.event.addListenerOnce(mapInstance, 'tilesloaded', () => {
        notifyMapStateChange();
      });
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
    }
  }, [notifyMapStateChange]);

  useEffect(() => {
    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 중심 좌표 변경 시 지도 이동
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // 그리드 범위 오버레이 표시
  useEffect(() => {
    if (!mapInstanceRef.current || !showGrid || !gridRadiusMiles) return;

    // 기존 오버레이 제거
    if (gridOverlayRef.current) {
      gridOverlayRef.current.setMap(null);
    }
    gridLinesRef.current.forEach((line) => line.setMap(null));
    gridLinesRef.current = [];

    // 마일을 위도/경도로 변환 (1마일 ≈ 0.0145도)
    const latOffset = gridRadiusMiles * 0.0145;
    const lngOffset = gridRadiusMiles * 0.0145 / Math.cos(center.lat * Math.PI / 180);

    const bounds = {
      north: center.lat + latOffset,
      south: center.lat - latOffset,
      east: center.lng + lngOffset,
      west: center.lng - lngOffset,
    };

    // 사각형 오버레이 (전체 범위)
    gridOverlayRef.current = new google.maps.Rectangle({
      bounds,
      map: mapInstanceRef.current,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
    });

    // 그리드 라인 (gridSize에 따라 동적으로 생성)
    const halfGrid = Math.floor(gridSize / 2);
    const stepLat = (latOffset * 2) / gridSize;
    const stepLng = (lngOffset * 2) / gridSize;

    // 가로선 (gridSize - 1 개)
    for (let i = 1; i < gridSize; i++) {
      const lat = bounds.south + (i * stepLat);
      const line = new google.maps.Polyline({
        path: [
          { lat, lng: bounds.west },
          { lat, lng: bounds.east },
        ],
        map: mapInstanceRef.current,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.4,
        strokeWeight: 1,
      });
      gridLinesRef.current.push(line);
    }

    // 세로선 (gridSize - 1 개)
    for (let i = 1; i < gridSize; i++) {
      const lng = bounds.west + (i * stepLng);
      const line = new google.maps.Polyline({
        path: [
          { lat: bounds.north, lng },
          { lat: bounds.south, lng },
        ],
        map: mapInstanceRef.current,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.4,
        strokeWeight: 1,
      });
      gridLinesRef.current.push(line);
    }

    // 지도 범위 조정
    mapInstanceRef.current.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });

    return () => {
      if (gridOverlayRef.current) {
        gridOverlayRef.current.setMap(null);
      }
      gridLinesRef.current.forEach((line) => line.setMap(null));
    };
  }, [showGrid, gridRadiusMiles, center, gridSize]);

  // 로컬팔콘 스타일 핀 마커 생성
  const createPinIcon = (label: string, color: string) => {
    const svg = `
      <svg width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M24 0C14.6 0 7 7.6 7 17c0 12 17 33 17 33s17-21 17-33c0-9.4-7.6-17-17-17z"
                fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="24" cy="17" r="13" fill="white" opacity="0.95"/>
          <text x="24" y="23" text-anchor="middle" font-size="16" font-weight="bold"
                font-family="Arial, sans-serif" fill="${color}">${label}</text>
        </g>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(48, 60),
      anchor: new google.maps.Point(24, 60),
    };
  };

  // 그리드 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !markers || markers.length === 0) return;

    console.log('[MapPicker] 마커 업데이트:', markers.length, '개');

    // 기존 마커 제거
    gridMarkersRef.current.forEach((m) => m.setMap(null));
    gridMarkersRef.current = [];

    // 새 마커 생성
    markers.forEach((m, idx) => {
      console.log(`[MapPicker] 마커 ${idx}:`, m.lat, m.lng, m.label, m.color);
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapInstanceRef.current,
        icon: m.label && m.color ? createPinIcon(m.label, m.color) : undefined,
        zIndex: m.label === '-' ? 50 : 100,
      });
      gridMarkersRef.current.push(marker);
    });

    // 마커가 있으면 지도 범위 자동 조정
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      // 업장 위치도 포함
      bounds.extend(centerRef.current);
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }

    return () => {
      gridMarkersRef.current.forEach((m) => m.setMap(null));
    };
  }, [markers]);

  const heightClass = size === 'large' ? 'h-[600px]' : 'h-[400px]';

  return (
    <div
      ref={mapRef}
      className={`w-full ${heightClass} rounded-lg border border-border`}
      style={{ cursor: clickable ? 'crosshair' : 'default' }}
    />
  );
}
