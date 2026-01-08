# Frontend - Google Maps Rank Tracker

React + TypeScript + Vite 기반의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **Backend API**: Axios
- **Database**: Supabase Client

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/      # UI 컴포넌트 (Phase 3.5+)
│   ├── services/        # API 서비스 레이어
│   │   └── api.ts      # Supabase & Backend API
│   ├── types/          # TypeScript 타입 정의
│   │   └── index.ts    # Business, Scan, Grid 타입
│   ├── App.tsx         # 메인 앱 컴포넌트
│   ├── main.tsx        # 엔트리포인트
│   └── index.css       # Tailwind CSS
├── public/             # 정적 파일
├── .env.example        # 환경 변수 예시
├── package.json        # 의존성 관리
├── vite.config.ts      # Vite 설정
├── tailwind.config.js  # Tailwind 설정
└── tsconfig.json       # TypeScript 설정
```

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 값을 설정합니다:

```bash
cp .env.example .env
```

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행 (포트 3000)
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 앱 미리보기
- `npm run lint` - ESLint 실행

## 타입 정의

### Business
```typescript
interface Business {
  id: string;
  name: string;
  google_maps_url: string;
  place_id?: string;
  address?: string;
}
```

### ScanConfig
```typescript
interface ScanConfig {
  business_id: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  grid_size: number;
}
```

### ScanProgress
```typescript
interface ScanProgress {
  scan_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  completed_points: number;
  total_points: number;
}
```

## API 서비스

### Business API
```typescript
import { businessApi } from './services/api';

// 비즈니스 생성
const business = await businessApi.create({
  name: 'My Business',
  google_maps_url: 'https://maps.google.com/...',
});

// 비즈니스 조회
const business = await businessApi.get(businessId);
```

### Scan API
```typescript
import { scanApi } from './services/api';

// 스캔 시작
const { scan_id } = await scanApi.create({
  business_id: 'xxx',
  center_lat: 37.7749,
  center_lng: -122.4194,
  radius_miles: 5,
  grid_size: 5,
});

// 진행 상황 조회
const progress = await scanApi.getProgress(scan_id);

// 결과 조회
const results = await scanApi.getResults(scan_id);
```

## 개발 현황

### 완료된 Phase
- [x] Phase 3.1: React + TypeScript 프로젝트 생성
- [x] Phase 3.2: 프로젝트 구조 설정
- [x] Phase 3.3: TypeScript 타입 정의
- [x] Phase 3.4: API 서비스 레이어

### 다음 Phase
- [ ] Phase 3.5: UrlInput 컴포넌트
- [ ] Phase 3.6: ScanConfig 컴포넌트
- [ ] Phase 3.7: ScanProgress 컴포넌트
- [ ] Phase 3.8: MapView 컴포넌트 (히트맵)
- [ ] Phase 3.9: RankGrid 컴포넌트
- [ ] Phase 3.10: Summary 컴포넌트
- [ ] Phase 3.11: 메인 App 통합

## 주의사항

- 백엔드 API가 http://localhost:8000 에서 실행 중이어야 합니다.
- Supabase 프로젝트가 설정되어 있어야 합니다.
- 함수는 50줄 이하로 유지합니다.
- 컴포넌트는 단일 책임 원칙을 따릅니다.

## 라이선스

MIT
