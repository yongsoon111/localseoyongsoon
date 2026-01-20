// src/lib/gmaps-scraper.ts
// Google Maps 스크래핑 유틸리티 (Playwright)

import { chromium, Browser, Page } from 'playwright';

/**
 * 상대 날짜를 실제 날짜로 변환
 * "2일 전" → "2025-01-17"
 * "3주 전" → "2024-12-29"
 */
function parseRelativeDate(relativeDate: string): string {
  const now = new Date();

  // 한국어 상대 날짜 패턴
  const minuteMatch = relativeDate.match(/(\d+)\s*분\s*전/);
  const hourMatch = relativeDate.match(/(\d+)\s*시간\s*전/);
  const dayMatch = relativeDate.match(/(\d+)\s*일\s*전/);
  const weekMatch = relativeDate.match(/(\d+)\s*주\s*전/);
  const monthMatch = relativeDate.match(/(\d+)\s*(개월|달)\s*전/);
  const yearMatch = relativeDate.match(/(\d+)\s*년\s*전/);

  // 영어 상대 날짜 패턴
  const minuteMatchEn = relativeDate.match(/(\d+)\s*minute/i);
  const hourMatchEn = relativeDate.match(/(\d+)\s*hour/i);
  const dayMatchEn = relativeDate.match(/(\d+)\s*day/i);
  const weekMatchEn = relativeDate.match(/(\d+)\s*week/i);
  const monthMatchEn = relativeDate.match(/(\d+)\s*month/i);
  const yearMatchEn = relativeDate.match(/(\d+)\s*year/i);

  if (minuteMatch || minuteMatchEn) {
    const minutes = parseInt((minuteMatch || minuteMatchEn)![1], 10);
    now.setMinutes(now.getMinutes() - minutes);
  } else if (hourMatch || hourMatchEn) {
    const hours = parseInt((hourMatch || hourMatchEn)![1], 10);
    now.setHours(now.getHours() - hours);
  } else if (dayMatch || dayMatchEn) {
    const days = parseInt((dayMatch || dayMatchEn)![1], 10);
    now.setDate(now.getDate() - days);
  } else if (weekMatch || weekMatchEn) {
    const weeks = parseInt((weekMatch || weekMatchEn)![1], 10);
    now.setDate(now.getDate() - (weeks * 7));
  } else if (monthMatch || monthMatchEn) {
    const months = parseInt((monthMatch || monthMatchEn)![1], 10);
    now.setMonth(now.getMonth() - months);
  } else if (yearMatch || yearMatchEn) {
    const years = parseInt((yearMatch || yearMatchEn)![1], 10);
    now.setFullYear(now.getFullYear() - years);
  } else {
    // 파싱 실패 시 현재 날짜 반환
    return now.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
}

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

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Google Maps CID URL에서 비즈니스 정보 스크래핑
 */
export async function scrapeGoogleMaps(cid: string): Promise<GMapsScrapedData> {
  const url = `https://www.google.com/maps?cid=${cid}&hl=ko`;

  console.log('[GMaps Scraper] 스크래핑 시작:', url);

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1920, height: 1080 },
    // 봇 감지 우회
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  const page = await context.newPage();

  try {
    // domcontentloaded로 빠르게 로드하고, 이후 특정 요소 대기
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 비즈니스 이름이나 주요 요소가 나타날 때까지 대기
    await page.waitForSelector('[role="main"] h1, [data-section-id="overview"], .fontHeadlineLarge', {
      timeout: 30000
    }).catch(() => {
      console.log('[GMaps Scraper] 메인 요소 대기 타임아웃, 계속 진행...');
    });

    // 추가 로딩 시간
    await page.waitForTimeout(3000);

    // 결과 초기화
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

    // 1. 게시물(업데이트) 탭 찾기
    try {
      // "업데이트" 또는 "Updates" 탭 클릭
      const updatesTab = await page.$('button[aria-label*="업데이트"], button[aria-label*="Updates"], [role="tab"]:has-text("업데이트"), [role="tab"]:has-text("Updates")');

      if (updatesTab) {
        await updatesTab.click();
        await page.waitForTimeout(1500);

        // 게시물 카운트 (게시물 개수 또는 목록 아이템 수)
        const postItems = await page.$$('[data-section-id="posts"] > div, [jsaction*="posts"] > div');
        result.posts.count = postItems.length;

        // 최근 게시물 날짜 추출
        const postDates = await page.$$eval(
          '[data-section-id="posts"] span[aria-label*="전"], [data-section-id="posts"] span:has-text("전"), [jsaction*="posts"] span:has-text("전")',
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );

        if (postDates.length > 0) {
          result.posts.lastPostDateRaw = postDates[0];
          result.posts.lastPostDate = parseRelativeDate(postDates[0]);
        }

        // 최근 게시물 텍스트
        const postTexts = await page.$$eval(
          '[data-section-id="posts"] [class*="fontBodyMedium"], [jsaction*="posts"] [class*="fontBodyMedium"]',
          (elements) => elements.map(el => el.textContent?.trim() || '').filter(t => t.length > 10)
        );

        if (postTexts.length > 0) {
          result.posts.lastPostText = postTexts[0].slice(0, 100);
        }

        console.log('[GMaps Scraper] 게시물 정보:', result.posts);
      } else {
        console.log('[GMaps Scraper] 업데이트 탭 없음');
      }
    } catch (e) {
      console.log('[GMaps Scraper] 게시물 스크래핑 실패:', e);
    }

    // 2. Q&A 섹션 찾기
    try {
      // 메인 페이지로 돌아가기
      const overviewTab = await page.$('button[aria-label*="개요"], button[aria-label*="Overview"], [role="tab"]:has-text("개요")');
      if (overviewTab) {
        await overviewTab.click();
        await page.waitForTimeout(1000);
      }

      // Q&A 버튼 또는 섹션 찾기
      const qnaButton = await page.$('button[aria-label*="질문"], button:has-text("질문 및 답변"), button:has-text("Q&A"), [aria-label*="질문과 답변"]');

      if (qnaButton) {
        await qnaButton.click();
        await page.waitForTimeout(1500);

        // 질문 개수 추출
        const qnaCountText = await page.$eval(
          '[aria-label*="질문"] span, button:has-text("질문") span, [class*="questions"] span',
          (el) => el.textContent || ''
        ).catch(() => '');

        const countMatch = qnaCountText.match(/(\d+)/);
        if (countMatch) {
          result.qna.totalCount = parseInt(countMatch[1], 10);
        }

        // 최근 질문 목록 추출
        const questions = await page.$$eval(
          '[data-section-id="questions"] [class*="fontBodyMedium"], [jsaction*="questions"] [class*="fontBodyMedium"]',
          (elements) => elements.slice(0, 5).map(el => ({
            question: el.textContent?.trim() || '',
            hasAnswer: false, // 나중에 체크
          }))
        );

        result.qna.recentQuestions = questions;

        // 답변 여부 확인 (답변이 있는 질문 카운트)
        const answeredQuestions = await page.$$('[data-section-id="questions"] [class*="answer"], [jsaction*="questions"] [class*="answer"]');
        result.qna.answeredCount = answeredQuestions.length;
        result.qna.unansweredCount = result.qna.totalCount - result.qna.answeredCount;

        console.log('[GMaps Scraper] Q&A 정보:', result.qna);
      } else {
        console.log('[GMaps Scraper] Q&A 섹션 없음');
      }
    } catch (e) {
      console.log('[GMaps Scraper] Q&A 스크래핑 실패:', e);
    }

    // 3. 메뉴 여부 확인
    try {
      const menuButton = await page.$('button[aria-label*="메뉴"], button:has-text("메뉴"), a[href*="menu"], [aria-label*="Menu"]');
      result.hasMenu = !!menuButton;
      console.log('[GMaps Scraper] 메뉴 여부:', result.hasMenu);
    } catch (e) {
      console.log('[GMaps Scraper] 메뉴 확인 실패:', e);
    }

    return result;

  } finally {
    await context.close();
  }
}

/**
 * Place ID로 Google Maps 스크래핑
 */
export async function scrapeByPlaceId(placeId: string): Promise<GMapsScrapedData> {
  // 더 안정적인 Google Maps 검색 URL 사용
  const url = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}&hl=ko`;

  console.log('[GMaps Scraper] Place ID로 스크래핑:', placeId);

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  const page = await context.newPage();

  try {
    // 더 빠른 로딩 조건 사용
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 주요 요소가 나타날 때까지 대기
    await page.waitForSelector('[role="main"] h1, [data-section-id="overview"], .fontHeadlineLarge, .section-hero-header', {
      timeout: 30000
    }).catch(() => {
      console.log('[GMaps Scraper] 메인 요소 대기 타임아웃, 계속 진행...');
    });

    await page.waitForTimeout(3000);

    // CID 추출 시도
    const currentUrl = page.url();
    const cidMatch = currentUrl.match(/cid[=:](\d+)/);

    if (cidMatch) {
      await context.close();
      return scrapeGoogleMaps(cidMatch[1]);
    }

    // CID를 찾지 못한 경우 현재 페이지에서 직접 스크래핑
    return await scrapeCurrentPage(page);

  } finally {
    await context.close();
  }
}

async function scrapeCurrentPage(page: Page): Promise<GMapsScrapedData> {
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

  // 탭 목록 확인
  const tabs = await page.$$('[role="tab"]');
  console.log('[GMaps Scraper] 발견된 탭 수:', tabs.length);

  for (const tab of tabs) {
    const tabText = await tab.textContent();
    console.log('[GMaps Scraper] 탭:', tabText);

    // 업데이트 탭
    if (tabText?.includes('업데이트') || tabText?.includes('Updates')) {
      await tab.click();
      await page.waitForTimeout(1500);

      // 게시물 수 확인
      const postElements = await page.$$('[data-index]');
      result.posts.count = postElements.length;

      // 날짜 확인
      const dateElement = await page.$('span:has-text("전"), span:has-text("ago")');
      if (dateElement) {
        const rawDate = await dateElement.textContent();
        result.posts.lastPostDateRaw = rawDate;
        result.posts.lastPostDate = rawDate ? parseRelativeDate(rawDate) : null;
      }
    }
  }

  // 메뉴 버튼 확인
  const menuBtn = await page.$('button:has-text("메뉴"), button:has-text("Menu")');
  result.hasMenu = !!menuBtn;

  // Q&A 확인
  const qnaSection = await page.$('[aria-label*="질문"], button:has-text("질문")');
  if (qnaSection) {
    const qnaText = await qnaSection.textContent();
    const match = qnaText?.match(/(\d+)/);
    if (match) {
      result.qna.totalCount = parseInt(match[1], 10);
    }
  }

  return result;
}
