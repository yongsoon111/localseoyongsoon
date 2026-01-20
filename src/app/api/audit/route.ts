// src/app/api/audit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleBusinessInfo, BusinessInfoResult } from '@/lib/dataforseo';
import { calculateBasicScore } from '@/lib/scoring';
import { BusinessInfo } from '@/types';
import {
  hasEnglishName,
  hasMultiLanguageName,
  detectLanguagesInName,
  analyzeWebsiteType,
} from '@/lib/language-analysis';

// DataForSEO 결과를 BusinessInfo 타입으로 변환
function transformToBusinessInfo(result: BusinessInfoResult): BusinessInfo {
  // 영업시간 포맷팅
  const openingHours: string[] = [];

  console.log('[영업시간 디버그] work_hours 필드 확인:', {
    'work_hours 존재': !!result.work_hours,
    'work_hours 타입': typeof result.work_hours,
    'work_hours 값': result.work_hours
  });

  // work_hours가 있는 경우
  if (result.work_hours?.work_hours) {
    result.work_hours.work_hours.forEach((day) => {
      if (day.time && day.time.length > 0) {
        const timeStr = day.time
          .map((t) => `${String(t.open.hour).padStart(2, '0')}:${String(t.open.minute).padStart(2, '0')}-${String(t.close.hour).padStart(2, '0')}:${String(t.close.minute).padStart(2, '0')}`)
          .join(', ');
        openingHours.push(`${day.day}: ${timeStr}`);
      }
    });
  }

  // 대안 1: work_time.work_hours.timetable 구조 (DataForSEO 실제 구조)
  const resultAny = result as any;
  if (openingHours.length === 0 && resultAny.work_time?.work_hours?.timetable) {
    console.log('[영업시간 디버그] work_time.work_hours.timetable 발견');
    const timetable = resultAny.work_time.work_hours.timetable;
    const dayNames: { [key: string]: string } = {
      sunday: '일요일',
      monday: '월요일',
      tuesday: '화요일',
      wednesday: '수요일',
      thursday: '목요일',
      friday: '금요일',
      saturday: '토요일',
    };

    Object.entries(timetable).forEach(([day, times]: [string, any]) => {
      if (Array.isArray(times) && times.length > 0) {
        const timeStr = times
          .map((t: any) => {
            const openTime = `${String(t.open?.hour || 0).padStart(2, '0')}:${String(t.open?.minute || 0).padStart(2, '0')}`;
            const closeTime = `${String(t.close?.hour || 0).padStart(2, '0')}:${String(t.close?.minute || 0).padStart(2, '0')}`;
            return `${openTime}-${closeTime}`;
          })
          .join(', ');
        openingHours.push(`${dayNames[day] || day}: ${timeStr}`);
      }
    });
  }

  console.log('[영업시간 디버그] 최종 파싱된 영업시간:', openingHours);

  // attributes 변환 (DataForSEO의 available_attributes 구조 처리)
  const attributes: { key: string; value: boolean | string }[] = [];
  if (result.attributes) {
    // available_attributes 처리 (실제 설정된 속성들)
    const availableAttrs = (result.attributes as any).available_attributes;
    if (availableAttrs && typeof availableAttrs === 'object') {
      Object.entries(availableAttrs).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: string) => {
            // 속성명 정규화 (예: serves_dine_in -> dine_in)
            const normalizedKey = item.replace(/^(serves_|has_|pay_|is_|accepts_|welcomes_|suitable_for_)/, '');
            attributes.push({ key: normalizedKey, value: true });
          });
        }
      });
    }

    // 기존 평면 구조도 처리 (하위 호환성)
    Object.entries(result.attributes).forEach(([key, values]) => {
      if (key !== 'available_attributes' && key !== 'unavailable_attributes' && values) {
        if (Array.isArray(values)) {
          values.forEach((value) => {
            attributes.push({ key, value: String(value) });
          });
        } else if (typeof values !== 'object') {
          attributes.push({ key, value: String(values) });
        }
      }
    });
  }

  console.log('[속성 디버그] 변환된 속성:', attributes.slice(0, 10));

  // 추가 필드 추출
  const description = result.description || resultAny.snippet || '';
  const mainImage = result.main_image || resultAny.main_image || '';
  const logo = result.logo || resultAny.logo || '';
  const websiteUrl = result.url || '';
  const websiteType = analyzeWebsiteType(websiteUrl);
  const businessName = result.title || '';

  // local_business_links 분석
  const localBusinessLinks = result.local_business_links || resultAny.local_business_links || [];
  const hasMenuLink = localBusinessLinks.some((link: { title?: string; type?: string }) =>
    link.title?.toLowerCase().includes('menu') ||
    link.type?.toLowerCase().includes('menu')
  );
  const hasReservationLink = localBusinessLinks.some((link: { title?: string; type?: string }) =>
    link.title?.toLowerCase().includes('reserv') ||
    link.title?.toLowerCase().includes('book') ||
    link.type?.toLowerCase().includes('reserv')
  );
  const hasOrderLink = localBusinessLinks.some((link: { title?: string; type?: string }) =>
    link.title?.toLowerCase().includes('order') ||
    link.title?.toLowerCase().includes('delivery') ||
    link.type?.toLowerCase().includes('order')
  );

  // place_topics 추출 (객체 형식: { keyword: count, ... })
  const placeTopicsRaw = result.place_topics || resultAny.place_topics;
  let placeTopics: { title: string; count: number }[] = [];
  if (placeTopicsRaw && typeof placeTopicsRaw === 'object' && !Array.isArray(placeTopicsRaw)) {
    // 객체 형식인 경우 배열로 변환
    placeTopics = Object.entries(placeTopicsRaw as Record<string, number>)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count); // 빈도순 정렬
  } else if (Array.isArray(placeTopicsRaw)) {
    placeTopics = placeTopicsRaw;
  }

  console.log('[진단 디버그] 추가 데이터:', {
    additionalCategories: result.additional_categories,
    localBusinessLinks: localBusinessLinks.length,
    placeTopicsCount: placeTopics.length,
    placeTopicsTop3: placeTopics.slice(0, 3).map(t => `${t.title}(${t.count})`),
    mainImage: !!mainImage,
    websiteType,
    websiteUrl: websiteUrl.slice(0, 50),
    isClaimed: result.is_claimed,
    detectedLanguages: detectLanguagesInName(businessName),
    hasMultiLanguage: hasMultiLanguageName(businessName),
  });

  return {
    placeId: result.place_id,
    name: businessName,
    originalTitle: result.original_title || businessName,
    category: result.category || 'unknown',
    additionalCategories: result.additional_categories || [],
    address: result.address || '',
    phone: result.phone || '',
    website: websiteUrl,
    websiteType,
    rating: result.rating?.value || 0,
    // DataForSEO는 votes_count를 사용
    reviewCount: (result.rating as { votes_count?: number })?.votes_count || result.rating?.rating_count || 0,
    ratingDistribution: result.rating_distribution || resultAny.rating_distribution,
    openingHours,
    photos: result.total_photos || 0,
    attributes,
    location: result.latitude && result.longitude
      ? { lat: result.latitude, lng: result.longitude }
      : undefined,
    // 추가 진단 항목
    description,
    hasEnglishName: hasEnglishName(businessName),
    hasMultiLanguageName: hasMultiLanguageName(businessName),
    detectedLanguages: detectLanguagesInName(businessName),
    mainImage,
    logo,
    // 링크 및 서비스
    localBusinessLinks: localBusinessLinks.map((link: { title?: string; url?: string; type?: string }) => ({
      title: link.title || '',
      url: link.url || '',
      type: link.type,
    })),
    hasMenuLink,
    hasReservationLink,
    hasOrderLink,
    // 리뷰 키워드
    placeTopics,
    // 상태
    isClaimed: result.is_claimed,
  };
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId');
  const keyword = req.nextUrl.searchParams.get('keyword');

  if (!placeId && !keyword) {
    return NextResponse.json({ error: 'placeId 또는 keyword 파라미터가 필요합니다' }, { status: 400 });
  }

  try {
    // DataForSEO로 비즈니스 정보 조회
    const searchKeyword = keyword || placeId || '';
    console.log('[Audit] Fetching business info for:', searchKeyword);

    const result = await fetchGoogleBusinessInfo({
      keyword: searchKeyword,
    });

    if (!result) {
      return NextResponse.json({ error: '비즈니스 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    // 전체 result 구조 로깅 (work_hours 확인용)
    console.log('[영업시간 디버그] DataForSEO 응답 필드 목록:', Object.keys(result));
    console.log('[영업시간 디버그] work_hours 원본 데이터:', JSON.stringify(result.work_hours, null, 2));

    const business = transformToBusinessInfo(result);
    const score = calculateBasicScore(business);

    return NextResponse.json({ business, score });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
