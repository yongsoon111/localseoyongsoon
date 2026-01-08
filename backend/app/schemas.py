"""
API 요청/응답 스키마 정의
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl, UUID4


# ===== Business Schemas =====

class BusinessCreate(BaseModel):
    """비즈니스 생성 요청"""
    name: str = Field(..., min_length=1, max_length=255)
    google_maps_url: str = Field(..., description="Google Maps URL")
    place_id: Optional[str] = None
    address: Optional[str] = None


class BusinessResponse(BaseModel):
    """비즈니스 응답"""
    id: UUID4
    name: str
    google_maps_url: str
    place_id: Optional[str]
    address: Optional[str]
    created_at: datetime


# ===== Scan Schemas =====

class ScanCreate(BaseModel):
    """스캔 생성 요청"""
    google_maps_url: str = Field(
        ...,
        description="Google Maps 비즈니스 URL"
    )
    center_lat: float = Field(
        ...,
        ge=-90,
        le=90,
        description="중심 좌표 위도"
    )
    center_lng: float = Field(
        ...,
        ge=-180,
        le=180,
        description="중심 좌표 경도"
    )
    radius_miles: int = Field(
        default=3,
        ge=1,
        le=10,
        description="반경 (1-10 마일)"
    )
    grid_size: int = Field(
        default=5,
        description="그리드 크기 (3, 5, 7)"
    )
    search_query: str = Field(
        ...,
        min_length=1,
        description="검색 쿼리 (예: pizza near me)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "google_maps_url": "https://www.google.com/maps/place/...",
                "center_lat": 40.7589,
                "center_lng": -73.9851,
                "radius_miles": 3,
                "grid_size": 5,
                "search_query": "pizza restaurant"
            }
        }


class ScanResponse(BaseModel):
    """스캔 생성 응답"""
    scan_id: UUID4
    business_id: UUID4
    status: str
    message: str


class ScanProgress(BaseModel):
    """스캔 진행 상황"""
    scan_id: UUID4
    business_name: str
    status: str
    total_points: int
    completed_points: int
    progress_percentage: float
    average_rank: Optional[float] = None
    started_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None


# ===== Results Schemas =====

class GridPointResponse(BaseModel):
    """그리드 포인트 응답"""
    grid_row: int
    grid_col: int
    lat: float
    lng: float
    rank: Optional[int]
    found: bool
    business_name_in_result: Optional[str]


class ScanResultsSummary(BaseModel):
    """스캔 결과 요약"""
    average_rank: Optional[float]
    best_rank: Optional[int]
    worst_rank: Optional[int]
    found_count: int
    not_found_count: int
    total_points: int


class ScanResults(BaseModel):
    """스캔 결과 전체"""
    scan_id: UUID4
    business_name: str
    status: str
    search_query: str
    center_lat: float
    center_lng: float
    radius_miles: int
    grid_size: int
    summary: ScanResultsSummary
    grid_points: List[GridPointResponse]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


# ===== Health Check Schema =====

class HealthCheck(BaseModel):
    """헬스 체크 응답"""
    status: str
    version: str
    database_connected: bool
    timestamp: datetime
