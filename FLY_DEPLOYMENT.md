# Fly.io 배포 가이드

## 1. Fly.io CLI 설치

### macOS:
```bash
brew install flyctl
```

### 또는 curl:
```bash
curl -L https://fly.io/install.sh | sh
```

## 2. Fly.io 로그인
```bash
flyctl auth login
```

## 3. 백엔드 배포

### 디렉토리 이동:
```bash
cd backend
```

### 앱 생성 (최초 1회만):
```bash
flyctl launch --no-deploy
```
- 앱 이름: `localseoyongsoon-backend` (또는 원하는 이름)
- Region: Tokyo (nrt) - 한국과 가까움
- Postgres DB: No (Supabase 사용)
- Redis: No

### 환경 변수 설정:
```bash
flyctl secrets set SUPABASE_URL="https://kvizxfloqohkegturhci.supabase.co"
flyctl secrets set SUPABASE_SERVICE_KEY="your-service-key"
flyctl secrets set ALLOWED_ORIGINS="https://localseoyongsoon.vercel.app,http://localhost:5173"
```

### 배포:
```bash
flyctl deploy
```

## 4. 프론트엔드 환경 변수 업데이트

Vercel 대시보드에서 환경 변수 수정:
```
VITE_BACKEND_URL=https://localseoyongsoon-backend.fly.dev
```

## 5. 확인

```bash
# 앱 상태 확인
flyctl status

# 로그 확인
flyctl logs

# 앱 열기
flyctl open
```

## Fly.io Free Tier 스펙:
- ✅ 1GB RAM (Render 512MB보다 2배)
- ✅ Shared CPU 1개
- ✅ Auto stop/start (비용 절감)
- ✅ 무료: 3 shared-cpu-1x VMs + 3GB storage

## 예상 성능:
- 25개 포인트 스캔: **1-2분** (Render 4-8분)
- 병렬 처리: 4 workers 안정적 실행
- Cold start: 약간 느림 (첫 요청 시)
