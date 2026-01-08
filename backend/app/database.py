"""
Supabase 데이터베이스 연결 모듈
"""
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# 환경 변수
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Supabase 클라이언트 인스턴스
supabase: Optional[Client] = None


def get_supabase() -> Client:
    """
    Supabase 클라이언트 인스턴스 반환
    싱글톤 패턴으로 구현
    """
    global supabase

    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
            )

        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    return supabase


def check_connection() -> bool:
    """데이터베이스 연결 확인"""
    try:
        client = get_supabase()
        # 간단한 쿼리로 연결 테스트
        result = client.table("businesses").select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
