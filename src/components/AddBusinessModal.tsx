'use client';

import { useState } from 'react';
import { SavedBusiness, BusinessInfo } from '@/types';
import { Plus, X, Link as LinkIcon, AlertCircle, Loader2, MapPin, Star, MessageSquare } from 'lucide-react';

interface AddBusinessModalProps {
  onClose: () => void;
  onAdd: (business: SavedBusiness) => void;
}

export function AddBusinessModal({ onClose, onAdd }: AddBusinessModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  const extractSearchKeyword = (inputUrl: string): string => {
    const trimmed = inputUrl.trim();

    if (trimmed.startsWith('ChIJ')) {
      return trimmed;
    }

    if (!trimmed.startsWith('http')) {
      return trimmed;
    }

    const placeMatch = trimmed.match(/place\/([^/@?]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    const searchMatch = trimmed.match(/search\/([^/@?]+)/);
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    }

    const qMatch = trimmed.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      return decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    }

    return trimmed;
  };

  const handleSearch = async () => {
    if (!url.trim()) {
      setError('Google Maps URL 또는 비즈니스명을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const keyword = extractSearchKeyword(url);

      const res = await fetch(`/api/audit?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBusinessInfo(data.business);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!businessInfo) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: businessInfo.placeId,
          name: businessInfo.name,
          category: businessInfo.category,
          address: businessInfo.address,
          phone: businessInfo.phone,
          website: businessInfo.website,
          rating: businessInfo.rating,
          reviewCount: businessInfo.reviewCount,
          photoCount: businessInfo.photos,
          location: businessInfo.location,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStep('success');
      setTimeout(() => {
        onAdd(data.business);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">가게 신규 등록</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'input' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  구글맵 URL 또는 비즈니스명 입력
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="https://www.google.com/maps/place/... 또는 비즈니스명"
                    disabled={loading}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  <p className="font-bold mb-1">데이터 자동 추출</p>
                  입력하신 정보에서 가게 이름, 카테고리, 주소, 리뷰 정보를 자동으로 수집하여 프로필 진단을 시작합니다.
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading || !url.trim()}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? '검색 중...' : '검색'}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && businessInfo && (
            <div className="space-y-6">
              {/* Business Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">{businessInfo.name}</h4>
                {businessInfo.category && (
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3">
                    {businessInfo.category}
                  </span>
                )}
                <div className="space-y-2 text-sm">
                  {businessInfo.address && (
                    <p className="text-slate-500 flex items-start gap-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      {businessInfo.address}
                    </p>
                  )}
                  <div className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      {businessInfo.rating?.toFixed(1) || '-'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <MessageSquare className="w-4 h-4" />
                      리뷰 {businessInfo.reviewCount || 0}개
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('input');
                    setBusinessInfo(null);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                >
                  다시 검색
                </button>
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    '이 비즈니스 추가'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-300">
                <MapPin className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">가게 등록 완료!</h4>
                <p className="text-sm text-slate-500 mt-2">
                  성공적으로 가게 정보를 가져왔습니다.<br />대시보드에서 실시간 진단 결과를 확인하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
