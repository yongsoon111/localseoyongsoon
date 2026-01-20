// src/lib/attribute-checklist.ts
// 업종별 필수/권장 속성 체크리스트

export interface IndustryChecklist {
  keywords: string[]; // 카테고리 매칭용 키워드
  required: AttributeItem[];
  recommended: AttributeItem[];
}

export interface AttributeItem {
  key: string;
  label: string;
  description: string;
}

// 음식점/바 체크리스트
const restaurantChecklist: IndustryChecklist = {
  keywords: ['음식점', '레스토랑', '식당', 'restaurant', '카페', 'cafe', '바', 'bar', '주점', '치킨', '피자', '한식', '중식', '일식', '양식'],
  required: [
    { key: 'dine_in', label: '매장 내 식사', description: '매장에서 식사 가능 여부' },
    { key: 'takeout', label: '포장 가능', description: '테이크아웃 가능 여부' },
    { key: 'delivery', label: '배달 가능', description: '배달 서비스 제공 여부' },
    { key: 'reservations', label: '예약 가능', description: '예약 가능 여부' },
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
    { key: 'restroom', label: '화장실', description: '화장실 이용 가능 여부' },
  ],
  recommended: [
    { key: 'outdoor_seating', label: '야외 좌석', description: '야외 테라스/좌석 유무' },
    { key: 'wifi', label: 'Wi-Fi', description: '무료 와이파이 제공 여부' },
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'serves_beer', label: '맥주 판매', description: '맥주 판매 여부' },
    { key: 'serves_wine', label: '와인 판매', description: '와인 판매 여부' },
    { key: 'serves_vegetarian', label: '채식 메뉴', description: '채식 메뉴 제공 여부' },
    { key: 'good_for_kids', label: '어린이 동반', description: '어린이 동반 적합 여부' },
    { key: 'good_for_groups', label: '단체 이용', description: '단체 이용 적합 여부' },
    { key: 'live_music', label: '라이브 음악', description: '라이브 공연 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
  ],
};

// 병원/의료기관 체크리스트
const medicalChecklist: IndustryChecklist = {
  keywords: ['병원', '의원', '클리닉', 'clinic', 'hospital', '치과', '피부과', '성형외과', '내과', '외과', '안과', '이비인후과', '정형외과', '한의원'],
  required: [
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
    { key: 'wheelchair_accessible_restroom', label: '휠체어 화장실', description: '휠체어 이용자 화장실 여부' },
    { key: 'appointments_required', label: '예약 필수', description: '사전 예약 필요 여부' },
    { key: 'online_appointments', label: '온라인 예약', description: '온라인 예약 가능 여부' },
  ],
  recommended: [
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'wifi', label: 'Wi-Fi', description: '무료 와이파이 제공 여부' },
    { key: 'restroom', label: '화장실', description: '화장실 이용 가능 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
    { key: 'telehealth', label: '원격 진료', description: '원격 진료 가능 여부' },
  ],
};

// 미용/뷰티 체크리스트
const beautyChecklist: IndustryChecklist = {
  keywords: ['미용', '뷰티', '헤어', '네일', '에스테틱', 'beauty', 'salon', '스파', 'spa', '마사지', '피부관리'],
  required: [
    { key: 'appointments_required', label: '예약 필수', description: '사전 예약 필요 여부' },
    { key: 'online_appointments', label: '온라인 예약', description: '온라인 예약 가능 여부' },
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
  ],
  recommended: [
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'wifi', label: 'Wi-Fi', description: '무료 와이파이 제공 여부' },
    { key: 'restroom', label: '화장실', description: '화장실 이용 가능 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
  ],
};

// 숙박 체크리스트
const lodgingChecklist: IndustryChecklist = {
  keywords: ['호텔', '모텔', '펜션', '게스트하우스', 'hotel', 'motel', '리조트', 'resort', '숙박', '민박'],
  required: [
    { key: 'wifi', label: 'Wi-Fi', description: '무료 와이파이 제공 여부' },
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
  ],
  recommended: [
    { key: 'air_conditioning', label: '에어컨', description: '에어컨 구비 여부' },
    { key: 'breakfast', label: '조식 제공', description: '조식 제공 여부' },
    { key: 'pool', label: '수영장', description: '수영장 유무' },
    { key: 'fitness_center', label: '피트니스', description: '피트니스 센터 유무' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
  ],
};

// 소매/쇼핑 체크리스트
const retailChecklist: IndustryChecklist = {
  keywords: ['마트', '슈퍼', '편의점', '상점', 'store', 'shop', '매장', '쇼핑', '백화점'],
  required: [
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
  ],
  recommended: [
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'restroom', label: '화장실', description: '화장실 이용 가능 여부' },
    { key: 'delivery', label: '배달 가능', description: '배달 서비스 제공 여부' },
    { key: 'curbside_pickup', label: '커브사이드 픽업', description: '차량 픽업 서비스 여부' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
  ],
};

// 기본 체크리스트 (매칭 안 될 때)
const defaultChecklist: IndustryChecklist = {
  keywords: [],
  required: [
    { key: 'wheelchair_accessible_entrance', label: '휠체어 접근 가능', description: '휠체어 이용자 접근 가능 여부' },
  ],
  recommended: [
    { key: 'parking', label: '주차', description: '주차 가능 여부' },
    { key: 'wifi', label: 'Wi-Fi', description: '무료 와이파이 제공 여부' },
    { key: 'restroom', label: '화장실', description: '화장실 이용 가능 여부' },
    { key: 'accepts_credit_cards', label: '신용카드', description: '신용카드 결제 가능 여부' },
    { key: 'accepts_nfc', label: 'NFC 결제', description: '모바일 NFC 결제 가능 여부' },
  ],
};

const allChecklists = [
  restaurantChecklist,
  medicalChecklist,
  beautyChecklist,
  lodgingChecklist,
  retailChecklist,
];

/**
 * 카테고리에 맞는 속성 체크리스트 반환
 */
export function getAttributeChecklist(category: string): IndustryChecklist {
  const lowerCategory = category.toLowerCase();

  for (const checklist of allChecklists) {
    if (checklist.keywords.some(keyword => lowerCategory.includes(keyword.toLowerCase()))) {
      return checklist;
    }
  }

  return defaultChecklist;
}

/**
 * 속성 체크 결과 분석
 */
export interface AttributeCheckResult {
  checklist: IndustryChecklist;
  missing: {
    required: AttributeItem[];
    recommended: AttributeItem[];
  };
  present: {
    required: AttributeItem[];
    recommended: AttributeItem[];
  };
  score: number; // 0-100
}

export function checkAttributes(
  category: string,
  attributes: { key: string; value: boolean | string }[]
): AttributeCheckResult {
  const checklist = getAttributeChecklist(category);
  const attributeKeys = new Set(attributes.map(a => a.key.toLowerCase()));

  const missingRequired: AttributeItem[] = [];
  const missingRecommended: AttributeItem[] = [];
  const presentRequired: AttributeItem[] = [];
  const presentRecommended: AttributeItem[] = [];

  // 필수 항목 체크
  for (const item of checklist.required) {
    if (attributeKeys.has(item.key.toLowerCase())) {
      presentRequired.push(item);
    } else {
      missingRequired.push(item);
    }
  }

  // 권장 항목 체크
  for (const item of checklist.recommended) {
    if (attributeKeys.has(item.key.toLowerCase())) {
      presentRecommended.push(item);
    } else {
      missingRecommended.push(item);
    }
  }

  // 점수 계산 (필수 70%, 권장 30%)
  const requiredScore = checklist.required.length > 0
    ? (presentRequired.length / checklist.required.length) * 70
    : 70;
  const recommendedScore = checklist.recommended.length > 0
    ? (presentRecommended.length / checklist.recommended.length) * 30
    : 30;

  return {
    checklist,
    missing: {
      required: missingRequired,
      recommended: missingRecommended,
    },
    present: {
      required: presentRequired,
      recommended: presentRecommended,
    },
    score: Math.round(requiredScore + recommendedScore),
  };
}
