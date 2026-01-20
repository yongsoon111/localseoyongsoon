// src/lib/language-analysis.ts
// 리뷰 언어 분석 유틸리티

import { Review, ForeignReviewAnalysis } from '@/types';

/**
 * 텍스트의 언어 감지 (간단한 휴리스틱)
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'unknown';

  // 한글 비율 계산
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;
  const koreanMatches = text.match(koreanRegex) || [];
  const koreanRatio = koreanMatches.length / text.length;

  // 일본어 비율 계산 (히라가나, 카타카나, 한자)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g;
  const japaneseMatches = text.match(japaneseRegex) || [];
  const japaneseRatio = japaneseMatches.length / text.length;

  // 중국어 비율 계산 (한자만 - 한글, 일본어 가나 제외)
  const chineseRegex = /[\u4E00-\u9FFF]/g;
  const chineseMatches = text.match(chineseRegex) || [];
  const chineseRatio = chineseMatches.length / text.length;

  // 영어 비율 계산
  const englishRegex = /[a-zA-Z]/g;
  const englishMatches = text.match(englishRegex) || [];
  const englishRatio = englishMatches.length / text.length;

  // 태국어
  const thaiRegex = /[\u0E00-\u0E7F]/g;
  const thaiMatches = text.match(thaiRegex) || [];
  const thaiRatio = thaiMatches.length / text.length;

  // 베트남어 (특수 문자 포함된 라틴)
  const vietnameseRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
  const vietnameseMatches = text.match(vietnameseRegex) || [];

  // 가장 높은 비율의 언어 반환
  const ratios = [
    { lang: 'ko', ratio: koreanRatio },
    { lang: 'ja', ratio: japaneseRatio },
    { lang: 'zh', ratio: chineseRatio - japaneseRatio }, // 일본어 한자 제외
    { lang: 'en', ratio: englishRatio },
    { lang: 'th', ratio: thaiRatio },
  ];

  // 베트남어 특수 체크
  if (vietnameseMatches.length > 3 && englishRatio > 0.3) {
    return 'vi';
  }

  const sorted = ratios.sort((a, b) => b.ratio - a.ratio);

  // 임계값 체크
  if (sorted[0].ratio < 0.1) {
    return 'unknown';
  }

  return sorted[0].lang;
}

/**
 * 영문 상호명 포함 여부 체크
 */
export function hasEnglishName(name: string): boolean {
  if (!name) return false;

  // 영문자가 3자 이상 연속으로 있는지 체크
  const englishWordRegex = /[a-zA-Z]{3,}/;
  return englishWordRegex.test(name);
}

/**
 * 비즈니스명에서 감지된 언어 목록 반환
 */
export function detectLanguagesInName(name: string): string[] {
  if (!name) return [];

  const languages: string[] = [];

  // 한글 체크 (2자 이상)
  const koreanRegex = /[\uAC00-\uD7AF]{2,}/;
  if (koreanRegex.test(name)) {
    languages.push('ko');
  }

  // 영어 체크 (3자 이상 연속)
  const englishRegex = /[a-zA-Z]{3,}/;
  if (englishRegex.test(name)) {
    languages.push('en');
  }

  // 일본어 체크 (히라가나/카타카나 2자 이상)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]{2,}/;
  if (japaneseRegex.test(name)) {
    languages.push('ja');
  }

  // 중국어 체크 (한자 2자 이상, 한글/일본어 가나와 함께 있지 않은 경우)
  const chineseOnlyRegex = /[\u4E00-\u9FFF]{2,}/;
  if (chineseOnlyRegex.test(name) && !koreanRegex.test(name) && !japaneseRegex.test(name)) {
    languages.push('zh');
  }

  return languages;
}

/**
 * 비즈니스명이 다국어 SEO 최적화되어 있는지 체크
 * (2개 이상의 언어가 포함되어 있으면 최적화된 것으로 판단)
 */
export function hasMultiLanguageName(name: string): boolean {
  const languages = detectLanguagesInName(name);
  return languages.length >= 2;
}

/**
 * 웹사이트 유형 분석
 */
export function analyzeWebsiteType(url: string): 'official' | 'sns' | 'blog' | 'other' {
  if (!url) return 'other';

  const lowerUrl = url.toLowerCase();

  // SNS 플랫폼
  const snsPatterns = [
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
    'youtube.com', 'tiktok.com', 'linkedin.com', 'threads.net',
    'kakao.com/o/', 'pf.kakao.com'
  ];

  for (const pattern of snsPatterns) {
    if (lowerUrl.includes(pattern)) {
      return 'sns';
    }
  }

  // 블로그 플랫폼
  const blogPatterns = [
    'blog.naver.com', 'tistory.com', 'brunch.co.kr',
    'medium.com', 'velog.io', 'blog.daum.net',
    'wordpress.com', 'blogger.com', 'tumblr.com'
  ];

  for (const pattern of blogPatterns) {
    if (lowerUrl.includes(pattern)) {
      return 'blog';
    }
  }

  // 배달앱/예약 플랫폼 (공식 웹사이트로 보기 어려움)
  const platformPatterns = [
    'baemin.com', 'yogiyo.co.kr', 'coupangeats.com',
    'catchtable.co.kr', 'tableing.com', 'dailyhotel.com',
    'booking.com', 'agoda.com', 'airbnb.com'
  ];

  for (const pattern of platformPatterns) {
    if (lowerUrl.includes(pattern)) {
      return 'other';
    }
  }

  // 그 외 도메인은 공식 웹사이트로 간주
  return 'official';
}

/**
 * 리뷰 언어 분석
 */
export function analyzeReviewLanguages(reviews: Review[]): ForeignReviewAnalysis {
  const languageCounts: Record<string, number> = {};

  for (const review of reviews) {
    if (!review.text) continue;

    const lang = detectLanguage(review.text);
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }

  const totalReviews = reviews.length;
  const koreanCount = languageCounts['ko'] || 0;
  const englishCount = languageCounts['en'] || 0;
  const otherCount = totalReviews - koreanCount - englishCount;

  return {
    englishReviewCount: englishCount,
    englishReviewRatio: totalReviews > 0 ? Math.round((englishCount / totalReviews) * 100) : 0,
    otherLanguageCount: otherCount,
    languageBreakdown: languageCounts,
  };
}

/**
 * 언어 코드를 사람이 읽을 수 있는 이름으로 변환
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    ko: '한국어',
    en: '영어',
    ja: '일본어',
    zh: '중국어',
    th: '태국어',
    vi: '베트남어',
    unknown: '기타',
  };
  return names[code] || code;
}
