# 배포 가이드

## 1단계: Supabase 설정

1. [Supabase](https://supabase.com) 가입 및 새 프로젝트 생성
2. SQL Editor에서 `database_schema.md`의 SQL 스크립트 실행:
   - Tables 섹션 실행
   - Triggers 섹션 실행
   - Views 섹션 실행

3. 프로젝트 설정에서 API 키 확인:
   - Settings → API
   - `Project URL` 복사 (예: https://xxxxx.supabase.co)
   - `service_role` 키 복사 (secret)
   - `anon` 키 복사 (public)

## 2단계: Render 백엔드 배포

1. [Render](https://render.com) 가입
2. GitHub 저장소 연결
3. "New" → "Blueprint" 선택
4. 저장소에서 `render.yaml` 자동 감지
5. 환경 변수 설정:
   - `SUPABASE_URL`: Supabase Project URL
   - `SUPABASE_SERVICE_KEY`: Supabase service_role 키
6. "Apply" 클릭하여 배포 시작
7. 배포 완료 후 URL 복사 (예: https://local-seo-backend.onrender.com)

**중요**: Render 무료 플랜은 15분 비활성 후 슬립 모드로 전환됩니다.
처음 요청 시 30초~1분 정도 소요될 수 있습니다.

## 3단계: Vercel 프론트엔드 배포

1. [Vercel](https://vercel.com) 가입
2. "Import Project" → GitHub 저장소 연결
3. Root Directory를 `frontend`로 설정
4. Framework Preset: Vite 자동 감지
5. 환경 변수 설정:
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon 키
   - `VITE_BACKEND_URL`: Render 백엔드 URL
6. "Deploy" 클릭

## 4단계: CORS 설정 업데이트

1. Render 대시보드에서 백엔드 서비스로 이동
2. Environment 탭에서 `ALLOWED_ORIGINS` 수정:
   - Vercel에서 배포된 프론트엔드 URL 추가
   - 예: `https://local-seo-frontend.vercel.app`
3. 서비스 재배포

## 5단계: 테스트

1. Vercel URL로 접속
2. Google Maps URL 입력
3. 스캔 설정 후 실행
4. 결과 확인

## 예상 배포 시간

- Supabase 설정: 5분
- Render 배포: 10-15분 (첫 빌드)
- Vercel 배포: 2-3분
- 총 소요 시간: 약 20분

## 비용

- Supabase: 무료 플랜 (500MB DB, 2GB 전송)
- Render: 무료 플랜 (750시간/월)
- Vercel: 무료 플랜 (100GB 대역폭)

## 문제 해결

### Render 배포 실패
- Logs 탭에서 빌드 로그 확인
- Chrome 설치 오류 시 Dockerfile 확인

### 프론트엔드 API 연결 실패
- 브라우저 콘솔에서 CORS 에러 확인
- `VITE_BACKEND_URL`이 올바른지 확인
- Render 백엔드의 `ALLOWED_ORIGINS` 확인

### Selenium 에러
- Render 로그에서 Chrome/ChromeDriver 설치 확인
- 무료 플랜은 512MB RAM 제한 (스캔 크기 조정 필요)
