import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT: 감사 결과 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; auditId: string }> }
) {
  const { id: businessId, auditId } = await params;
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
  const { basicScore, reviewScore, totalScore, responseRate, avgRating, ratingDistribution, keywords, auditData } = body;

  const { data: audit, error } = await supabase
    .from('audit_history')
    .update({
      basic_score: basicScore,
      review_score: reviewScore,
      total_score: totalScore,
      response_rate: responseRate,
      avg_rating: avgRating,
      rating_distribution: ratingDistribution,
      keywords,
      audit_data: auditData,
    })
    .eq('id', auditId)
    .eq('business_id', businessId)
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
