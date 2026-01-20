// src/lib/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GBPAuditData {
  business: {
    name: string;
    category: string;
    address: string;
    phone: string;
    website: string;
    rating: number;
    reviewCount: number;
    photos: number;
    openingHours?: string[];
    attributes?: { key: string; value: string | boolean }[];
    description?: string;
  };
  reviews?: {
    total: number;
    avgRating: number;
    responseRate: number;
    ratingDistribution: { [key: string]: number };
    keywords?: string[];
    recentReviews?: {
      rating: number;
      text: string;
      time: string;
      ownerResponse?: string;
    }[];
  };
  teleportData?: {
    keyword: string;
    avgRank: number;
    bestRank: number;
    worstRank: number;
    inLocalPack: boolean;
  }[];
  isTargetingForeigners?: boolean;
}

const SYSTEM_PROMPT = `당신은 '주식회사 스트라디지' 소속의 GMB 및 로컬 SEO 전략 컨설턴트입니다.

## 핵심 원칙
- Role: '주식회사 스트라디지' 소속의 GMB 및 로컬 SEO 전략 컨설턴트
- Tone & Manner: 감성적인 비유(그물, 낚싯대, 심장 등)와 과장된 수식어를 철저히 배제함. 데이터와 현상에 입각하여 담백하고 냉철하게 진단함
- Sentence Style: "~함", "~임", "~해야 합니다"와 같이 전문적이고 명확한 종결어미 사용. 번역투 문장(~이지만 ~입니다 등) 사용 금지
- Objective: 클라이언트가 자신의 프로필이 가진 구조적 결함과 매출 손실 요인을 명확히 인지하게 함

## 업종별 속성(Attributes) 체크리스트

### 음식점/바 기준
1. 서비스 옵션: 매장 내 식사, 포장 가능, 배달 가능, 드라이브스루, 비대면 배달, 야외 좌석, 커브사이드 픽업
2. 하이라이트: 기업 정체성(여성/성소수자/흑인/참전용사 소유), 라이브 음악, 스포츠 경기 관람, 루프탑 좌석, 벽난로
3. 접근성: 휠체어 이용 가능(입구, 화장실, 좌석, 주차장, 엘리베이터)
4. 편의시설: Wi-Fi(유/무료), 화장실, 유아용 하이체어, 바(Bar) 있음, 성중립 화장실
5. 식사 옵션 및 메뉴: 식사 시간(아침, 점심, 저녁, 브런치, 디저트), 특수 식단(채식, 비건, 할랄, 글루텐 프리, 유기농), 주류(맥주, 와인, 칵테일, 독주, 해피아워), 뷔페, 키즈 메뉴, 커피, 간단한 식사
6. 분위기 및 고객층: 분위기(아늑함, 캐주얼함, 로맨틱함, 세련됨), 고객층(가족, 단체, 대학생 인기, 성소수자 친화)
7. 예약 및 계획: 예약 가능, 예약 필수, 단체 예약 권장, 현장 대기 명단
8. 결제: 신용카드, 체크카드, 모바일 결제(NFC, 삼성페이 등), 현금 전용 여부

### 병원/의료기관 기준
1. 서비스 옵션: 온라인 진료(원격), 현장 서비스(직접 방문)
2. 접근성: 휠체어 이용 가능(입구, 화장실, 주차장, 엘리베이터, 좌석)
3. 편의시설: 성중립 화장실, Wi-Fi(유/무료), 화장실
4. 건강 및 안전: 예약 필수, 마스크 착용(직원/방문객), 체온 측정 필수, 진료실 및 대기실 표면 소독 시행
5. 고객층 및 하이라이트: 성소수자 친화적, 트랜스젠더 세이프 스페이스, 기업 정체성(여성/참전용사 소유 등)
6. 계획 및 예약: 새 환자 수용 가능 여부, 예약 필수 여부
7. 결제 방법: 신용카드, 모바일 결제(애플페이, 삼성페이, NFC), 체크카드, 현금 전용 여부

## 진단 우선순위
- 누락된 필수 속성과 설정 안된 항목을 최우선으로 강조
- 작업이 안된 부분을 적극적으로 지적하고 시급성 전달
- 완료된 항목보다 미완료 항목에 더 많은 분량 할애

## 출력 형식
반드시 마크다운 형식으로 아래 구조를 따라 작성하세요.`;

const REPORT_TEMPLATE = `
## 📊 Google Business Profile 심층 진단 보고서

**Target Business:** {비즈니스 이름}
**Date:** {날짜}
**Auditor:** 주식회사 스트라디지 대표 정영훈

---

### 🚨 진단 요약

**"{핵심 문제점을 한 줄로 요약하는 직설적 헤드라인}"**

{현재 프로필 상태가 타겟 고객에게 주는 부정적 영향과 이로 인한 실질적 노출 저하/매출 손실 위험을 3~4줄로 서술}

---

### 1. 기초 정보 세팅

| 항목 | 상태 | 진단 및 핵심 문제점 |
|------|------|------|
| 비즈니스 이름 | ✅/⚠️/❌ | 국문/영문 상호 최적화 및 검색 대응력 진단 |
| 카테고리 최적화 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>현재 카테고리: {카테고리명}<br><br>• 문제점: {검색어와 카테고리 불일치 등 설명}<br><br>• 긴급 수정: {추천 카테고리 2~3개 및 방향} |
| 프로필 속성 세팅 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>{해당 업종 필수 속성 중 누락된 데이터 구체적 나열} |
| 연락처 정보 | ✅/⚠️/❌ | 전화번호, 웹사이트, 주소 설정 여부 |
| 영업시간 | ✅/⚠️/❌ | 영업시간 설정 완료 여부 및 정확성 |

### 2. 평판 및 키워드 분석

| 항목 | 상태 | 진단 및 핵심 문제점 |
|------|------|------|
| 상위노출 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>{Teleport 데이터 기반 주요 키워드 노출 순위 및 로컬 팩 진입 실패 원인 분석} |
| 평점 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>현재 평점과 경쟁사 대비 분석 |
| 리뷰 수 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>누적 리뷰 수 및 신뢰도 평가 |
| 리뷰 키워드 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>{리뷰 내 시술/메뉴명 등 유효 키워드 포함 여부 및 전환 기여도 진단} |
| 응답률 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>{리뷰 답글을 통한 SEO 키워드 주입 및 신뢰도 관리 부재 지적} |
| 외국인 구매의향 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>{영문 리뷰 양, 내용의 구체성, 글로벌 타겟팅 적합성 분석} |

### 3. 시각적 전환율

| 항목 | 상태 | 진단 및 핵심 문제점 |
|------|------|------|
| 사진 수 | ✅/⚠️/❌ | 업로드된 사진 수량 및 충분성 |
| 배경사진 | ✅/⚠️/❌ | 비즈니스 정체성 대변 여부 및 고화질 이미지 사용 진단 |
| 유저 콘텐츠 | ✅/⚠️/❌ | [{핵심 진단명}]<br><br>고객 업로드 사진의 양과 질이 신규 고객 신뢰도에 미치는 영향 분석 |

### 4. 알고리즘 신호

| 항목 | 상태 | 진단 및 핵심 문제점 |
|------|------|------|
| 주기적 업데이트 | ✅/⚠️/❌ | [{핵심 진단명}] 마지막 게시물: {날짜}<br><br>• {게시물 공백 기간에 따른 알고리즘 활성 지수 하락 및 노출 손실 위험 분석} |
| 업장 설명 | ✅/⚠️/❌ | 설명글 내 키워드 배치 및 예약/홈페이지 링크 정상 작동 여부 진단 |

---

### 🚨 총평 및 액션플랜

#### 📉 현재 상태 요약
**"{냉철한 현실 진단 한 줄 평}"**

{현재 상태 유지 시 발생할 트래픽 및 매출 손실에 대한 최종 경고}

#### 🔥 가장 시급한 3가지 실행 과제

1. **{과제 1 제목}**
   - {구체적인 실행 방안 및 기대 효과}

2. **{과제 2 제목}**
   - {구체적인 실행 방안 및 기대 효과}

3. **{과제 3 제목}**
   - {구체적인 실행 방안 및 기대 효과}
`;

// GBP 게시물 생성 파라미터
export interface GBPPostParams {
  businessName: string;
  category: string;
  keywords?: string[];
  tone?: 'professional' | 'friendly' | 'casual';
  postType?: 'update' | 'offer' | 'event' | 'product';
}

// 리뷰 답변 생성 파라미터
export interface ReviewReplyParams {
  reviewText: string;
  rating: number;
  businessName: string;
}

// GBP 게시물 생성
export async function generateGBPPost(params: GBPPostParams): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const { businessName, category, keywords = [], tone = 'professional', postType = 'update' } = params;

  const toneMap = {
    professional: '전문적이고 신뢰감 있는',
    friendly: '친근하고 따뜻한',
    casual: '캐주얼하고 가벼운',
  };

  const typeMap = {
    update: '비즈니스 소식/업데이트',
    offer: '할인/프로모션 안내',
    event: '이벤트 공지',
    product: '상품/서비스 소개',
  };

  const prompt = `당신은 Google Business Profile 마케팅 전문가입니다.
다음 정보를 바탕으로 GBP 게시물을 작성해주세요.

비즈니스명: ${businessName}
업종: ${category}
키워드: ${keywords.join(', ') || '없음'}
톤앤매너: ${toneMap[tone]}
게시물 유형: ${typeMap[postType]}

게시물 작성 가이드라인:
1. 1500자 이내로 작성
2. 핵심 키워드를 자연스럽게 포함
3. 명확한 CTA(행동 유도) 포함
4. 이모지 적절히 사용
5. 한국어로 작성

게시물 본문만 작성해주세요 (제목이나 설명 없이 본문만):`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 리뷰 답변 생성
export async function generateReviewReply(params: ReviewReplyParams): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const { reviewText, rating, businessName } = params;

  const prompt = `당신은 ${businessName}의 사장님입니다. 고객 리뷰에 답변을 작성해주세요.

고객 리뷰:
평점: ${rating}/5
내용: "${reviewText}"

답변 작성 가이드라인:
1. ${rating >= 4 ? '감사 인사로 시작' : rating >= 3 ? '피드백 감사 및 개선 의지 표현' : '진심 어린 사과와 개선 약속'}
2. 리뷰 내용을 구체적으로 언급하여 진정성 표현
3. 100-200자 정도로 간결하게
4. 재방문 유도
5. 정중하고 프로페셔널한 톤

답변 본문만 작성해주세요:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 리뷰 요약 생성
export async function generateReviewSummary(reviews: { rating: number; text: string }[]): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const reviewsText = reviews.map((r, i) => `${i + 1}. [${r.rating}점] ${r.text}`).join('\n');

  const prompt = `다음 고객 리뷰들을 분석하여 요약해주세요.

리뷰 목록:
${reviewsText}

다음 형식으로 요약해주세요:

## 전체 요약
(2-3문장으로 전체적인 고객 평가 요약)

## 긍정적 포인트
- (고객들이 칭찬한 주요 포인트들)

## 개선 필요 사항
- (고객들이 지적한 부분들)

## 핵심 키워드
(리뷰에서 자주 언급된 키워드 5개)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 새로운 V4 심층 진단 보고서 생성 (JSON 구조화된 응답)
export interface DiagnosticReportInput {
  author: string;
  rating: number;
  text: string;
  date: string;
  ownerResponse?: string;
}

export async function generateDiagnosticReport(
  businessName: string,
  checklist: { category: string; item: string; status: string; currentValue: string; diagnosis?: string }[],
  reviews: DiagnosticReportInput[],
  ranking: string = '순위 미확인'
): Promise<{
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
    topComplaints: Array<{
      category: string;
      count: number;
      percentage: string;
      quotes: string;
    }>;
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
}> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const today = new Date().toISOString().split('T')[0];

  const systemInstruction = `당신은 '주식회사 스트라디지' 소속의 GMB 및 로컬 SEO 전략 컨설턴트입니다.

Role: '주식회사 스트라디지' 소속의 GMB 및 로컬 SEO 전략 컨설턴트
Tone & Manner: 감성적인 비유 배제. 데이터에 입각한 담백하고 냉철한 진단.
Sentence Style: "~함", "~임", "~해야 합니다"와 같은 전문적인 명확한 종결어미 사용. 번역투 금지.
Objective: 구조적 결함과 매출 손실 요인을 명확히 인지하게 함.

[핵심 분석 항목]
1. 리뷰 트렌드: 최근 6개월간의 변화(리뷰수, 평점, 응답률)를 시계열로 분석.
2. 부정 리뷰 패턴: 낮은 평점 리뷰에서 반복되는 핵심 불만 키워드를 추출하여 빈도/비율 분석.
3. 로컬 SEO: 순위 데이터와 프로필 최적화 상태 대조.

반드시 JSON 형식으로만 응답하세요. 마크다운이나 다른 텍스트 없이 순수 JSON만 출력하세요.`;

  const prompt = `
비즈니스명: '${businessName}'

[분석 데이터셋]
1. GMB 데이터 (체크리스트): ${JSON.stringify(checklist.map(c => ({ cat: c.category, item: c.item, val: c.currentValue, status: c.status })))}
2. 리뷰 데이터 (평판): ${JSON.stringify(reviews.slice(0, 50).map(r => ({ r: r.rating, c: r.text?.slice(0, 200), d: r.date, hasReply: !!r.ownerResponse })))}
3. 순위 데이터: ${ranking}
4. 오늘 날짜: ${today}

위 데이터를 망라하여 [Google Business Profile 심층 진단 보고서 V4]를 작성하십시오.
특히 '리뷰 트렌드'와 '부정 리뷰 패턴'에 대한 심도 있는 분석을 포함해야 합니다.

다음 JSON 구조로 정확히 응답하세요:
{
  "auditor": "주식회사 스트라디지 대표 정영훈",
  "targetBusiness": "비즈니스명",
  "date": "YYYY-MM-DD",
  "summary": {
    "headline": "핵심 문제점을 한 줄로 요약하는 직설적 헤드라인",
    "impactDescription": "현재 프로필 상태가 타겟 고객에게 주는 부정적 영향 서술"
  },
  "reviewTrend": [
    {"period": "2024년 1월", "count": 숫자, "rating": 숫자, "responseRate": "퍼센트%"},
    ...최근 6개월 데이터
  ],
  "negativePatterns": {
    "totalNegativeReviews": 1-3점 리뷰 총 개수,
    "topComplaints": [
      {"category": "불만 유형", "count": 횟수, "percentage": "비율%", "quotes": "실제 리뷰 인용"},
      ...최대 5개
    ],
    "prioritizedImprovements": ["1순위: 개선사항", "2순위: 개선사항", "3순위: 개선사항"]
  },
  "sections": [
    {
      "title": "기초 정보 세팅",
      "items": [{"label": "항목명", "status": "SUCCESS/WARNING/ERROR", "diagnosis": "진단 내용"}, ...]
    },
    {"title": "평판 및 리뷰 분석", "items": [...]},
    {"title": "시각적 전환율", "items": [...]},
    {"title": "알고리즘 신호", "items": [...]}
  ],
  "finalAssessment": {
    "oneLineReview": "냉철한 현실 진단 한 줄 평",
    "warning": "현재 상태 유지 시 발생할 손실에 대한 최종 경고"
  },
  "actionPlan": [
    {"title": "과제 1 제목", "description": "구체적인 실행 방안 및 기대 효과"},
    {"title": "과제 2 제목", "description": "..."},
    {"title": "과제 3 제목", "description": "..."}
  ]
}`;

  try {
    const result = await model.generateContent([
      { text: systemInstruction },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // JSON 파싱 시도 (마크다운 코드 블록 제거)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error('Gemini Diagnostic Report Error:', error);
    // 기본 응답 반환
    return {
      auditor: '주식회사 스트라디지 대표 정영훈',
      targetBusiness: businessName,
      date: today,
      summary: {
        headline: 'AI 분석 중 오류가 발생했습니다',
        impactDescription: '잠시 후 다시 시도해주세요. 오류가 지속되면 관리자에게 문의하세요.',
      },
      reviewTrend: [],
      negativePatterns: {
        totalNegativeReviews: 0,
        topComplaints: [],
        prioritizedImprovements: [],
      },
      sections: [],
      finalAssessment: {
        oneLineReview: '분석 실패',
        warning: '다시 시도해주세요.',
      },
      actionPlan: [],
    };
  }
}

export async function generateGBPAuditReport(data: GBPAuditData): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const today = new Date().toISOString().split('T')[0];

  const userPrompt = `
다음 Google Business Profile 데이터를 분석하여 심층 진단 보고서를 작성해주세요.

## 비즈니스 기본 정보
- 비즈니스명: ${data.business.name}
- 카테고리: ${data.business.category}
- 주소: ${data.business.address}
- 전화: ${data.business.phone || '미등록'}
- 웹사이트: ${data.business.website || '미등록'}
- 평점: ${data.business.rating} / 5.0
- 리뷰 수: ${data.business.reviewCount}개
- 사진 수: ${data.business.photos}장
${data.business.description ? `- 업장 설명: ${data.business.description}` : '- 업장 설명: 미등록'}
${data.business.openingHours?.length ? `- 영업시간: ${data.business.openingHours.join(', ')}` : '- 영업시간: 미등록'}

## 등록된 속성
${data.business.attributes?.length ? data.business.attributes.map(a => `- ${a.key}: ${a.value}`).join('\n') : '등록된 속성 없음'}

## 리뷰 분석 데이터
${data.reviews ? `
- 총 리뷰 수: ${data.reviews.total}개
- 평균 평점: ${data.reviews.avgRating}
- 사장님 답글 응답률: ${data.reviews.responseRate}%
- 평점 분포: ${Object.entries(data.reviews.ratingDistribution).map(([k, v]) => `${k}점: ${v}개`).join(', ')}
${data.reviews.keywords?.length ? `- 주요 키워드: ${data.reviews.keywords.join(', ')}` : ''}
` : '리뷰 데이터 없음'}

## 텔레포트 순위 데이터
${data.teleportData?.length ? data.teleportData.map(t => `
- 키워드: "${t.keyword}"
  - 평균 순위: ${t.avgRank}위
  - 최고 순위: ${t.bestRank}위
  - 최저 순위: ${t.worstRank}위
  - 로컬팩 진입: ${t.inLocalPack ? '성공' : '실패'}
`).join('') : '텔레포트 데이터 없음'}

## 외국인 타겟 여부
${data.isTargetingForeigners ? '외국인 고객 타겟팅 중' : '내국인 고객 중심'}

---

오늘 날짜: ${today}

위 양식에 맞춰 전문적인 GBP 심층 진단 보고서를 작성하세요:
${REPORT_TEMPLATE}
`;

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('AI 분석 중 오류가 발생했습니다');
  }
}
