// src/lib/scoring.ts

import { BusinessInfo, Post } from '@/types';

/**
 * Basic Audit 점수 계산 (최대 92점, 엄격한 기준)
 */
export function calculateBasicScore(business: BusinessInfo): number {
  let score = 0;

  // 필수 항목 (각 12점, 최대 48점)
  if (business.name) score += 12;
  if (business.address) score += 12;
  if (business.phone) score += 12;
  if (business.category && business.category !== 'unknown') score += 12;

  // 웹사이트 (8점) - 공식 웹사이트만 만점
  if (business.websiteType === 'official') score += 8;
  else if (business.website) score += 4;

  // 영업시간 (8점) - 7일 모두 있어야 만점
  if (business.openingHours.length >= 7) score += 8;
  else if (business.openingHours.length >= 5) score += 5;
  else if (business.openingHours.length > 0) score += 2;

  // 사진 (10점) - 50장 이상 만점
  if (business.photos >= 50) score += 10;
  else if (business.photos >= 20) score += 7;
  else if (business.photos >= 10) score += 4;
  else if (business.photos > 0) score += 2;

  // 리뷰 수 (10점) - 100개 이상 만점
  if (business.reviewCount >= 100) score += 10;
  else if (business.reviewCount >= 50) score += 7;
  else if (business.reviewCount >= 20) score += 4;
  else if (business.reviewCount > 0) score += 2;

  // 평점 (8점) - 4.7 이상 만점
  if (business.rating >= 4.7) score += 8;
  else if (business.rating >= 4.5) score += 6;
  else if (business.rating >= 4.0) score += 4;
  else if (business.rating >= 3.5) score += 2;

  return Math.min(score, 92);
}

/**
 * 리뷰 점수 계산
 */
export function calculateReviewScore(
  avgRating: number,
  reviewCount: number,
  responseRate: number
): number {
  let score = 0;

  // 평점 (40점)
  if (avgRating >= 4.5) score += 40;
  else if (avgRating >= 4.0) score += 30;
  else if (avgRating >= 3.5) score += 20;
  else if (avgRating >= 3.0) score += 10;

  // 리뷰 수 (30점)
  if (reviewCount >= 100) score += 30;
  else if (reviewCount >= 50) score += 25;
  else if (reviewCount >= 20) score += 20;
  else if (reviewCount >= 10) score += 15;
  else if (reviewCount > 0) score += 10;

  // 응답률 (30점)
  if (responseRate >= 80) score += 30;
  else if (responseRate >= 50) score += 20;
  else if (responseRate >= 20) score += 10;

  return Math.min(score, 100);
}

/**
 * 게시물 활성도 점수 계산
 */
export function calculatePostActivityScore(posts: Post[]): number {
  if (posts.length === 0) return 0;

  const now = new Date();
  const lastPostDate = parseRelativeDate(posts[0].date);
  const daysSinceLastPost = Math.floor(
    (now.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastPost <= 7) return 100;
  if (daysSinceLastPost <= 14) return 80;
  if (daysSinceLastPost <= 30) return 60;
  if (daysSinceLastPost <= 60) return 40;
  if (daysSinceLastPost <= 90) return 20;
  return 0;
}

/**
 * 상대적 날짜 문자열 파싱 (예: "3일 전", "2주 전")
 */
function parseRelativeDate(dateStr: string): Date {
  const now = new Date();

  if (dateStr.includes('일 전')) {
    const days = parseInt(dateStr);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  if (dateStr.includes('주 전')) {
    const weeks = parseInt(dateStr);
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  }
  if (dateStr.includes('개월 전')) {
    const months = parseInt(dateStr);
    const date = new Date(now);
    date.setMonth(date.getMonth() - months);
    return date;
  }
  if (dateStr.includes('년 전')) {
    const years = parseInt(dateStr);
    const date = new Date(now);
    date.setFullYear(date.getFullYear() - years);
    return date;
  }

  // ISO 날짜 형식 시도
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return now;
}

/**
 * 종합 점수 계산
 */
export function calculateTotalScore(
  basicScore: number,
  reviewScore: number,
  activityScore: number
): number {
  // 가중치: 기본정보 40%, 리뷰 40%, 활성도 20%
  return Math.round(basicScore * 0.4 + reviewScore * 0.4 + activityScore * 0.2);
}

/**
 * 점수에 따른 등급 반환
 */
export function getScoreGrade(score: number): {
  grade: string;
  label: string;
  color: string;
} {
  if (score >= 90) {
    return { grade: 'A+', label: '최우수', color: 'green' };
  }
  if (score >= 80) {
    return { grade: 'A', label: '우수', color: 'green' };
  }
  if (score >= 70) {
    return { grade: 'B+', label: '양호', color: 'blue' };
  }
  if (score >= 60) {
    return { grade: 'B', label: '보통', color: 'blue' };
  }
  if (score >= 50) {
    return { grade: 'C', label: '개선 필요', color: 'yellow' };
  }
  return { grade: 'D', label: '긴급 개선 필요', color: 'red' };
}
