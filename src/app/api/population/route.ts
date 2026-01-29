// src/app/api/population/route.ts
// 서울시 생활인구(유동인구) API

import { NextRequest, NextResponse } from 'next/server';

const SEOUL_API_KEY = process.env.SEOUL_OPENAPI_KEY;

// 서울시 구별 행정동 코드 매핑 (주요 행정동만 포함)
const DISTRICT_CODES: Record<string, { name: string; code: string }[]> = {
  '강남구': [
    { name: '신사동', code: '1168053000' },
    { name: '논현1동', code: '1168054000' },
    { name: '논현2동', code: '1168055000' },
    { name: '압구정동', code: '1168056000' },
    { name: '청담동', code: '1168057000' },
    { name: '삼성1동', code: '1168058000' },
    { name: '삼성2동', code: '1168059000' },
    { name: '대치1동', code: '1168060000' },
    { name: '대치2동', code: '1168061500' },
    { name: '대치4동', code: '1168063000' },
    { name: '역삼1동', code: '1168064000' },
    { name: '역삼2동', code: '1168065000' },
    { name: '도곡1동', code: '1168066000' },
    { name: '도곡2동', code: '1168067000' },
    { name: '개포1동', code: '1168068000' },
    { name: '개포2동', code: '1168069000' },
    { name: '개포4동', code: '1168071000' },
    { name: '일원본동', code: '1168072000' },
    { name: '일원1동', code: '1168073000' },
    { name: '수서동', code: '1168074000' },
    { name: '세곡동', code: '1168075000' },
  ],
  '서초구': [
    { name: '서초1동', code: '1165051000' },
    { name: '서초2동', code: '1165052000' },
    { name: '서초3동', code: '1165053000' },
    { name: '서초4동', code: '1165054000' },
    { name: '잠원동', code: '1165055000' },
    { name: '반포본동', code: '1165056000' },
    { name: '반포1동', code: '1165057000' },
    { name: '반포2동', code: '1165058000' },
    { name: '반포3동', code: '1165059000' },
    { name: '반포4동', code: '1165060000' },
    { name: '방배본동', code: '1165061000' },
    { name: '방배1동', code: '1165062000' },
    { name: '방배2동', code: '1165063000' },
    { name: '방배3동', code: '1165064000' },
    { name: '방배4동', code: '1165065000' },
    { name: '양재1동', code: '1165068000' },
    { name: '양재2동', code: '1165069000' },
    { name: '내곡동', code: '1165070000' },
  ],
  '송파구': [
    { name: '풍납1동', code: '1171051000' },
    { name: '풍납2동', code: '1171052000' },
    { name: '거여1동', code: '1171053000' },
    { name: '거여2동', code: '1171054000' },
    { name: '마천1동', code: '1171055000' },
    { name: '마천2동', code: '1171056000' },
    { name: '방이1동', code: '1171057000' },
    { name: '방이2동', code: '1171058000' },
    { name: '오륜동', code: '1171059000' },
    { name: '오금동', code: '1171060000' },
    { name: '송파1동', code: '1171061000' },
    { name: '송파2동', code: '1171062000' },
    { name: '석촌동', code: '1171063000' },
    { name: '삼전동', code: '1171064000' },
    { name: '가락본동', code: '1171065000' },
    { name: '가락1동', code: '1171066000' },
    { name: '가락2동', code: '1171067000' },
    { name: '문정1동', code: '1171068000' },
    { name: '문정2동', code: '1171069000' },
    { name: '장지동', code: '1171070000' },
    { name: '위례동', code: '1171071000' },
    { name: '잠실본동', code: '1171072000' },
    { name: '잠실2동', code: '1171073000' },
    { name: '잠실3동', code: '1171074000' },
    { name: '잠실4동', code: '1171075000' },
    { name: '잠실6동', code: '1171076000' },
    { name: '잠실7동', code: '1171077000' },
  ],
  '마포구': [
    { name: '공덕동', code: '1144051000' },
    { name: '아현동', code: '1144052000' },
    { name: '도화동', code: '1144053000' },
    { name: '용강동', code: '1144054000' },
    { name: '대흥동', code: '1144055000' },
    { name: '염리동', code: '1144056000' },
    { name: '신수동', code: '1144057000' },
    { name: '서강동', code: '1144058000' },
    { name: '서교동', code: '1144059000' },
    { name: '합정동', code: '1144060000' },
    { name: '망원1동', code: '1144061000' },
    { name: '망원2동', code: '1144062000' },
    { name: '연남동', code: '1144063000' },
    { name: '성산1동', code: '1144064000' },
    { name: '성산2동', code: '1144065000' },
    { name: '상암동', code: '1144066000' },
  ],
  '종로구': [
    { name: '청운효자동', code: '1111051500' },
    { name: '사직동', code: '1111053000' },
    { name: '삼청동', code: '1111054000' },
    { name: '부암동', code: '1111055000' },
    { name: '평창동', code: '1111056000' },
    { name: '무악동', code: '1111057000' },
    { name: '교남동', code: '1111058000' },
    { name: '가회동', code: '1111059000' },
    { name: '종로1.2.3.4가동', code: '1111060000' },
    { name: '종로5.6가동', code: '1111061000' },
    { name: '이화동', code: '1111062000' },
    { name: '혜화동', code: '1111063000' },
    { name: '창신1동', code: '1111064000' },
    { name: '창신2동', code: '1111065000' },
    { name: '창신3동', code: '1111066000' },
    { name: '숭인1동', code: '1111067000' },
    { name: '숭인2동', code: '1111068000' },
  ],
  '중구': [
    { name: '소공동', code: '1114051000' },
    { name: '회현동', code: '1114052000' },
    { name: '명동', code: '1114053000' },
    { name: '필동', code: '1114054000' },
    { name: '장충동', code: '1114055000' },
    { name: '광희동', code: '1114056000' },
    { name: '을지로동', code: '1114057000' },
    { name: '신당동', code: '1114058000' },
    { name: '다산동', code: '1114059000' },
    { name: '약수동', code: '1114060000' },
    { name: '청구동', code: '1114061000' },
    { name: '동화동', code: '1114062000' },
    { name: '황학동', code: '1114063000' },
    { name: '중림동', code: '1114064000' },
  ],
};

// 8자리 코드로 변환 (API는 8자리 사용)
function to8DigitCode(code10: string): string {
  return code10.slice(0, 8);
}

interface PopulationData {
  date: string;
  hour: string;
  dongCode: string;
  dongName: string;
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  ageGroups: {
    label: string;
    male: number;
    female: number;
    total: number;
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const { district, dong, dongCode, date, hour } = await req.json();

    if (!SEOUL_API_KEY) {
      return NextResponse.json({ error: '서울시 API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    // 구 목록 반환
    if (!district && !dong && !dongCode) {
      return NextResponse.json({
        districts: Object.keys(DISTRICT_CODES),
      });
    }

    // 해당 구의 동 목록 반환
    if (district && !dong && !dongCode) {
      const dongs = DISTRICT_CODES[district];
      if (!dongs) {
        return NextResponse.json({ error: '해당 구의 데이터가 없습니다' }, { status: 404 });
      }
      return NextResponse.json({
        district,
        dongs: dongs.map(d => d.name),
      });
    }

    // dongCode가 직접 제공된 경우 (좌표 기반 조회)
    let dongCode8: string;
    let dongName: string;

    if (dongCode) {
      // dongCode는 8자리 코드
      dongCode8 = dongCode;
      dongName = dong || '행정동';
    } else {
      // 기존 방식: district + dong으로 조회
      const dongs = DISTRICT_CODES[district];
      if (!dongs) {
        return NextResponse.json({ error: '해당 구의 데이터가 없습니다' }, { status: 404 });
      }

      const dongInfo = dongs.find(d => d.name === dong);
      if (!dongInfo) {
        return NextResponse.json({ error: '해당 동의 데이터가 없습니다' }, { status: 404 });
      }

      dongCode8 = to8DigitCode(dongInfo.code);
      dongName = dong;
    }

    // 날짜 기본값: 5일 전 (서울시 API는 5일 전 데이터까지 제공)
    const targetDate = date || getDefaultDate();
    const targetHour = hour || '12'; // 기본 12시

    // API 호출 (특정 동, 특정 날짜, 특정 시간대)
    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SPOP_LOCAL_RESD_DONG/1/1000/${targetDate}/${targetHour}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.RESULT?.CODE === 'INFO-200') {
      return NextResponse.json({ error: '해당 날짜/시간의 데이터가 없습니다' }, { status: 404 });
    }

    if (!data.SPOP_LOCAL_RESD_DONG?.row) {
      return NextResponse.json({ error: 'API 응답 오류' }, { status: 500 });
    }

    // 해당 동 데이터 필터링
    const rows = data.SPOP_LOCAL_RESD_DONG.row;
    const dongData = rows.find((r: any) => r.ADSTRD_CODE_SE === dongCode8);

    if (!dongData) {
      return NextResponse.json({ error: '해당 동의 유동인구 데이터가 없습니다' }, { status: 404 });
    }

    // 연령대별 데이터 파싱
    const ageGroups = [
      { label: '0-9세', maleKey: 'MALE_F0T9_LVPOP_CO', femaleKey: 'FEMALE_F0T9_LVPOP_CO' },
      { label: '10-14세', maleKey: 'MALE_F10T14_LVPOP_CO', femaleKey: 'FEMALE_F10T14_LVPOP_CO' },
      { label: '15-19세', maleKey: 'MALE_F15T19_LVPOP_CO', femaleKey: 'FEMALE_F15T19_LVPOP_CO' },
      { label: '20-24세', maleKey: 'MALE_F20T24_LVPOP_CO', femaleKey: 'FEMALE_F20T24_LVPOP_CO' },
      { label: '25-29세', maleKey: 'MALE_F25T29_LVPOP_CO', femaleKey: 'FEMALE_F25T29_LVPOP_CO' },
      { label: '30-34세', maleKey: 'MALE_F30T34_LVPOP_CO', femaleKey: 'FEMALE_F30T34_LVPOP_CO' },
      { label: '35-39세', maleKey: 'MALE_F35T39_LVPOP_CO', femaleKey: 'FEMALE_F35T39_LVPOP_CO' },
      { label: '40-44세', maleKey: 'MALE_F40T44_LVPOP_CO', femaleKey: 'FEMALE_F40T44_LVPOP_CO' },
      { label: '45-49세', maleKey: 'MALE_F45T49_LVPOP_CO', femaleKey: 'FEMALE_F45T49_LVPOP_CO' },
      { label: '50-54세', maleKey: 'MALE_F50T54_LVPOP_CO', femaleKey: 'FEMALE_F50T54_LVPOP_CO' },
      { label: '55-59세', maleKey: 'MALE_F55T59_LVPOP_CO', femaleKey: 'FEMALE_F55T59_LVPOP_CO' },
      { label: '60-64세', maleKey: 'MALE_F60T64_LVPOP_CO', femaleKey: 'FEMALE_F60T64_LVPOP_CO' },
      { label: '65-69세', maleKey: 'MALE_F65T69_LVPOP_CO', femaleKey: 'FEMALE_F65T69_LVPOP_CO' },
      { label: '70세 이상', maleKey: 'MALE_F70T74_LVPOP_CO', femaleKey: 'FEMALE_F70T74_LVPOP_CO' },
    ];

    const parsedAgeGroups = ageGroups.map(ag => {
      const male = parseFloat(dongData[ag.maleKey]) || 0;
      const female = parseFloat(dongData[ag.femaleKey]) || 0;
      return {
        label: ag.label,
        male: Math.round(male),
        female: Math.round(female),
        total: Math.round(male + female),
      };
    });

    const maleTotal = parsedAgeGroups.reduce((sum, ag) => sum + ag.male, 0);
    const femaleTotal = parsedAgeGroups.reduce((sum, ag) => sum + ag.female, 0);

    const result: PopulationData = {
      date: dongData.STDR_DE_ID,
      hour: dongData.TMZON_PD_SE,
      dongCode: dongData.ADSTRD_CODE_SE,
      dongName: dongName,
      totalPopulation: Math.round(parseFloat(dongData.TOT_LVPOP_CO) || 0),
      malePopulation: maleTotal,
      femalePopulation: femaleTotal,
      ageGroups: parsedAgeGroups,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Population API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '유동인구 조회 실패' },
      { status: 500 }
    );
  }
}

// 시간대별 유동인구 조회 (하루 전체)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get('district');
    const dong = searchParams.get('dong');
    const dongCodeParam = searchParams.get('dongCode');
    const date = searchParams.get('date') || getDefaultDate();

    if (!SEOUL_API_KEY) {
      return NextResponse.json({ error: '서울시 API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    let dongCode8: string;

    if (dongCodeParam) {
      // dongCode가 직접 제공된 경우
      dongCode8 = dongCodeParam;
    } else {
      // 기존 방식: district + dong으로 조회
      if (!district || !dong) {
        return NextResponse.json({ error: '구와 동을 지정해주세요' }, { status: 400 });
      }

      const dongs = DISTRICT_CODES[district];
      if (!dongs) {
        return NextResponse.json({ error: '해당 구의 데이터가 없습니다' }, { status: 404 });
      }

      const dongInfo = dongs.find(d => d.name === dong);
      if (!dongInfo) {
        return NextResponse.json({ error: '해당 동의 데이터가 없습니다' }, { status: 404 });
      }

      dongCode8 = to8DigitCode(dongInfo.code);
    }

    // 하루 전체 데이터 조회 (24시간)
    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SPOP_LOCAL_RESD_DONG/1/1000/${date}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.SPOP_LOCAL_RESD_DONG?.row) {
      return NextResponse.json({ error: 'API 응답 오류' }, { status: 500 });
    }

    // 해당 동 데이터만 필터링
    const rows = data.SPOP_LOCAL_RESD_DONG.row;
    const dongRows = rows.filter((r: any) => r.ADSTRD_CODE_SE === dongCode8);

    // 시간대별 총 인구 추출
    const hourlyData = dongRows.map((r: any) => ({
      hour: parseInt(r.TMZON_PD_SE),
      population: Math.round(parseFloat(r.TOT_LVPOP_CO) || 0),
    })).sort((a: any, b: any) => a.hour - b.hour);

    return NextResponse.json({
      district,
      dong,
      date,
      hourlyData,
      peakHour: hourlyData.reduce((max: any, curr: any) =>
        curr.population > max.population ? curr : max, hourlyData[0]),
    });
  } catch (error) {
    console.error('[Population API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '유동인구 조회 실패' },
      { status: 500 }
    );
  }
}

function getDefaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 5); // 5일 전
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
