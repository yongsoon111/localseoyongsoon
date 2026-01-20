// src/lib/gmaps-scraper.ts
// Google Maps 데이터 수집 (DataForSEO API 사용)

import { fetchGMBUpdates, fetchQA, fetchGoogleBusinessInfo } from './dataforseo';

export interface GMapsScrapedData {
  // 게시물 정보
  posts: {
    count: number;
    lastPostDate: string | null;      // 실제 날짜 (YYYY-MM-DD)
    lastPostDateRaw: string | null;   // 원본 상대 날짜 ("2일 전")
    lastPostText: string | null;
  };
  // Q&A 정보
  qna: {
    totalCount: number;
    answeredCount: number;
    unansweredCount: number;
    recentQuestions: {
      question: string;
      hasAnswer: boolean;
      date?: string;
    }[];
  };
  // 메뉴 정보
  hasMenu: boolean;
  // 스크래핑 시간
  scrapedAt: string;
}

/**
 * 비즈니스 이름으로 GMaps 데이터 수집 (DataForSEO API)
 */
export async function scrapeGoogleMaps(keyword: string): Promise<GMapsScrapedData> {
  console.log('[GMaps Scraper] DataForSEO API로 데이터 수집 시작:', keyword);

  const result: GMapsScrapedData = {
    posts: {
      count: 0,
      lastPostDate: null,
      lastPostDateRaw: null,
      lastPostText: null,
    },
    qna: {
      totalCount: 0,
      answeredCount: 0,
      unansweredCount: 0,
      recentQuestions: [],
    },
    hasMenu: false,
    scrapedAt: new Date().toISOString(),
  };

  // GMB Updates와 Q&A를 병렬로 수집
  const [updatesResult, qaResult] = await Promise.allSettled([
    fetchGMBUpdates({ keyword, depth: 10 }),
    fetchQA({ keyword, depth: 20 }),
  ]);

  // 1. 게시물/소식 처리
  if (updatesResult.status === 'fulfilled' && updatesResult.value) {
    const updates = updatesResult.value;
    result.posts.count = updates.items_count || updates.items?.length || 0;

    if (updates.items && updates.items.length > 0) {
      const latestPost = updates.items[0];

      // post_date 형식: "mm/dd/yyyy hh:mm:ss" 또는 timestamp (UTC)
      if (latestPost.timestamp) {
        const date = new Date(latestPost.timestamp);
        result.posts.lastPostDate = date.toISOString().split('T')[0];
        result.posts.lastPostDateRaw = getRelativeDate(date);
      } else if (latestPost.post_date) {
        result.posts.lastPostDateRaw = latestPost.post_date;
        // mm/dd/yyyy 형식 파싱
        const parts = latestPost.post_date.split(' ')[0].split('/');
        if (parts.length === 3) {
          result.posts.lastPostDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }

      result.posts.lastPostText = latestPost.post_text?.slice(0, 100) || null;
    }

    console.log('[GMaps Scraper] 게시물 정보:', result.posts);
  } else if (updatesResult.status === 'rejected') {
    console.log('[GMaps Scraper] 게시물 수집 실패:', updatesResult.reason?.message);
  }

  // 2. Q&A 처리
  if (qaResult.status === 'fulfilled' && qaResult.value) {
    const qa = qaResult.value;

    const answeredQuestions = qa.items || [];
    const unansweredQuestions = qa.items_without_answers || [];

    result.qna.totalCount = answeredQuestions.length + unansweredQuestions.length;
    result.qna.answeredCount = answeredQuestions.length;
    result.qna.unansweredCount = unansweredQuestions.length;

    // 최근 질문 5개 (답변 있는 것 우선)
    const allQuestions = [...answeredQuestions, ...unansweredQuestions].slice(0, 5);
    result.qna.recentQuestions = allQuestions.map(q => ({
      question: q.question_text || q.original_question_text || '',
      hasAnswer: !!(q.items && q.items.length > 0),
      date: q.timestamp ? new Date(q.timestamp).toISOString().split('T')[0] : undefined,
    }));

    console.log('[GMaps Scraper] Q&A 정보:', result.qna);
  } else if (qaResult.status === 'rejected') {
    console.log('[GMaps Scraper] Q&A 수집 실패:', qaResult.reason?.message);
  }

  // 3. 메뉴 여부 확인 (Business Info에서)
  try {
    const businessInfo = await fetchGoogleBusinessInfo({ keyword });

    // local_business_links에서 메뉴 링크 확인
    if (businessInfo.local_business_links) {
      result.hasMenu = businessInfo.local_business_links.some(
        link => link.type?.toLowerCase().includes('menu') ||
                link.title?.toLowerCase().includes('menu') ||
                link.title?.includes('메뉴')
      );
    }

    console.log('[GMaps Scraper] 메뉴 여부:', result.hasMenu);
  } catch (e) {
    console.log('[GMaps Scraper] 비즈니스 정보 조회 실패:', e);
  }

  return result;
}

/**
 * Place ID로 GMaps 데이터 수집
 */
export async function scrapeByPlaceId(placeId: string): Promise<GMapsScrapedData> {
  console.log('[GMaps Scraper] Place ID로 데이터 수집:', placeId);

  // DataForSEO는 place_id를 keyword로 사용 가능
  // 형식: place_id:ChIJ...
  const keyword = `place_id:${placeId}`;

  return scrapeGoogleMaps(keyword);
}

/**
 * 날짜를 상대적 표현으로 변환
 */
function getRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주 전`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}년 전`;
  }
}

// 기존 호환성을 위한 빈 함수 (Playwright 관련)
export async function closeBrowser(): Promise<void> {
  // DataForSEO API 사용으로 브라우저 불필요
}
