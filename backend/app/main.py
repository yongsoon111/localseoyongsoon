"""
FastAPI 메인 애플리케이션
"""
import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app import __version__
from app.database import check_connection
from app.schemas import HealthCheck
from app.api.routes import router

load_dotenv()

# FastAPI 앱 초기화
app = FastAPI(
    title="Local SEO Rank Tracker API",
    description="Google Maps 순위 측정 도구",
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check 엔드포인트
@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check() -> HealthCheck:
    """
    헬스 체크 엔드포인트
    서버 상태 및 데이터베이스 연결 확인
    """
    db_connected = check_connection()

    return HealthCheck(
        status="ok" if db_connected else "degraded",
        version=__version__,
        database_connected=db_connected,
        timestamp=datetime.now(timezone.utc)
    )


@app.get("/", tags=["Root"])
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Local SEO Rank Tracker API",
        "version": __version__,
        "docs": "/docs"
    }


# API 라우터 등록
app.include_router(router, prefix="/api")
