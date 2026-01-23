import { NextRequest, NextResponse } from 'next/server';

// 네이버부동산 상가 월세 매물 조회 API (리버스 엔지니어링)
//
// 매물종류 (rletTpCd):
// APT=아파트, OPST=오피스텔, VL=빌라, JT=주택, DDDGG=단독/다가구
// OR=원룸, SG=상가, SMS=사무실, GJCG=공장/창고, TJ=토지, SGJT=상가주택
//
// 거래종류 (tradTpCd):
// A1=매매, B1=전세, B2=월세, B3=단기임대
//
// 여러 종류 선택시 콜론(:)으로 구분: APT:OPST, A1:B2

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 파라미터 추출
  const lat = searchParams.get('lat') || '37.5665';  // 기본값: 서울시청
  const lng = searchParams.get('lng') || '126.9780';
  const radius = parseFloat(searchParams.get('radius') || '0.005');  // 반경 (좌표 단위, 약 500m)
  const page = searchParams.get('page') || '1';
  const zoom = searchParams.get('z') || '16';

  // 매물 종류: SG=상가, SMS=사무실 (기본: 상가)
  const rletTpCd = searchParams.get('rletTpCd') || 'SG';
  // 거래 종류: A1=매매, B1=전세, B2=월세 (기본: 월세)
  const tradTpCd = searchParams.get('tradTpCd') || 'B2';

  // 좌표 범위 계산
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const btm = latNum - radius;
  const top = latNum + radius;
  const lft = lngNum - radius;
  const rgt = lngNum + radius;

  try {
    // 네이버부동산 내부 API 호출
    const apiUrl = new URL('https://m.land.naver.com/cluster/ajax/articleList');

    apiUrl.searchParams.set('rletTpCd', rletTpCd);
    apiUrl.searchParams.set('tradTpCd', tradTpCd);
    apiUrl.searchParams.set('z', zoom);
    apiUrl.searchParams.set('lat', lat);
    apiUrl.searchParams.set('lon', lng);
    apiUrl.searchParams.set('btm', btm.toString());
    apiUrl.searchParams.set('lft', lft.toString());
    apiUrl.searchParams.set('top', top.toString());
    apiUrl.searchParams.set('rgt', rgt.toString());
    apiUrl.searchParams.set('page', page);
    apiUrl.searchParams.set('showR0', 'N');
    apiUrl.searchParams.set('cortarNo', '');  // 지역코드 (비워두면 좌표 기준)
    apiUrl.searchParams.set('spcMin', '');    // 최소면적
    apiUrl.searchParams.set('spcMax', '');    // 최대면적
    apiUrl.searchParams.set('dprcMin', '');   // 최소보증금
    apiUrl.searchParams.set('dprcMax', '');   // 최대보증금
    apiUrl.searchParams.set('wprcMin', '');   // 최소월세
    apiUrl.searchParams.set('wprcMax', '');   // 최대월세

    console.log('[NaverLand] Fetching:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://m.land.naver.com/',
        'Origin': 'https://m.land.naver.com',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
    });

    if (!response.ok) {
      console.error('[NaverLand] Response not ok:', response.status);
      return NextResponse.json({
        error: '네이버부동산 API 호출 실패',
        status: response.status
      }, { status: 500 });
    }

    // 응답이 HTML인지 확인 (차단된 경우)
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    if (contentType.includes('text/html') || responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.error('[NaverLand] Blocked - received HTML instead of JSON');
      return NextResponse.json({
        error: '네이버부동산 접근이 차단되었습니다. 잠시 후 다시 시도해주세요.',
        blocked: true,
      }, { status: 403 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[NaverLand] JSON parse error:', responseText.slice(0, 200));
      return NextResponse.json({
        error: '응답 파싱 실패',
        rawResponse: responseText.slice(0, 200),
      }, { status: 500 });
    }
    console.log('[NaverLand] Response code:', data?.code, 'count:', data?.body?.length);

    if (data?.code !== 'success') {
      return NextResponse.json({
        error: '네이버부동산 응답 오류',
        code: data?.code,
      }, { status: 500 });
    }

    // 매물 목록 정리
    const articles = data?.body || [];

    const formattedArticles = articles.map((item: any) => ({
      id: item.atclNo,
      name: item.atclNm || item.bildNm || '상가',
      type: item.rletTpNm || '상가',
      tradeType: item.tradTpNm || '월세',
      floor: item.flrInfo || '-',
      deposit: item.prc || 0,              // 보증금 (만원)
      depositDisplay: item.hanPrc || '',   // 보증금 표시 ("1억", "6,000")
      monthlyRent: item.rentPrc || 0,      // 월세 (만원)
      supplyArea: parseFloat(item.spc1) || 0,       // 공급면적 (㎡)
      exclusiveArea: parseFloat(item.spc2) || 0,    // 전용면적 (㎡)
      direction: item.direction || '-',
      description: item.atclFetrDesc || '',
      buildingName: item.bildNm || '',
      agentName: item.rltrNm || '',
      agentCompany: item.cpNm || '',
      lat: item.lat,
      lng: item.lng,
      confirmedDate: item.atclCfmYmd || '',
      tags: item.tagList || [],
      imageUrl: item.repImgUrl ? `https://landthumb-phinf.pstatic.net${item.repImgUrl}` : null,
    }));

    // 통계 계산
    const stats = {
      avgDeposit: articles.length > 0
        ? Math.round(articles.reduce((sum: number, item: any) => sum + (item.prc || 0), 0) / articles.length)
        : 0,
      avgMonthlyRent: articles.length > 0
        ? Math.round(articles.reduce((sum: number, item: any) => sum + (item.rentPrc || 0), 0) / articles.length)
        : 0,
      avgArea: articles.length > 0
        ? Math.round(articles.reduce((sum: number, item: any) => sum + (parseFloat(item.spc2) || 0), 0) / articles.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      count: formattedArticles.length,
      hasMore: data?.more || false,
      stats,
      articles: formattedArticles,
      searchArea: {
        center: { lat: latNum, lng: lngNum },
        bounds: { btm, top, lft, rgt },
      },
    });

  } catch (error) {
    console.error('[NaverLand] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 });
  }
}
