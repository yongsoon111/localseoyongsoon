import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 사용자의 비즈니스 목록 조회
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 먼저 비즈니스 목록만 조회 (audit_history 테이블이 없어도 동작)
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // 테이블이 없는 경우 빈 배열 반환
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      return NextResponse.json({ businesses: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // audit_history 테이블이 있으면 최신 감사 결과 조회 시도
  let businessesWithLatestAudit = businesses?.map(business => ({
    ...business,
    latest_audit: null,
  })) || [];

  try {
    for (const business of businessesWithLatestAudit) {
      const { data: audits } = await supabase
        .from('audit_history')
        .select('id, basic_score, review_score, total_score, response_rate, avg_rating, created_at')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (audits && audits.length > 0) {
        business.latest_audit = audits[0];
      }
    }
  } catch {
    // audit_history 테이블이 없으면 무시
  }

  return NextResponse.json({ businesses: businessesWithLatestAudit });
}

// POST: 새 비즈니스 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const { placeId, name, category, address, phone, website, rating, reviewCount, photoCount, location } = body;

  if (!placeId || !name) {
    return NextResponse.json({ error: 'placeId와 name은 필수입니다' }, { status: 400 });
  }

  // 이미 등록된 비즈니스인지 확인
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .eq('place_id', placeId)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 등록된 비즈니스입니다' }, { status: 409 });
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      place_id: placeId,
      name,
      category,
      address,
      phone,
      website,
      rating,
      review_count: reviewCount || 0,
      photo_count: photoCount || 0,
      location_lat: location?.lat,
      location_lng: location?.lng,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business });
}

// DELETE: 비즈니스 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 });
  }

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
