# Local SEO Rank Tracker

Google Maps 기반 지역별 순위 측정 및 보고서 생성 도구

## 기능

- 🗺️ Google Maps URL 입력으로 간편한 분석 시작
- 📊 그리드 기반 순위 측정 (3x3, 5x5, 7x7)
- 🎨 히트맵 시각화
- 📈 경쟁사 비교 분석
- 📄 전문 PDF 보고서 자동 생성
- 📧 이메일/SMS/웹훅 자동 전송

## 기술 스택

### Backend
- Python 3.11+
- FastAPI
- Selenium
- Supabase (PostgreSQL)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Leaflet.js

## 설치 방법

### 1. 백엔드 설정
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일 편집 (Supabase 정보 입력)
```

### 3. 프론트엔드 설정
```bash
cd frontend
npm install
```

## 실행 방법

### 백엔드
```bash
cd backend
uvicorn app.main:app --reload
```

### 프론트엔드
```bash
cd frontend
npm run dev
```

## 문서

- [개발 계획](plan.md)
- [기술 사양](techspec.md)
- [사용자 플로우](user_flow.md)
- [데이터베이스 스키마](database_schema.md)
- [테스트 체크리스트](testing_checklist.md)

## 라이선스

MIT
