// src/types/index.ts

// ===== Design System Types =====

// 진단 상태 enum
export enum DiagnosticStatus {
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

// 탭 타입
export type AuditTab = 'DIAGNOSTIC' | 'REVIEWS' | 'RANKING' | 'AI_REPORT' | 'COMPETITORS';

// 테마 타입
export type ThemeType = 'light' | 'dark' | 'blue' | 'green' | 'navy';

// 체크리스트 항목
export interface ChecklistItem {
  category: string;
  item: string;
  status: DiagnosticStatus;
  currentValue: string;
  diagnosis: string;
}

// 점수 이력
export interface ScoreHistory {
  date: string;
  score: number;
}

// AI 보고서 데이터 타입
export interface ReportData {
  auditor: string;
  targetBusiness: string;
  date: string;
  summary: {
    headline: string;
    impactDescription: string;
  };
  reviewTrend: Array<{
    period: string;
    count: number;
    rating: number;
    responseRate: string;
  }>;
  negativePatterns: {
    totalNegativeReviews: number;
    noResponseCount?: number;
    topComplaints: Array<{
      category: string;
      issue?: string;
      count: number;
      percentage: string;
      severity?: 'critical' | 'high' | 'medium';
      quotes: string | string[];
      suggestedAction?: string;
    }>;
    commonKeywords?: string[];
    prioritizedImprovements: string[];
  };
  sections: Array<{
    title: string;
    items: Array<{
      label: string;
      status: string;
      diagnosis: string;
    }>;
  }>;
  finalAssessment: {
    oneLineReview: string;
    warning: string;
  };
  actionPlan: Array<{
    title: string;
    description: string;
  }>;
}

// 경쟁사 리뷰 타입
export interface CompetitorReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime: string;
}

// 경쟁사 분석용 타입 (디자인 확장)
export interface CompetitorAnalysis {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  photos: number;
  distance: string;
  features: string[];
  isMe?: boolean;
  placeId: string;
  recentReviews?: CompetitorReview[];
  negativeReviews?: CompetitorReview[];
  negativeKeywords?: string[];
}

// ===== Existing Types =====

// 로컬 비즈니스 링크 (메뉴, 예약, 주문 등)
export interface LocalBusinessLink {
  title: string;
  url: string;
  type?: string;
}

// 리뷰에서 추출된 키워드 토픽
export interface PlaceTopic {
  title: string;
  count?: number;
}

export interface BusinessInfo {
  placeId: string;
  name: string;
  originalTitle?: string; // 원본 제목 (로컬 언어)
  category: string;
  additionalCategories?: string[]; // 서브 카테고리들
  address: string;
  phone: string;
  website: string;
  websiteType?: 'official' | 'sns' | 'blog' | 'other'; // 웹사이트 유형
  rating: number;
  reviewCount: number;
  ratingDistribution?: Record<string, number>; // 별점 분포
  openingHours: string[];
  photos: number;
  attributes: Attribute[];
  location?: {
    lat: number;
    lng: number;
  };
  // 추가 진단 항목
  description?: string; // 업장 설명
  hasEnglishName?: boolean; // 영문 상호 포함 여부
  hasMultiLanguageName?: boolean; // 다국어 상호 (SEO 최적화)
  detectedLanguages?: string[]; // 감지된 언어 목록
  mainImage?: string; // 대표 이미지 URL
  logo?: string; // 로고 이미지 URL
  userPhotosCount?: number; // 유저 업로드 사진 수
  ownerPhotosCount?: number; // 오너 업로드 사진 수
  // 링크 및 서비스
  localBusinessLinks?: LocalBusinessLink[]; // 예약, 메뉴, 주문 링크
  hasMenuLink?: boolean; // 메뉴 링크 있음
  hasReservationLink?: boolean; // 예약 링크 있음
  hasOrderLink?: boolean; // 주문 링크 있음
  // 리뷰 키워드
  placeTopics?: PlaceTopic[]; // 리뷰에서 추출된 키워드
  // 상태
  isClaimed?: boolean; // 소유권 주장 여부
  // 점수 이력
  scoreHistory?: ScoreHistory[];
}

// Google Maps 스크래핑 데이터
export interface GMapsScrapedData {
  posts: {
    count: number;
    lastPostDate: string | null;      // 실제 날짜 (YYYY-MM-DD)
    lastPostDateRaw: string | null;   // 원본 상대 날짜 ("2일 전")
    lastPostText: string | null;
  };
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
  hasMenu: boolean;
  scrapedAt: string;
}

// 업종별 필수 속성 체크리스트
export interface AttributeChecklist {
  category: string;
  required: string[];
  recommended: string[];
}

// 게시물 분석
export interface PostAudit {
  posts: Post[];
  lastPostDate: string | null;
  postFrequency: number; // 월간 게시물 수
  totalPosts: number;
}

// 외국인 리뷰 분석
export interface ForeignReviewAnalysis {
  englishReviewCount: number;
  englishReviewRatio: number;
  otherLanguageCount: number;
  languageBreakdown: Record<string, number>;
}

export interface Attribute {
  key: string;
  value: boolean | string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  ownerResponse?: string;
  responseDate?: string;
}

export interface TeleportResult {
  lat: number;
  lng: number;
  rank: number | null;
  competitors: Competitor[];
}

export interface Competitor {
  rank: number;
  name: string;
  placeId: string;
  rating: number;
}

export interface ReviewAnalysis {
  responseRate: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  keywords: KeywordCount[];
}

export interface ReviewAudit {
  reviews: Review[];
  analysis: ReviewAnalysis;
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

export interface AuditScore {
  total: number;
  basicInfo: number;
  reviews: number;
  activity: number;
}

export interface AuditReport {
  business: BusinessInfo;
  reviews: ReviewAudit;
  teleport: TeleportResult[];
  score: AuditScore;
}

export interface Post {
  type: string;
  title: string;
  content: string;
  date: string;
  hasImage: boolean;
  cta?: string;
}

export interface GridSearchParams {
  keyword: string;
  centerLat: number;
  centerLng: number;
  targetPlaceId: string;
  gridSize: number;
}

export interface PlaceIdResponse {
  placeId?: string;
  error?: string;
}

export interface AuditResponse {
  business: BusinessInfo;
  score: number;
  error?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  analysis: ReviewAnalysis;
  error?: string;
}

export interface TeleportResponse extends TeleportResult {
  error?: string;
}

export interface GridSearchResponse {
  results: TeleportResult[];
  error?: string;
}

// Dashboard types
export interface SavedBusiness {
  id: string;
  user_id: string;
  place_id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number;
  photo_count: number;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  updated_at: string;
  latest_audit?: AuditHistoryItem;
}

export interface AuditHistoryItem {
  id: string;
  business_id: string;
  basic_score: number | null;
  review_score: number | null;
  total_score: number | null;
  response_rate: number | null;
  avg_rating: number | null;
  rating_distribution: Record<number, number> | null;
  keywords: KeywordCount[] | null;
  audit_data: Record<string, unknown> | null;
  created_at: string;
}
