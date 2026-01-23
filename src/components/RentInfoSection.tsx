'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BusinessInfo } from '@/types';
import { loadGoogleMaps } from '@/lib/maps-loader';

interface RentArticle {
  id: string;
  name: string;
  type: string;
  tradeType: string;
  floor: string;
  deposit: number;
  depositDisplay: string;
  monthlyRent: number;
  supplyArea: number;
  exclusiveArea: number;
  direction: string;
  description: string;
  buildingName: string;
  agentName: string;
  lat: number;
  lng: number;
  confirmedDate: string;
  tags: string[];
  imageUrl: string | null;
}

interface RentStats {
  avgDeposit: number;
  avgMonthlyRent: number;
  avgArea: number;
}

interface RentInfoSectionProps {
  business: BusinessInfo;
}

export function RentInfoSection({ business }: RentInfoSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const businessMarkerRef = useRef<google.maps.Marker | null>(null);
  const articleMarkersRef = useRef<google.maps.Marker[]>([]);
  const selectedCircleRef = useRef<google.maps.Circle | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<RentArticle[]>([]);
  const [stats, setStats] = useState<RentStats | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // 지도 초기화
  const initMap = useCallback(async () => {
    if (!business.location?.lat || !business.location?.lng) return;

    try {
      await loadGoogleMaps();

      if (!mapRef.current) return;

      const center = { lat: business.location.lat, lng: business.location.lng };

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: 17,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // 업장 위치 마커 (빨간색)
      businessMarkerRef.current = new google.maps.Marker({
        position: center,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        title: business.name,
        zIndex: 1000,
      });

      // 지도 클릭 이벤트
      mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedLocation({ lat, lng });

          // 선택 영역 표시 (반경 50m)
          if (selectedCircleRef.current) {
            selectedCircleRef.current.setMap(null);
          }
          selectedCircleRef.current = new google.maps.Circle({
            center: { lat, lng },
            radius: 50,  // 50m
            map: mapInstance,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
          });
        }
      });

      mapInstanceRef.current = mapInstance;
      setMapReady(true);

    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      setError('지도를 불러오지 못했습니다.');
    }
  }, [business.location, business.name]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // 매물 조회
  const fetchRentInfo = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: '0.0005',  // 약 50m 반경
        z: '18',
      });

      const res = await fetch(`/api/naver-land?${params}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setArticles(data.articles || []);
      setStats(data.stats || null);

      // 매물 마커 표시
      updateArticleMarkers(data.articles || []);

    } catch (err) {
      console.error('[RentInfo] Error:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 매물 마커 업데이트
  const updateArticleMarkers = (articles: RentArticle[]) => {
    if (!mapInstanceRef.current) return;

    // 기존 마커 제거
    articleMarkersRef.current.forEach(m => m.setMap(null));
    articleMarkersRef.current = [];

    // 새 마커 추가
    articles.forEach((article) => {
      if (!article.lat || !article.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: article.lat, lng: article.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: `${article.depositDisplay || formatPrice(article.deposit)} / ${article.monthlyRent}만원`,
        zIndex: 500,
      });

      // 클릭 시 정보 표시
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${article.name}</div>
            <div style="color: #2563EB; font-size: 14px;">
              ${article.depositDisplay || formatPrice(article.deposit)} / ${article.monthlyRent}만원
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              ${article.exclusiveArea}㎡ (${Math.round(article.exclusiveArea * 0.3025)}평) · ${article.floor}
            </div>
            ${article.description ? `<div style="color: #888; font-size: 11px; margin-top: 4px;">${article.description}</div>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      articleMarkersRef.current.push(marker);
    });
  };

  // 만원 단위를 보기 좋게 변환
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const man = price % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억`;
    }
    return `${price.toLocaleString()}만원`;
  };

  // 선택 위치 주변 조회
  useEffect(() => {
    if (selectedLocation) {
      fetchRentInfo(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  // 업장 위치로 조회
  const handleSearchAtBusiness = () => {
    if (business.location?.lat && business.location?.lng) {
      setSelectedLocation({ lat: business.location.lat, lng: business.location.lng });

      // 원 표시
      if (mapInstanceRef.current) {
        if (selectedCircleRef.current) {
          selectedCircleRef.current.setMap(null);
        }
        selectedCircleRef.current = new google.maps.Circle({
          center: { lat: business.location.lat, lng: business.location.lng },
          radius: 50,
          map: mapInstanceRef.current,
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
      }
    }
  };

  if (!business.location?.lat || !business.location?.lng) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>주변 상가 월세 시세</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">매장 위치 정보가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>주변 상가 월세 시세</span>
          <Button
            onClick={handleSearchAtBusiness}
            disabled={loading || !mapReady}
            size="sm"
          >
            {loading ? '조회 중...' : '현재 위치 시세'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 안내 문구 */}
        <p className="text-sm text-muted-foreground">
          지도를 클릭하면 해당 위치 반경 50m 내 상가 월세 매물을 조회합니다.
        </p>

        {/* 지도 */}
        <div
          ref={mapRef}
          className="w-full h-[350px] rounded-lg border border-border"
          style={{ cursor: 'crosshair' }}
        />

        {/* 에러 */}
        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-muted border-t-primary" />
            <span className="ml-2 text-sm text-muted-foreground">매물 조회 중...</span>
          </div>
        )}

        {/* 통계 요약 */}
        {stats && articles.length > 0 && !loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">평균 보증금</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(stats.avgDeposit)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">평균 월세</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatPrice(stats.avgMonthlyRent)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">평균 면적</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.avgArea}㎡
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              반경 50m 내 상가 {articles.length}개 매물 기준
            </p>
          </div>
        )}

        {/* 매물 없음 */}
        {selectedLocation && !loading && articles.length === 0 && !error && (
          <div className="text-center py-4 text-muted-foreground">
            <p>해당 위치 주변에 월세 매물이 없습니다.</p>
            <p className="text-sm mt-1">다른 위치를 클릭해 보세요.</p>
          </div>
        )}

        {/* 매물 목록 */}
        {articles.length > 0 && !loading && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">매물 목록 ({articles.length}개)</h4>
            <div className="max-h-[250px] overflow-y-auto space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{article.name}</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {article.floor}
                        </span>
                      </div>
                      <div className="font-bold">
                        <span className="text-blue-600 dark:text-blue-400">
                          {article.depositDisplay || formatPrice(article.deposit)}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-red-600 dark:text-red-400">
                          {article.monthlyRent}만원
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {article.exclusiveArea}㎡ ({Math.round(article.exclusiveArea * 0.3025)}평)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
