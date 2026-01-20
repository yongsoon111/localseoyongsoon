'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AddBusinessModal } from '@/components/AddBusinessModal';
import { SavedBusiness, AuditHistoryItem } from '@/types';
import { Search, Plus, TrendingUp, TrendingDown, Minus, ChevronRight, LayoutDashboard, Trash2, Loader2 } from 'lucide-react';

// 트렌드 계산 함수
const getTrend = (business: SavedBusiness): 'up' | 'down' | 'stable' => {
  const latestScore = business.latest_audit?.total_score;
  if (!latestScore) return 'stable';
  // 단순화: 80 이상이면 up, 60 미만이면 down
  if (latestScore >= 80) return 'up';
  if (latestScore < 60) return 'down';
  return 'stable';
};

// 등급 계산
const getGrade = (score: number | null | undefined): string => {
  if (!score) return '-';
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/businesses');
      const data = await res.json();

      if (data.error && data.error.includes('schema cache')) {
        setBusinesses([]);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setBusinesses(data.businesses || []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusiness = async (business: SavedBusiness) => {
    // 비즈니스를 목록에 추가하고 모달 닫기
    setBusinesses(prev => [business, ...prev]);
    setShowAddModal(false);

    // 진단 시작 (로딩 상태 표시)
    setAuditingIds(prev => new Set(prev).add(business.id));

    try {
      // 1. DataForSEO로 비즈니스 정보 조회 및 점수 계산
      const auditRes = await fetch(`/api/audit?keyword=${encodeURIComponent(business.name)}`);
      const auditData = await auditRes.json();

      if (auditData.error) {
        console.error('진단 오류:', auditData.error);
        return;
      }

      // 2. 진단 결과 저장
      const saveRes = await fetch(`/api/businesses/${business.id}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicScore: auditData.score,
          totalScore: auditData.score,
          auditData: {
            business: auditData.business,
          },
        }),
      });

      const saveData = await saveRes.json();
      if (saveData.error) {
        console.error('저장 오류:', saveData.error);
        return;
      }

      // 3. 비즈니스 목록 업데이트 (점수 반영)
      setBusinesses(prev => prev.map(b =>
        b.id === business.id
          ? { ...b, latest_audit: { ...b.latest_audit, total_score: auditData.score, basic_score: auditData.score } as AuditHistoryItem }
          : b
      ));
    } catch (err) {
      console.error('진단 실행 오류:', err);
    } finally {
      // 로딩 상태 제거
      setAuditingIds(prev => {
        const next = new Set(prev);
        next.delete(business.id);
        return next;
      });
    }
  };

  const handleDeleteBusiness = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('정말 이 비즈니스를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/businesses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBusinesses(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다');
    }
  };

  const filteredBusinesses = businesses.filter(biz =>
    biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    biz.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 네비게이션 바 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">내 사업장 대시보드</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="가게 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              신규 등록
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <span className="text-xs text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">가게 목록</h2>
          <p className="text-slate-500 mt-1">현재 관리 중인 {businesses.length}개의 비즈니스 프로필 점수 추이입니다.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 p-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 비즈니스가 없습니다'}
            </h3>
            <p className="text-slate-500 mb-8">
              {searchQuery ? '다른 검색어로 시도해보세요' : '첫 번째 비즈니스를 추가하여 프로필 진단을 시작하세요'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
              >
                비즈니스 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-8 py-5">가게 정보</th>
                    <th className="px-8 py-5">현재 점수</th>
                    <th className="px-8 py-5 hidden lg:table-cell">히스토리 트래킹</th>
                    <th className="px-8 py-5">등급</th>
                    <th className="px-8 py-5 text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBusinesses.map((biz) => {
                    const score = biz.latest_audit?.total_score;
                    const trend = getTrend(biz);
                    const grade = getGrade(score);
                    const isAuditing = auditingIds.has(biz.id);

                    return (
                      <tr
                        key={biz.id}
                        onClick={() => router.push(`/dashboard/${biz.id}`)}
                        className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div>
                            <div className="font-bold text-slate-900 text-base line-clamp-1">{biz.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {biz.category || '미분류'} • {biz.address || '주소 없음'}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {isAuditing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                              <span className="text-sm text-slate-500">진단 중...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    (score || 0) >= 80 ? 'bg-blue-500' : (score || 0) >= 60 ? 'bg-green-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${score || 0}%` }}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-lg tabular-nums leading-none">
                                  {score ?? '-'}
                                </span>
                                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'
                                }`}>
                                  {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {trend === 'up' ? '상승' : trend === 'down' ? '하락' : '유지'}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 hidden lg:table-cell">
                          <span className="text-slate-600 font-medium">
                            {isAuditing ? '-' : (score ? `${score}점` : '-')}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAuditing ? 'bg-slate-100 text-slate-400' :
                            grade === 'A+' ? 'bg-blue-100 text-blue-700' :
                            grade === 'A' ? 'bg-green-100 text-green-700' :
                            grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {isAuditing ? '...' : grade}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleDeleteBusiness(e, biz.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          © 2024 GBP Audit Pro. All rights reserved.
        </div>
      </footer>

      {showAddModal && (
        <AddBusinessModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddBusiness}
        />
      )}
    </div>
  );
}
