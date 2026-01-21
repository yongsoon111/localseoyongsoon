// src/stores/audit-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessInfo, ReviewAudit, TeleportResult, GMapsScrapedData, CompetitorAnalysis, ReportData, ChecklistItem } from '@/types';

// 경쟁사 데이터
interface CompetitorData {
  competitors: CompetitorAnalysis[];
  summary: {
    total: number;
    avgRating: number;
    avgReviews: number;
    avgPhotos: number;
  };
  myRanks: {
    rating: string;
    reviews: string;
    photos: string;
    overall: string;
  } | null;
  searchRadius: number;
  searchKeyword: string;
}

interface ScrapeError {
  error: string;
  errorType: string;
  originalError: string;
  params: { cid?: string; placeId?: string };
  timestamp: string;
}

// 백그라운드 작업 상태
export type TaskType = 'audit' | 'reviews' | 'teleport' | 'scrape' | 'competitors' | 'ai_report';
export interface BackgroundTask {
  id: string;
  type: TaskType;
  businessId: string;
  businessName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// 비즈니스별 저장 데이터
interface BusinessAuditData {
  business: BusinessInfo | null;
  basicScore: number;
  reviewData: ReviewAudit | null;
  reviewFetchedAt: string | null;
  reviewDepth: number;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
  scrapedData: GMapsScrapedData | null;
  lastAuditAt: string | null;  // 마지막 진단 시간
}

interface AuditState {
  // hydration 상태
  _hasHydrated: boolean;

  // 현재 선택된 비즈니스 ID
  currentBusinessId: string | null;

  // 비즈니스별 캐시된 데이터
  cachedAudits: Record<string, BusinessAuditData>;

  // 현재 상태 (현재 비즈니스의 데이터)
  placeId: string | null;
  business: BusinessInfo | null;
  basicScore: number;
  reviewData: ReviewAudit | null;
  reviewFetchedAt: string | null;
  reviewDepth: number;
  teleportResults: TeleportResult[];
  teleportKeyword: string;
  scrapedData: GMapsScrapedData | null;
  scrapeError: ScrapeError | null;

  // 경쟁사 데이터
  competitorData: CompetitorData | null;
  competitorLoading: boolean;
  competitorError: string | null;

  // AI 보고서 데이터
  aiReport: ReportData | null;
  aiReportLoading: boolean;
  aiReportError: string | null;

  // 로딩 상태
  loading: boolean;
  reviewLoading: boolean;
  teleportLoading: boolean;
  scrapeLoading: boolean;

  // 백그라운드 작업
  backgroundTasks: BackgroundTask[];

  // 에러
  error: string | null;

  // 액션
  setPlaceId: (placeId: string) => void;
  setCurrentBusiness: (businessId: string) => void;
  fetchAudit: (keyword: string) => Promise<void>;
  fetchReviews: (keyword: string, depth?: number) => Promise<void>;
  setReviewDepth: (depth: number) => void;
  setTeleportResults: (results: TeleportResult[], keyword: string) => void;
  fetchTeleportSingle: (keyword: string, lat: number, lng: number, targetPlaceId: string) => Promise<TeleportResult | null>;
  fetchTeleportGrid: (keyword: string, centerLat: number, centerLng: number, targetPlaceId: string, gridSize: number, radiusMiles: number) => Promise<TeleportResult[]>;
  fetchScrapedData: (placeId: string) => Promise<void>;
  fetchCompetitors: (keyword?: string) => Promise<void>;
  generateAIReport: (checklist: ChecklistItem[]) => Promise<void>;
  loadAudit: (auditData: any, score: number) => void;
  saveCurrentToCache: () => void;
  loadFromCache: (businessId: string) => boolean;
  reset: () => void;
  resetCurrent: () => void;
  // 백그라운드 작업 관리
  startTask: (type: TaskType, businessId: string, businessName: string) => string;
  completeTask: (taskId: string) => void;
  failTask: (taskId: string, error: string) => void;
  clearCompletedTasks: () => void;
}

const initialBusinessData: BusinessAuditData = {
  business: null,
  basicScore: 0,
  reviewData: null,
  reviewFetchedAt: null,
  reviewDepth: 50,
  teleportResults: [],
  teleportKeyword: '',
  scrapedData: null,
  lastAuditAt: null,
};

const initialState = {
  _hasHydrated: false,
  currentBusinessId: null,
  cachedAudits: {} as Record<string, BusinessAuditData>,
  placeId: null,
  business: null,
  basicScore: 0,
  reviewData: null,
  reviewFetchedAt: null,
  reviewDepth: 50,
  teleportResults: [],
  teleportKeyword: '',
  scrapedData: null,
  scrapeError: null,
  competitorData: null,
  competitorLoading: false,
  competitorError: null,
  aiReport: null,
  aiReportLoading: false,
  aiReportError: null,
  loading: false,
  reviewLoading: false,
  teleportLoading: false,
  scrapeLoading: false,
  backgroundTasks: [] as BackgroundTask[],
  error: null,
};

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlaceId: (placeId) => {
        set({ placeId });
      },

      // 비즈니스 전환 시 호출 - 캐시된 데이터가 있으면 로드
      setCurrentBusiness: (businessId) => {
        const state = get();

        // 같은 비즈니스면 스킵
        if (state.currentBusinessId === businessId) {
          console.log('[AuditStore] 같은 비즈니스, 스킵:', businessId);
          return;
        }

        // 현재 데이터 저장
        if (state.currentBusinessId && state.business) {
          state.saveCurrentToCache();
        }

        // 새 비즈니스로 전환 시 모든 비즈니스별 상태 초기화
        console.log('[AuditStore] 비즈니스 전환:', state.currentBusinessId, '->', businessId);
        set({
          currentBusinessId: businessId,
          // 비즈니스별 데이터 초기화
          placeId: null,
          business: null,
          basicScore: 0,
          reviewData: null,
          reviewFetchedAt: null,
          teleportResults: [],
          teleportKeyword: '',
          scrapedData: null,
          scrapeError: null,
          // 경쟁사 및 AI 보고서도 초기화
          competitorData: null,
          competitorError: null,
          aiReport: null,
          aiReportError: null,
          // 로딩 상태 초기화
          loading: false,
          reviewLoading: false,
          teleportLoading: false,
          scrapeLoading: false,
          competitorLoading: false,
          aiReportLoading: false,
          error: null,
        });

        // 캐시에서 새 비즈니스 데이터 로드 시도
        state.loadFromCache(businessId);
      },

      // 현재 상태를 캐시에 저장
      saveCurrentToCache: () => {
        const state = get();
        if (!state.currentBusinessId || !state.business) {
          console.log('[AuditStore] saveCurrentToCache 스킵 - 데이터 없음');
          return;
        }

        const businessData: BusinessAuditData = {
          business: state.business,
          basicScore: state.basicScore,
          reviewData: state.reviewData,
          reviewFetchedAt: state.reviewFetchedAt,
          reviewDepth: state.reviewDepth,
          teleportResults: state.teleportResults,
          teleportKeyword: state.teleportKeyword,
          scrapedData: state.scrapedData,
          lastAuditAt: new Date().toISOString(),
        };

        console.log('[AuditStore] saveCurrentToCache:', state.currentBusinessId, {
          hasReviewData: !!state.reviewData,
          reviewCount: state.reviewData?.reviews?.length || 0,
          teleportCount: state.teleportResults?.length || 0,
        });

        set({
          cachedAudits: {
            ...state.cachedAudits,
            [state.currentBusinessId]: businessData,
          },
        });
      },

      // 캐시에서 데이터 로드
      loadFromCache: (businessId) => {
        const state = get();
        const cached = state.cachedAudits[businessId];
        console.log('[AuditStore] loadFromCache:', businessId, {
          hasCached: !!cached,
          hasReviewData: !!cached?.reviewData,
          reviewCount: cached?.reviewData?.reviews?.length || 0,
        });

        if (cached && cached.business) {
          set({
            placeId: cached.business?.placeId || null,
            business: cached.business,
            basicScore: cached.basicScore,
            reviewData: cached.reviewData,
            reviewFetchedAt: cached.reviewFetchedAt,
            reviewDepth: cached.reviewDepth,
            teleportResults: cached.teleportResults,
            teleportKeyword: cached.teleportKeyword,
            scrapedData: cached.scrapedData,
            loading: false,
            error: null,
          });
          console.log('[AuditStore] 캐시 로드 완료 - reviewData:', !!cached.reviewData);
          return true;
        }
        return false;
      },

      fetchAudit: async (keyword) => {
        set({ loading: true, error: null });

        try {
          const res = await fetch(`/api/audit?keyword=${encodeURIComponent(keyword)}`);
          const data = await res.json();

          if (data.error) {
            throw new Error(data.error);
          }

          set({
            placeId: data.business?.placeId || null,
            business: data.business,
            basicScore: data.score,
            loading: false,
          });

          // 진단 완료 후 자동 저장
          get().saveCurrentToCache();
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '오류가 발생했습니다',
          });
        }
      },

      fetchReviews: async (keyword, depth) => {
        const state = get();
        const reviewDepth = depth ?? state.reviewDepth;
        const businessId = state.currentBusinessId || '';
        const businessName = state.business?.name || keyword;

        // 백그라운드 작업 시작
        const taskId = get().startTask('reviews', businessId, businessName);
        set({ reviewLoading: true, reviewDepth });

        try {
          const res = await fetch(`/api/reviews?keyword=${encodeURIComponent(keyword)}&depth=${reviewDepth}`);
          const data = await res.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const reviewData = {
            reviews: data.reviews,
            analysis: data.analysis,
          };

          set({
            reviewData,
            reviewFetchedAt: new Date().toISOString(),
            reviewLoading: false,
          });

          // 리뷰 분석 완료 후 자동 저장 (로컬 캐시)
          get().saveCurrentToCache();

          // DB에도 저장
          const currentState = get();
          if (currentState.currentBusinessId) {
            fetch(`/api/businesses/${currentState.currentBusinessId}/audit`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reviewData }),
            }).catch(err => console.error('[AuditStore] DB 저장 실패:', err));
          }

          // 작업 완료
          get().completeTask(taskId);
        } catch (error) {
          console.error('Reviews fetch error:', error);
          set({ reviewLoading: false });
          get().failTask(taskId, error instanceof Error ? error.message : '리뷰 분석 실패');
        }
      },

      setReviewDepth: (depth) => {
        set({ reviewDepth: depth });
      },

      setTeleportResults: (results, keyword) => {
        set({ teleportResults: results, teleportKeyword: keyword });
        // 텔레포트 결과 저장 후 자동 저장 (로컬 캐시)
        get().saveCurrentToCache();

        // DB에도 저장
        const state = get();
        if (state.currentBusinessId) {
          fetch(`/api/businesses/${state.currentBusinessId}/audit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teleportResults: results, teleportKeyword: keyword }),
          }).catch(err => console.error('[AuditStore] DB 저장 실패:', err));
        }
      },

      fetchScrapedData: async (placeId) => {
        const state = get();
        const businessId = state.currentBusinessId || '';
        const businessName = state.business?.name || '';

        // 백그라운드 작업 시작
        const taskId = get().startTask('scrape', businessId, businessName);
        set({ scrapeLoading: true, scrapeError: null });

        try {
          const res = await fetch(`/api/scrape?placeId=${encodeURIComponent(placeId)}`);
          const data = await res.json();

          if (data.error) {
            console.error('[Scrape] 오류:', data);
            set({
              scrapeLoading: false,
              scrapeError: {
                error: data.error,
                errorType: data.errorType || 'UNKNOWN',
                originalError: data.originalError || data.error,
                params: data.params || { placeId },
                timestamp: data.timestamp || new Date().toISOString(),
              },
            });
            get().failTask(taskId, data.error);
            return;
          }

          set({
            scrapedData: data,
            scrapeLoading: false,
            scrapeError: null,
          });

          // 스크랩 데이터 저장 후 자동 저장
          get().saveCurrentToCache();

          // DB에도 저장
          if (state.currentBusinessId) {
            fetch(`/api/businesses/${state.currentBusinessId}/audit`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scrapedData: data }),
            }).catch(err => console.error('[AuditStore] DB 저장 실패:', err));
          }

          // 작업 완료
          get().completeTask(taskId);
        } catch (error) {
          console.error('[Scrape] 스크래핑 오류:', error);
          set({
            scrapeLoading: false,
            scrapeError: {
              error: error instanceof Error ? error.message : '알 수 없는 오류',
              errorType: 'CLIENT_ERROR',
              originalError: error instanceof Error ? error.message : String(error),
              params: { placeId },
              timestamp: new Date().toISOString(),
            },
          });
          get().failTask(taskId, error instanceof Error ? error.message : 'GMaps 스크래핑 실패');
        }
      },

      // 단일 위치 검색순위 체크
      fetchTeleportSingle: async (keyword, lat, lng, targetPlaceId) => {
        const state = get();
        const businessId = state.currentBusinessId || '';
        const businessName = state.business?.name || '';

        const taskId = get().startTask('teleport', businessId, businessName);
        set({ teleportLoading: true });

        try {
          const res = await fetch('/api/teleport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword,
              lat,
              lng,
              targetPlaceId,
              businessName,
            }),
          });
          const data = await res.json();

          if (data.error) {
            get().failTask(taskId, data.error);
            set({ teleportLoading: false });
            return null;
          }

          // 결과 저장
          set({ teleportResults: [data], teleportKeyword: keyword, teleportLoading: false });
          get().saveCurrentToCache();

          // DB에도 저장
          if (state.currentBusinessId) {
            fetch(`/api/businesses/${state.currentBusinessId}/audit`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teleportResults: [data], teleportKeyword: keyword }),
            }).catch(err => console.error('[AuditStore] DB 저장 실패:', err));
          }

          get().completeTask(taskId);
          return data;
        } catch (error) {
          console.error('[Teleport] 오류:', error);
          set({ teleportLoading: false });
          get().failTask(taskId, error instanceof Error ? error.message : '검색순위 체크 실패');
          return null;
        }
      },

      // 그리드 검색순위 체크
      fetchTeleportGrid: async (keyword, centerLat, centerLng, targetPlaceId, gridSize, radiusMiles) => {
        const state = get();
        const businessId = state.currentBusinessId || '';
        const businessName = state.business?.name || '';

        const taskId = get().startTask('teleport', businessId, businessName);
        set({ teleportLoading: true });

        try {
          const res = await fetch('/api/teleport/grid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword,
              centerLat,
              centerLng,
              targetPlaceId,
              businessName,
              gridSize,
              radiusMiles,
            }),
          });
          const data = await res.json();

          if (data.error) {
            get().failTask(taskId, data.error);
            set({ teleportLoading: false });
            return [];
          }

          const results = data.results || [];
          set({ teleportResults: results, teleportKeyword: keyword, teleportLoading: false });
          get().saveCurrentToCache();

          // DB에도 저장
          if (state.currentBusinessId) {
            fetch(`/api/businesses/${state.currentBusinessId}/audit`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teleportResults: results, teleportKeyword: keyword }),
            }).catch(err => console.error('[AuditStore] DB 저장 실패:', err));
          }

          get().completeTask(taskId);
          return results;
        } catch (error) {
          console.error('[Teleport Grid] 오류:', error);
          set({ teleportLoading: false });
          get().failTask(taskId, error instanceof Error ? error.message : '그리드 검색 실패');
          return [];
        }
      },

      // 경쟁사 분석 (키워드 기반)
      fetchCompetitors: async (keyword?: string) => {
        const state = get();
        const business = state.business;
        if (!business?.location?.lat || !business?.location?.lng) {
          set({ competitorError: '위치 정보가 없어 경쟁사 검색이 불가능합니다.' });
          return;
        }

        if (!keyword) {
          set({ competitorError: '검색 키워드를 입력해주세요.' });
          return;
        }

        const businessId = state.currentBusinessId || '';
        const businessName = business.name || '';

        const taskId = get().startTask('competitors', businessId, businessName);
        set({ competitorLoading: true, competitorError: null, competitorData: null });

        try {
          const params = new URLSearchParams({
            lat: business.location.lat.toString(),
            lng: business.location.lng.toString(),
            category: keyword,  // 키워드를 category 파라미터로 전달 (API에서 searchKeyword로 사용)
            myPlaceId: business.placeId || '',
            myName: business.name,
            myRating: business.rating.toString(),
            myReviews: business.reviewCount.toString(),
            myPhotos: business.photos.toString(),
            radius: '500',
          });

          const res = await fetch(`/api/competitors?${params}`);
          const data = await res.json();

          if (data.error) {
            set({ competitorLoading: false, competitorError: data.error });
            get().failTask(taskId, data.error);
            return;
          }

          set({
            competitorData: data,
            competitorLoading: false,
            competitorError: null,
          });

          get().completeTask(taskId);
        } catch (error) {
          console.error('[Competitors] 오류:', error);
          set({
            competitorLoading: false,
            competitorError: error instanceof Error ? error.message : '경쟁사 분석 실패',
          });
          get().failTask(taskId, error instanceof Error ? error.message : '경쟁사 분석 실패');
        }
      },

      // AI 보고서 생성
      generateAIReport: async (checklist) => {
        const state = get();
        const business = state.business;
        if (!business) {
          set({ aiReportError: '비즈니스 정보가 없습니다.' });
          return;
        }

        const businessId = state.currentBusinessId || '';
        const businessName = business.name || '';

        const taskId = get().startTask('ai_report', businessId, businessName);
        set({ aiReportLoading: true, aiReportError: null });

        try {
          // 전체 리뷰 (최대 100개)
          const allReviews = state.reviewData?.reviews.slice(0, 100).map(r => ({
            author: r.author,
            rating: r.rating,
            text: r.text,
            date: r.date,
            ownerResponse: r.ownerResponse,
          })) || [];

          // 부정 리뷰 (1-3점) 별도 분류 - 전체 내용 포함
          const negativeReviews = state.reviewData?.reviews
            .filter(r => r.rating <= 3)
            .slice(0, 50)  // 부정 리뷰 최대 50개
            .map(r => ({
              author: r.author,
              rating: r.rating,
              text: r.text,  // 전체 텍스트 포함
              date: r.date,
              ownerResponse: r.ownerResponse,
            })) || [];

          // 리뷰 통계
          const reviewStats = state.reviewData ? {
            total: state.reviewData.reviews.length,
            avgRating: state.reviewData.analysis.avgRating,
            responseRate: state.reviewData.analysis.responseRate,
            ratingDistribution: state.reviewData.analysis.ratingDistribution,
            negativeCount: state.reviewData.reviews.filter(r => r.rating <= 3).length,
            noResponseNegative: state.reviewData.reviews.filter(r => r.rating <= 3 && !r.ownerResponse).length,
          } : null;

          // 순위 정보
          const rankingInfo = state.teleportResults[0]?.rank
            ? `${state.teleportResults[0].rank}위 (${state.teleportKeyword || '키워드 미설정'})`
            : '순위 미확인';

          // API 호출
          const res = await fetch('/api/ai-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: business.name,
              checklist,
              reviews: allReviews,
              negativeReviews,  // 부정 리뷰 별도 전달
              reviewStats,      // 리뷰 통계 전달
              rankingInfo,
            }),
          });
          const data = await res.json();

          if (data.error) {
            set({ aiReportLoading: false, aiReportError: data.error });
            get().failTask(taskId, data.error);
            return;
          }

          set({
            aiReport: data,
            aiReportLoading: false,
            aiReportError: null,
          });

          get().completeTask(taskId);
        } catch (error) {
          console.error('[AI Report] 오류:', error);
          set({
            aiReportLoading: false,
            aiReportError: error instanceof Error ? error.message : 'AI 보고서 생성 실패',
          });
          get().failTask(taskId, error instanceof Error ? error.message : 'AI 보고서 생성 실패');
        }
      },

      loadAudit: (auditData, score) => {
        const state = get();
        const { business, reviewData, teleportResults, teleportKeyword, scrapedData } = auditData;

        // DB에서 로드한 데이터가 없으면 기존 캐시/상태 유지 (데이터 손실 방지)
        set({
          business: business || state.business || null,
          basicScore: score || state.basicScore || 0,
          reviewData: reviewData || state.reviewData || null,
          teleportResults: teleportResults || state.teleportResults || [],
          teleportKeyword: teleportKeyword || state.teleportKeyword || '',
          scrapedData: scrapedData || state.scrapedData || null,
          placeId: business?.placeId || state.placeId || null,
          loading: false,
          reviewLoading: false,
          error: null,
        });

        console.log('[AuditStore] loadAudit 완료:', {
          hasReviewData: !!(reviewData || state.reviewData),
          hasTeleportResults: !!(teleportResults || state.teleportResults?.length),
        });
      },

      // 전체 초기화 (모든 캐시 포함)
      reset: () => {
        set(initialState);
      },

      // 현재 비즈니스만 초기화 (새 진단 실행 시 사용)
      resetCurrent: () => {
        set({
          placeId: null,
          business: null,
          basicScore: 0,
          reviewData: null,
          reviewFetchedAt: null,
          teleportResults: [],
          teleportKeyword: '',
          scrapedData: null,
          scrapeError: null,
          loading: false,
          reviewLoading: false,
          teleportLoading: false,
          scrapeLoading: false,
          error: null,
        });
      },

      // 백그라운드 작업 시작
      startTask: (type, businessId, businessName) => {
        const taskId = `${type}-${businessId}-${Date.now()}`;
        const task: BackgroundTask = {
          id: taskId,
          type,
          businessId,
          businessName,
          status: 'running',
          startedAt: new Date().toISOString(),
        };
        set((state) => ({
          backgroundTasks: [...state.backgroundTasks, task],
        }));
        return taskId;
      },

      // 백그라운드 작업 완료
      completeTask: (taskId) => {
        set((state) => ({
          backgroundTasks: state.backgroundTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
              : t
          ),
        }));
        // 5초 후 완료된 작업 자동 제거
        setTimeout(() => {
          const state = get();
          set({
            backgroundTasks: state.backgroundTasks.filter((t) => t.id !== taskId),
          });
        }, 5000);
      },

      // 백그라운드 작업 실패
      failTask: (taskId, error) => {
        set((state) => ({
          backgroundTasks: state.backgroundTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'failed' as const, completedAt: new Date().toISOString(), error }
              : t
          ),
        }));
      },

      // 완료된 작업 모두 제거
      clearCompletedTasks: () => {
        set((state) => ({
          backgroundTasks: state.backgroundTasks.filter((t) => t.status === 'running'),
        }));
      },
    }),
    {
      name: 'gbp-audit-storage',
      // 특정 필드만 저장 (로딩 상태 등은 제외)
      partialize: (state) => ({
        currentBusinessId: state.currentBusinessId,
        cachedAudits: state.cachedAudits,
        placeId: state.placeId,
        business: state.business,
        basicScore: state.basicScore,
        reviewData: state.reviewData,
        reviewFetchedAt: state.reviewFetchedAt,
        reviewDepth: state.reviewDepth,
        teleportResults: state.teleportResults,
        teleportKeyword: state.teleportKeyword,
        scrapedData: state.scrapedData,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[AuditStore] Hydrated from localStorage', {
            currentBusinessId: state.currentBusinessId,
            cachedAuditsKeys: Object.keys(state.cachedAudits || {}),
          });
        }
        // hydration 완료 후 상태 업데이트
        useAuditStore.setState({ _hasHydrated: true });
      },
    }
  )
);

// Hydration 완료 대기 함수
export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    // 이미 hydration이 완료되었으면 바로 resolve
    if (useAuditStore.getState()._hasHydrated) {
      console.log('[AuditStore] Already hydrated');
      resolve();
      return;
    }

    console.log('[AuditStore] Waiting for hydration...');
    const unsubscribe = useAuditStore.subscribe((state) => {
      if (state._hasHydrated) {
        console.log('[AuditStore] Hydration detected');
        unsubscribe();
        resolve();
      }
    });

    // 타임아웃 (최대 2초) - hydration이 실패해도 계속 진행
    setTimeout(() => {
      console.log('[AuditStore] Hydration timeout');
      unsubscribe();
      useAuditStore.setState({ _hasHydrated: true });
      resolve();
    }, 2000);
  });
};
