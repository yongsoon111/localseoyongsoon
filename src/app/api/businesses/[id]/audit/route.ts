import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 감사 결과 저장
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 비즈니스 소유권 확인
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: '비즈니스를 찾을 수 없습니다' }, { status: 404 });
  }

  const body = await request.json();
  const { basicScore, reviewScore, totalScore, responseRate, avgRating, ratingDistribution, keywords, auditData, reviewData, teleportResults, teleportKeyword, scrapedData } = body;

  // audit_data에 모든 진단 결과 통합 저장
  const fullAuditData = {
    ...auditData,
    reviewData: reviewData || null,
    teleportResults: teleportResults || [],
    teleportKeyword: teleportKeyword || '',
    scrapedData: scrapedData || null,
  };

  const { data: audit, error } = await supabase
    .from('audit_history')
    .insert({
      business_id: businessId,
      basic_score: basicScore,
      review_score: reviewScore,
      total_score: totalScore,
      response_rate: responseRate,
      avg_rating: avgRating,
      rating_distribution: ratingDistribution,
      keywords,
      audit_data: fullAuditData,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 비즈니스 정보 업데이트 (최신 rating, review_count 등)
  if (auditData?.business) {
    await supabase
      .from('businesses')
      .update({
        rating: auditData.business.rating,
        review_count: auditData.business.reviewCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);
  }

  return NextResponse.json({ audit });
}

// PATCH: 최신 감사 결과 업데이트 (리뷰, 텔레포트 등 추가 데이터)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 비즈니스 소유권 확인
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: '비즈니스를 찾을 수 없습니다' }, { status: 404 });
  }

  const body = await request.json();
  const { reviewData, teleportResults, teleportKeyword, scrapedData } = body;

  console.log('[PATCH Audit] Request for business:', businessId, {
    hasReviewData: !!reviewData,
    hasTeleportResults: !!teleportResults,
    hasScrapedData: !!scrapedData,
  });

  // 최신 감사 기록 가져오기
  const { data: latestAudits, error: fetchError } = await supabase
    .from('audit_history')
    .select('id, audit_data')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('[PATCH Audit] Error fetching latest audit:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!latestAudits || latestAudits.length === 0) {
    console.log('[PATCH Audit] No audit record found, creating new one');
    // 기존 기록이 없으면 새로 생성
    const newAuditData = {
      ...(reviewData && { reviewData }),
      ...(teleportResults && { teleportResults, teleportKeyword }),
      ...(scrapedData && { scrapedData }),
    };

    const { data: newAudit, error: insertError } = await supabase
      .from('audit_history')
      .insert({
        business_id: businessId,
        audit_data: newAuditData,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PATCH Audit] Error creating new audit:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ audit: newAudit });
  }

  const latestAudit = latestAudits[0];

  // 기존 audit_data에 새 데이터 병합
  const updatedAuditData = {
    ...(latestAudit.audit_data || {}),
    ...(reviewData && { reviewData }),
    ...(teleportResults && { teleportResults, teleportKeyword }),
    ...(scrapedData && { scrapedData }),
  };

  const { data: audit, error } = await supabase
    .from('audit_history')
    .update({ audit_data: updatedAuditData })
    .eq('id', latestAudit.id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH Audit] Error updating audit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[PATCH Audit] Successfully updated audit:', latestAudit.id);
  return NextResponse.json({ audit });
}

// GET: 감사 히스토리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 비즈니스 소유권 확인
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: '비즈니스를 찾을 수 없습니다' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  const { data: history, error } = await supabase
    .from('audit_history')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Audit History] Error fetching history:', error);
    // 테이블이 없는 경우 빈 배열 반환
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('[Audit History] Table does not exist, returning empty array');
      return NextResponse.json({ history: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Audit History] Found ${history?.length || 0} records for business ${businessId}`);
  return NextResponse.json({ history: history || [] });
}
