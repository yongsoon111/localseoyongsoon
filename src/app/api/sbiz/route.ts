import { NextRequest, NextResponse } from 'next/server';

// 소상공인 상권정보 API
// 공공데이터포털: https://www.data.go.kr/data/15012005/openapi.do

const SBIZ_API_KEY = process.env.SBIZ_API_KEY || '';

interface StoreInfo {
  bizesId: string;       // 상가업소번호
  bizesNm: string;       // 상호명
  brchNm: string;        // 지점명
  indsLclsCd: string;    // 상권업종대분류코드
  indsLclsNm: string;    // 상권업종대분류명
  indsMclsCd: string;    // 상권업종중분류코드
  indsMclsNm: string;    // 상권업종중분류명
  indsSclsCd: string;    // 상권업종소분류코드
  indsSclsNm: string;    // 상권업종소분류명
  ksicCd: string;        // 표준산업분류코드
  ksicNm: string;        // 표준산업분류명
  ctprvnCd: string;      // 시도코드
  ctprvnNm: string;      // 시도명
  signguCd: string;      // 시군구코드
  signguNm: string;      // 시군구명
  adongCd: string;       // 행정동코드
  adongNm: string;       // 행정동명
  ldongCd: string;       // 법정동코드
  ldongNm: string;       // 법정동명
  lnoCd: string;         // 지번코드
  plotSctCd: string;     // 대지구분코드
  plotSctNm: string;     // 대지구분명
  lnoMnno: string;       // 지번본번지
  lnoSlno: string;       // 지번부번지
  lnoAdr: string;        // 지번주소
  rdnmCd: string;        // 도로명코드
  rdnm: string;          // 도로명
  bldMnno: string;       // 건물본번지
  bldSlno: string;       // 건물부번지
  bldMngNo: string;      // 건물관리번호
  bldNm: string;         // 건물명
  rdnmAdr: string;       // 도로명주소
  oldZipcd: string;      // 구우편번호
  newZipcd: string;      // 신우편번호
  dongNo: string;        // 동정보
  flrNo: string;         // 층정보
  hoNo: string;          // 호정보
  lon: string;           // 경도
  lat: string;           // 위도
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '500'; // 기본 500m

  if (!lat || !lng) {
    return NextResponse.json({
      success: false,
      error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.',
    });
  }

  if (!SBIZ_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'SBIZ_API_KEY 환경변수가 설정되지 않았습니다.',
      hint: '공공데이터포털에서 API 키를 발급받아 .env.local에 SBIZ_API_KEY를 설정하세요.',
    });
  }

  try {
    // 반경 내 상가업소 조회 API
    const apiUrl = new URL('https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius');
    apiUrl.searchParams.set('serviceKey', SBIZ_API_KEY);
    apiUrl.searchParams.set('cx', lng); // 경도
    apiUrl.searchParams.set('cy', lat); // 위도
    apiUrl.searchParams.set('radius', radius);
    apiUrl.searchParams.set('type', 'json');
    apiUrl.searchParams.set('numOfRows', '100');
    apiUrl.searchParams.set('pageNo', '1');

    console.log('[Sbiz] Fetching:', apiUrl.toString().replace(SBIZ_API_KEY, '***'));

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    console.log('[Sbiz] Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    // 응답 구조 확인
    const header = data.header || data.response?.header;
    const body = data.body || data.response?.body;

    if (header?.resultCode !== '00' && header?.resultCode !== '0') {
      throw new Error(header?.resultMsg || 'API 오류');
    }

    const items = body?.items || [];
    const totalCount = body?.totalCount || items.length;

    // 업종별 통계
    const categoryStats: Record<string, number> = {};
    items.forEach((item: StoreInfo) => {
      const category = item.indsLclsNm || '기타';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // 상가 목록 포맷팅
    const stores = items.map((item: StoreInfo) => ({
      id: item.bizesId,
      name: item.bizesNm,
      branch: item.brchNm,
      category: {
        large: item.indsLclsNm,
        medium: item.indsMclsNm,
        small: item.indsSclsNm,
      },
      address: item.rdnmAdr || item.lnoAdr,
      building: item.bldNm,
      floor: item.flrNo,
      location: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
    }));

    console.log('[Sbiz] Success:', stores.length, 'stores found');

    return NextResponse.json({
      success: true,
      count: stores.length,
      totalCount,
      radius: parseInt(radius),
      categoryStats,
      stores,
    });

  } catch (error) {
    console.error('[Sbiz] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
