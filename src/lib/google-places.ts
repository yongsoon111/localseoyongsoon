// src/lib/google-places.ts

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface PlaceResult {
  name: string;
  placeId: string;
  rating: number;
  userRatingsTotal: number;
  vicinity?: string;
}

export interface RankingResult {
  lat: number;
  lng: number;
  rank: number | null;
  competitors: {
    rank: number;
    name: string;
    placeId: string;
    rating: number;
  }[];
}

/**
 * Google Places API Nearby Search로 특정 위치에서의 순위 체크
 */
export async function checkRankingWithGooglePlaces(
  keyword: string,
  lat: number,
  lng: number,
  targetPlaceId: string
): Promise<RankingResult> {
  try {
    // Google Places API Nearby Search (Text Search)
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', keyword);
    url.searchParams.append('location', `${lat},${lng}`);
    url.searchParams.append('radius', '5000'); // 5km 반경
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Google Places] API Error:', data);
      throw new Error(`Google Places API Error: ${data.status}`);
    }

    const results = data.results || [];

    // 경쟁사 목록 생성 (상위 20개)
    const competitors = results.slice(0, 20).map((place: any, index: number) => ({
      rank: index + 1,
      name: place.name || '',
      placeId: place.place_id || '',
      rating: place.rating || 0,
    }));

    // 타겟 Place ID의 순위 찾기
    const targetIndex = results.findIndex((place: any) => place.place_id === targetPlaceId);

    console.log(`[Google Places] Keyword: "${keyword}", Location: (${lat}, ${lng})`);
    console.log(`[Google Places] Target PlaceID: ${targetPlaceId}`);
    if (results.length > 0) {
      console.log(`[Google Places] Top 3 results:`, results.slice(0, 3).map((p: any) => ({ name: p.name, place_id: p.place_id })));
    }
    console.log(`[Google Places] Found ${results.length} results, Target rank: ${targetIndex >= 0 ? targetIndex + 1 : 'N/A'}`);

    return {
      lat,
      lng,
      rank: targetIndex >= 0 ? targetIndex + 1 : null,
      competitors,
    };
  } catch (error) {
    console.error(`[Google Places] Ranking check error at (${lat}, ${lng}):`, error);
    return {
      lat,
      lng,
      rank: null,
      competitors: [],
    };
  }
}
