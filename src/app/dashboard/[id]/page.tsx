'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditStore } from '@/stores/audit-store';
import { Header } from '@/components/Header';
import { AuditReport } from '@/components/AuditReport';
import { Button } from '@/components/ui/button';
import { SavedBusiness } from '@/types';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<SavedBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);  // 이미 로드한 비즈니스 ID 추적

  const {
    business: auditBusiness,
    basicScore,
    reviewData,
    loading: auditLoading,
    reviewLoading,
    setCurrentBusiness,
    fetchAudit,
    resetCurrent,
  } = useAuditStore();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // id가 변경되면 loadedRef 초기화
  useEffect(() => {
    if (loadedRef.current !== id) {
      console.log('[Dashboard] 새 비즈니스 ID 감지:', id, '(이전:', loadedRef.current, ')');
      loadedRef.current = null;  // 새 비즈니스이므로 초기화
    }
  }, [id]);

  // 비즈니스 로드 - 이미 로드한 경우 스킵
  useEffect(() => {
    if (!user || !id) {
      return;
    }

    // 이미 같은 비즈니스를 로드했으면 스킵 (탭 전환 시 중복 로드 방지)
    if (loadedRef.current === id) {
      console.log('[Dashboard] 이미 로드됨, 스킵:', id);
      return;
    }

    loadedRef.current = id;
    fetchBusinessDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);  // user 객체 대신 user.id 사용

  const fetchBusinessDetail = async () => {
    try {
      setLoading(true);
      console.log('[Dashboard] fetchBusinessDetail 시작');

      // 비즈니스 목록에서 해당 비즈니스 찾기
      const bizRes = await fetch('/api/businesses');
      const bizData = await bizRes.json();

      if (bizData.error) {
        throw new Error(bizData.error);
      }

      const found = bizData.businesses?.find((b: SavedBusiness) => b.id === id);
      if (!found) {
        throw new Error('비즈니스를 찾을 수 없습니다');
      }

      setBusiness(found);

      // 현재 비즈니스 설정
      setCurrentBusiness(id);

      // DB에서 최신 감사 기록 가져오기
      console.log('[Dashboard] DB에서 감사 기록 조회');
      const auditRes = await fetch(`/api/businesses/${id}/audit?limit=1`);
      const auditData = await auditRes.json();

      if (auditData.history && auditData.history.length > 0) {
        const latestAudit = auditData.history[0];
        console.log('[Dashboard] DB에서 감사 기록 로드:', latestAudit.id);
        console.log('[Dashboard] audit_data 내용:', {
          hasBusiness: !!latestAudit.audit_data?.business,
          hasReviewData: !!latestAudit.audit_data?.reviewData,
          auditData: latestAudit.audit_data,
        });

        // audit_data.business가 없으면 DB 기록이 불완전한 것이므로 새 진단 실행
        if (!latestAudit.audit_data?.business) {
          console.log('[Dashboard] audit_data.business가 없음 - 새 진단 실행');
          await fetchAudit(found.name);
          return;
        }

        // DB 데이터로 store 업데이트 (모든 필드 전달)
        const { loadAudit } = useAuditStore.getState();
        loadAudit({
          business: latestAudit.audit_data?.business,
          reviewData: latestAudit.audit_data?.reviewData,
          teleportResults: latestAudit.audit_data?.teleportResults,
          teleportKeyword: latestAudit.audit_data?.teleportKeyword,
          scrapedData: latestAudit.audit_data?.scrapedData,
        }, latestAudit.basic_score || latestAudit.total_score);
      } else {
        // DB에 기록이 없으면 새 진단 실행
        console.log('[Dashboard] DB에 기록 없음 - 새 진단 실행:', found.name);
        await fetchAudit(found.name);
      }
    } catch (err) {
      console.error('[Dashboard] 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    if (!business) return;
    resetCurrent();  // 현재 비즈니스 데이터만 초기화
    await fetchAudit(business.name);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackLink />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBackLink />

      <main className="container mx-auto px-4 py-8">
        {business && (
          <>
            {/* 감사 결과 */}
            {auditBusiness ? (
              <AuditReport
                business={auditBusiness}
                basicScore={basicScore}
                reviewData={reviewData}
                reviewLoading={reviewLoading}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>진단 데이터를 불러오는 중...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
