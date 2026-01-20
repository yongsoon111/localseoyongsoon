// src/lib/review-analysis.ts

import { Review, ReviewAnalysis, KeywordCount } from '@/types';

/**
 * 리뷰 분석 수행
 */
export function analyzeReviews(reviews: Review[]): ReviewAnalysis {
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let responseCount = 0;

  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating]++;
    }
    totalRating += r.rating;
    if (r.ownerResponse) responseCount++;
  });

  return {
    responseRate: reviews.length > 0 ? (responseCount / reviews.length) * 100 : 0,
    avgRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    ratingDistribution,
    keywords: extractKeywords(reviews),
  };
}

/**
 * 리뷰에서 키워드 추출 (간단 버전)
 */
export function extractKeywords(reviews: Review[]): KeywordCount[] {
  const wordCount: Record<string, number> = {};

  // 한국어 불용어
  const stopwords = new Set([
    '이', '그', '저', '것', '수', '등', '들', '및', '에서', '으로',
    '너무', '정말', '아주', '매우', '좀', '잘', '더', '가장',
    '하고', '해서', '했는데', '있는', '없는', '하는', '된', '되는',
    '같은', '또', '도', '가', '를', '을', '는', '은', '에', '와',
    '이런', '저런', '그런', '어떤', '좋은', '나쁜', '많은', '적은',
    '다른', '같이', '위해', '통해', '대한', '관한', '따라', '의해',
    '때문', '인해', '비해', '관해', '있어', '없어', '해도', '했지만',
  ]);

  reviews.forEach((r) => {
    if (!r.text) return;

    // 특수문자 제거 및 공백 기준 분리
    const words = r.text
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopwords.has(w));

    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  return Object.entries(wordCount)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * 긍정/부정 키워드 분류
 */
export function classifyKeywords(keywords: KeywordCount[]): {
  positive: KeywordCount[];
  negative: KeywordCount[];
  neutral: KeywordCount[];
} {
  const positiveWords = new Set([
    '맛있', '친절', '좋', '최고', '추천', '만족', '깨끗', '빠른', '신선',
    '훌륭', '대박', '굿', '감사', '편한', '쾌적', '청결', '정성', '맛집',
  ]);

  const negativeWords = new Set([
    '별로', '실망', '불친절', '느린', '비싼', '더럽', '최악', '불만',
    '짜증', '싫', '나쁜', '안좋', '불편', '부족', '아쉽', '늦',
  ]);

  const positive: KeywordCount[] = [];
  const negative: KeywordCount[] = [];
  const neutral: KeywordCount[] = [];

  keywords.forEach((kw) => {
    const word = kw.keyword;
    const isPositive = [...positiveWords].some((pw) => word.includes(pw));
    const isNegative = [...negativeWords].some((nw) => word.includes(nw));

    if (isPositive) {
      positive.push(kw);
    } else if (isNegative) {
      negative.push(kw);
    } else {
      neutral.push(kw);
    }
  });

  return { positive, negative, neutral };
}

/**
 * 평점 분포 요약 텍스트 생성
 */
export function getRatingDistributionSummary(
  distribution: Record<number, number>
): string {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return '리뷰가 없습니다.';

  const high = distribution[5] + distribution[4];
  const low = distribution[1] + distribution[2];
  const highPercent = Math.round((high / total) * 100);
  const lowPercent = Math.round((low / total) * 100);

  if (highPercent >= 80) {
    return `매우 긍정적 (4-5점 ${highPercent}%)`;
  }
  if (highPercent >= 60) {
    return `긍정적 (4-5점 ${highPercent}%)`;
  }
  if (lowPercent >= 30) {
    return `주의 필요 (1-2점 ${lowPercent}%)`;
  }
  return `보통 (4-5점 ${highPercent}%)`;
}
