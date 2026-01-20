// src/app/api/competitors/route.ts

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: { photo_reference: string }[];
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  business_status?: string;
}

interface CompetitorData {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  photos: number;
  distance: string;
  features: string[];
  isMe?: boolean;
  placeId: string;
}

// 두 좌표 간 거리 계산 (미터)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 거리를 읽기 쉬운 형식으로 변환
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const category = req.nextUrl.searchParams.get('category');
  const myPlaceId = req.nextUrl.searchParams.get('myPlaceId');
  const myName = req.nextUrl.searchParams.get('myName');
  const myRating = parseFloat(req.nextUrl.searchParams.get('myRating') || '0');
  const myReviews = parseInt(req.nextUrl.searchParams.get('myReviews') || '0');
  const myPhotos = parseInt(req.nextUrl.searchParams.get('myPhotos') || '0');
  const radius = parseInt(req.nextUrl.searchParams.get('radius') || '500');

  if (!lat || !lng) {
    return NextResponse.json({ error: '위치 정보(lat, lng)가 필요합니다' }, { status: 400 });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    // Google Places Text Search API 호출 - 동일 카테고리 업체만 검색
    // 카테고리를 키워드로 사용하여 같은 업종만 검색
    const searchKeyword = category || 'restaurant';

    // Text Search API 사용 (keyword 기반 검색으로 더 정확한 결과)
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchKeyword)}&location=${centerLat},${centerLng}&radius=${radius}&language=ko&key=${GOOGLE_MAPS_API_KEY}`;

    console.log('[Competitors API] Fetching nearby places:', { lat: centerLat, lng: centerLng, keyword: searchKeyword, radius });

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Competitors API] Google API error:', data.status, data.error_message);
      return NextResponse.json({ error: `Google API 오류: ${data.status}` }, { status: 500 });
    }

    const places: PlaceResult[] = data.results || [];

    console.log('[Competitors API] Found', places.length, 'places');

    // 경쟁사 데이터 변환
    const competitors: CompetitorData[] = places
      .filter(place => place.business_status === 'OPERATIONAL' || !place.business_status)
      .map((place, index) => {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // 특징 추출 (types에서)
        const features: string[] = [];
        if (place.types) {
          if (place.types.includes('meal_delivery')) features.push('배달');
          if (place.types.includes('meal_takeaway')) features.push('포장');
          if (place.types.includes('bar')) features.push('바');
          if (place.types.includes('cafe')) features.push('카페');
        }

        const isMe = place.place_id === myPlaceId;

        return {
          id: `c${index + 1}`,
          name: isMe ? `${place.name} (나)` : place.name,
          rating: place.rating || 0,
          reviews: place.user_ratings_total || 0,
          photos: place.photos?.length || 0,
          distance: isMe ? '-' : formatDistance(distance),
          features: features.length > 0 ? features : ['정보없음'],
          isMe,
          placeId: place.place_id,
        };
      });

    // 내 비즈니스가 검색 결과에 없으면 추가
    if (myPlaceId && myName && !competitors.find(c => c.placeId === myPlaceId)) {
      competitors.push({
        id: 'me',
        name: `${myName} (나)`,
        rating: myRating,
        reviews: myReviews,
        photos: myPhotos,
        distance: '-',
        features: ['정보없음'],
        isMe: true,
        placeId: myPlaceId,
      });
    }

    // 리뷰 수 기준 정렬
    competitors.sort((a, b) => b.reviews - a.reviews);

    // 통계 계산
    const summary = {
      total: competitors.length,
      avgRating: competitors.length > 0
        ? parseFloat((competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length).toFixed(1))
        : 0,
      avgReviews: competitors.length > 0
        ? Math.round(competitors.reduce((sum, c) => sum + c.reviews, 0) / competitors.length)
        : 0,
      avgPhotos: competitors.length > 0
        ? Math.round(competitors.reduce((sum, c) => sum + c.photos, 0) / competitors.length)
        : 0,
    };

    // 내 순위 계산
    const myBusiness = competitors.find(c => c.isMe);
    const myRanks = myBusiness ? {
      rating: `${competitors.filter(c => c.rating > myBusiness.rating).length + 1}위`,
      reviews: `${competitors.filter(c => c.reviews > myBusiness.reviews).length + 1}위`,
      photos: `${competitors.filter(c => c.photos > myBusiness.photos).length + 1}위`,
      overall: `${Math.round((
        (competitors.filter(c => c.rating > myBusiness.rating).length + 1) +
        (competitors.filter(c => c.reviews > myBusiness.reviews).length + 1) +
        (competitors.filter(c => c.photos > myBusiness.photos).length + 1)
      ) / 3)}위`,
    } : null;

    return NextResponse.json({
      competitors,
      summary,
      myRanks,
      searchRadius: radius,
      searchKeyword,
    });
  } catch (error) {
    console.error('[Competitors API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '경쟁사 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
