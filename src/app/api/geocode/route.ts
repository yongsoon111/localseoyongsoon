// src/app/api/geocode/route.ts
// 좌표 → 행정동 변환 API (GeoJSON 기반)

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface GeoJSONFeature {
  type: string;
  properties: {
    adm_nm: string;      // "서울특별시 강남구 압구정동"
    adm_cd2: string;     // "1168056000" (10자리 행정동 코드)
    adm_cd: string;      // "11680560" (8자리 코드)
    sgg: string;         // "11680" (자치구 코드)
    sido: string;        // "11" (시도 코드)
    sidonm: string;      // "서울특별시"
    sggnm: string;       // "강남구"
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}

let cachedGeoJSON: GeoJSON | null = null;

// GeoJSON 파일 로드 (캐싱)
async function loadGeoJSON(): Promise<GeoJSON> {
  if (cachedGeoJSON) return cachedGeoJSON;

  // Vercel 환경에서는 파일 시스템 접근이 다를 수 있으므로 여러 방법 시도
  try {
    // 1. 로컬 파일 시스템 시도
    const filePath = path.join(process.cwd(), 'public', 'data', 'seoul_dong.geojson');
    const data = fs.readFileSync(filePath, 'utf8');
    cachedGeoJSON = JSON.parse(data);
    return cachedGeoJSON!;
  } catch {
    // 2. fetch로 public URL에서 가져오기 (Vercel 환경)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/data/seoul_dong.geojson`);
    if (!response.ok) {
      throw new Error(`GeoJSON 파일을 불러올 수 없습니다: ${response.status}`);
    }
    cachedGeoJSON = await response.json();
    return cachedGeoJSON!;
  }
}

// Point in Polygon 알고리즘 (Ray Casting)
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// MultiPolygon 내 점 포함 여부 확인
function isPointInMultiPolygon(point: [number, number], multiPolygon: number[][][][]): boolean {
  for (const polygon of multiPolygon) {
    for (const ring of polygon) {
      if (isPointInPolygon(point, ring)) {
        return true;
      }
    }
  }
  return false;
}

// 좌표로 행정동 찾기
async function findDongByCoordinates(lat: number, lng: number): Promise<GeoJSONFeature | null> {
  const geoJSON = await loadGeoJSON();
  const point: [number, number] = [lng, lat]; // GeoJSON은 [lng, lat] 순서

  for (const feature of geoJSON.features) {
    if (feature.geometry.type === 'MultiPolygon') {
      if (isPointInMultiPolygon(point, feature.geometry.coordinates)) {
        return feature;
      }
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: '위도(lat)와 경도(lng)를 입력해주세요' }, { status: 400 });
    }

    const feature = await findDongByCoordinates(lat, lng);

    if (!feature) {
      return NextResponse.json({
        error: '서울시 외 지역이거나 해당 좌표의 행정동을 찾을 수 없습니다',
        lat,
        lng
      }, { status: 404 });
    }

    const props = feature.properties;

    // 행정동 이름에서 동 이름만 추출 (예: "서울특별시 강남구 압구정동" → "압구정동")
    const dongName = props.adm_nm.split(' ').pop() || '';

    // 서울시 생활인구 API는 adm_cd2의 앞 8자리를 사용
    const seoulApiDongCode = props.adm_cd2.slice(0, 8);

    return NextResponse.json({
      lat,
      lng,
      sido: props.sidonm,           // "서울특별시"
      sigungu: props.sggnm,         // "강남구"
      dong: dongName,               // "압구정동"
      fullAddress: props.adm_nm,    // "서울특별시 강남구 압구정동"
      dongCode: seoulApiDongCode,   // "11680560" (8자리 - 서울시 생활인구 API용)
      dongCode10: props.adm_cd2,    // "1168056000" (10자리)
      admCode: props.adm_cd,        // "11680560" (통계청 8자리 코드)
      sggCode: props.sgg,           // "11680" (자치구 코드)
    });
  } catch (error) {
    console.error('[Geocode API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '좌표 변환 실패' },
      { status: 500 }
    );
  }
}
