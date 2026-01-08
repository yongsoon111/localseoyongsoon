"""
Pydantic 데이터 모델 정의
Supabase는 SQL로 테이블을 관리하므로 Pydantic 모델만 정의
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, UUID4


class SnapshotStatus(str, Enum):
    """스냅샷 상태"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Business(BaseModel):
    """비즈니스 모델"""
    id: UUID4
    name: str
    google_maps_url: str
    place_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RankSnapshot(BaseModel):
    """순위 스냅샷 모델"""
    id: UUID4
    business_id: UUID4
    status: SnapshotStatus
    center_lat: Decimal = Field(
        ...,
        description="중심 좌표 위도",
        decimal_places=8
    )
    center_lng: Decimal = Field(
        ...,
        description="중심 좌표 경도",
        decimal_places=8
    )
    radius_miles: int = Field(..., ge=1, le=10)
    grid_size: int = Field(..., description="3, 5, 7 중 하나")
    search_query: str
    total_points: Optional[int] = None
    completed_points: int = 0
    average_rank: Optional[Decimal] = None
    best_rank: Optional[int] = None
    worst_rank: Optional[int] = None
    found_count: int = 0
    not_found_count: int = 0
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GridPoint(BaseModel):
    """그리드 포인트 모델"""
    id: UUID4
    snapshot_id: UUID4
    grid_row: int
    grid_col: int
    lat: Decimal = Field(..., decimal_places=8)
    lng: Decimal = Field(..., decimal_places=8)
    rank: Optional[int] = Field(None, ge=1, le=20)
    found: bool = False
    business_name_in_result: Optional[str] = None
    scraped_at: Optional[datetime] = None

    class Config:
        from_attributes = True
