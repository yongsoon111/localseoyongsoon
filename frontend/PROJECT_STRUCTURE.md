# Frontend Project Structure

## 디렉토리 구조

```
frontend/
├── src/
│   ├── components/          # UI 컴포넌트 (Phase 3.5+에서 추가 예정)
│   │   └── .gitkeep        # 디렉토리 placeholder
│   │
│   ├── services/           # API 서비스 레이어
│   │   └── api.ts         # Supabase 클라이언트 + Backend API
│   │
│   ├── types/             # TypeScript 타입 정의
│   │   └── index.ts       # 모든 타입 정의
│   │
│   ├── assets/            # 정적 리소스
│   │   └── react.svg
│   │
│   ├── App.tsx           # 메인 애플리케이션 컴포넌트
│   ├── main.tsx          # React 엔트리포인트
│   ├── index.css         # Tailwind CSS + 글로벌 스타일
│   └── App.css           # App 컴포넌트 스타일
│
├── public/               # 정적 파일 (빌드 시 그대로 복사)
│
├── node_modules/         # NPM 패키지
│
├── .env.example          # 환경 변수 템플릿
├── .gitignore           # Git 무시 파일
├── eslint.config.js     # ESLint 설정
├── index.html           # HTML 템플릿
├── package.json         # 프로젝트 메타데이터 & 의존성
├── package-lock.json    # 패키지 잠금 파일
├── postcss.config.js    # PostCSS 설정 (Tailwind)
├── README.md            # 프로젝트 문서
├── tailwind.config.js   # Tailwind CSS 설정
├── tsconfig.json        # TypeScript 루트 설정
├── tsconfig.app.json    # 앱용 TypeScript 설정
├── tsconfig.node.json   # Node용 TypeScript 설정
└── vite.config.ts       # Vite 빌드 도구 설정
```

## 주요 파일 설명

### /src/types/index.ts
모든 TypeScript 타입 정의를 포함합니다:
- `Business`: 비즈니스 정보
- `ScanConfig`: 스캔 설정
- `ScanProgress`: 스캔 진행 상황
- `ScanResults`: 스캔 결과
- `GridPoint`: 그리드 포인트 데이터

### /src/services/api.ts
API 클라이언트 레이어:
- Supabase 클라이언트 설정
- Axios 인스턴스 (백엔드 API)
- `businessApi`: 비즈니스 CRUD
- `scanApi`: 스캔 관련 API
- 에러 인터셉터

### /src/App.tsx
메인 애플리케이션 컴포넌트:
- 백엔드 헬스 체크
- 향후 라우팅 및 컴포넌트 통합

### /src/main.tsx
React 애플리케이션 엔트리포인트:
- React DOM 렌더링
- StrictMode 래핑

## 설정 파일

### package.json
의존성:
- `react` 19.2.0
- `typescript` 5.9.3
- `vite` 7.2.4
- `tailwindcss` 3.4.18
- `@supabase/supabase-js` 2.47.10
- `axios` 1.7.9

스크립트:
- `npm run dev`: 개발 서버
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 미리보기
- `npm run lint`: 린팅

### vite.config.ts
- 포트: 3000
- Proxy: /api → http://localhost:8000

### tailwind.config.js
- Content: index.html, src/**/*.{js,ts,jsx,tsx}
- 기본 설정

### tsconfig.app.json
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Strict mode 활성화

## 환경 변수 (.env)

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 개발 워크플로우

1. **패키지 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일 수정
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   - http://localhost:3000

## 다음 단계 (Phase 3.5+)

컴포넌트 구현 예정:
- `UrlInput.tsx`: Google Maps URL 입력
- `ScanConfig.tsx`: 스캔 설정
- `ScanProgress.tsx`: 진행 상황 표시
- `MapView.tsx`: 지도 + 히트맵
- `RankGrid.tsx`: 순위 그리드
- `Summary.tsx`: 결과 요약

## 코딩 가이드라인

- 함수는 50줄 이하
- 컴포넌트는 단일 책임 원칙
- TypeScript strict mode
- Tailwind CSS 사용
- 명확한 타입 정의
