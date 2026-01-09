"""
API 라우트 정의
"""
from datetime import datetime
from decimal import Decimal
from typing import List
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import UUID4

from app.database import get_supabase
from app.schemas import (
    ScanCreate,
    ScanResponse,
    ScanProgress,
    ScanResults,
    ScanResultsSummary,
    GridPointResponse
)
from app.services import scan_business
from app.scraper import parse_google_maps_url

router = APIRouter()


@router.post("/business/scrape")
async def scrape_business(request: dict) -> dict:
    """
    Google Maps URL에서 비즈니스 정보 스크래핑

    Request:
        {"google_maps_url": "https://..."}

    Response:
        {
            "name": "비즈니스 이름",
            "address": "주소",
            "phone": "전화번호",
            "website": "웹사이트",
            "category": "카테고리",
            "rating": "평점",
            "review_count": "리뷰 수",
            "place_id": "Place ID"
        }
    """
    google_maps_url = request.get("google_maps_url")
    if not google_maps_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="google_maps_url is required"
        )

    try:
        print(f"[API] Parsing business info from URL: {google_maps_url}")

        # URL 파싱으로 모든 정보 추출 (빠르고 정확)
        parsed_url = parse_google_maps_url(google_maps_url)

        scraped_info = {
            "name": parsed_url.get("business_name"),
            "place_id": parsed_url.get("place_id"),
            "lat": parsed_url.get("lat"),
            "lng": parsed_url.get("lng"),
            "address": None,  # URL에는 없음
            "phone": None,
            "website": None,
            "category": None,
            "rating": None,
            "review_count": None,
        }

        print(f"[API] Successfully parsed: {scraped_info.get('name')} at ({scraped_info.get('lat')}, {scraped_info.get('lng')})")
        return scraped_info

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse business info: {str(e)}"
        )


@router.post("/scan", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks
) -> ScanResponse:
    """
    새로운 스캔 생성

    1. Business 레코드 생성 또는 조회 (google_maps_url로 구분)
    2. RankSnapshot 생성 (status=pending)
    3. 백그라운드에서 스캔 실행
    4. scan_id 반환
    """
    try:
        supabase = get_supabase()

        # Step 1: Business 생성 또는 조회
        existing_business = supabase.table("businesses") \
            .select("*") \
            .eq("google_maps_url", scan_data.google_maps_url) \
            .execute()

        if existing_business.data:
            business = existing_business.data[0]
            print(f"[API] Existing business found: {business['name']}")
        else:
            # Step 2: 새 비즈니스 - URL 파싱으로 빠르게 추출
            print(f"[API] New business. Parsing from URL: {scan_data.google_maps_url}")

            # URL 파싱
            parsed_url = parse_google_maps_url(scan_data.google_maps_url)

            # 파싱된 정보 우선, 없으면 사용자 입력, 최종적으로 "Unknown"
            business_name = parsed_url.get("business_name") or scan_data.business_name or "Unknown Business"

            print(f"[API] Parsed business name: {business_name}")

            # 새 비즈니스 생성
            new_business = supabase.table("businesses").insert({
                "name": business_name,
                "google_maps_url": scan_data.google_maps_url,
                "place_id": parsed_url.get("place_id"),
                "address": None,  # URL에는 없음
                "phone": None,
                "website": None,
                "category": None,
            }).execute()
            business = new_business.data[0]

        # Step 3: RankSnapshot 생성
        total_points = scan_data.grid_size * scan_data.grid_size

        snapshot = supabase.table("rank_snapshots").insert({
            "business_id": business["id"],
            "status": "pending",
            "center_lat": scan_data.center_lat,
            "center_lng": scan_data.center_lng,
            "radius_miles": scan_data.radius_miles,
            "grid_size": scan_data.grid_size,
            "search_query": scan_data.search_query,
            "total_points": total_points,
            "completed_points": 0
        }).execute()

        scan = snapshot.data[0]

        # Step 4: 백그라운드 태스크로 스캔 실행
        background_tasks.add_task(scan_business, str(scan["id"]))

        return ScanResponse(
            scan_id=scan["id"],
            business_id=business["id"],
            status="pending",
            message=f"Scan started. Total points: {total_points}"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create scan: {str(e)}"
        )


@router.get("/scan/{scan_id}", response_model=ScanProgress)
async def get_scan_progress(scan_id: UUID4) -> ScanProgress:
    """
    스캔 진행 상황 조회

    - 진행률 계산 (completed_points / total_points)
    - 예상 완료 시간 계산 (Phase 2에서 구현)
    """
    try:
        supabase = get_supabase()

        # Snapshot + Business 조인 조회
        result = supabase.table("rank_snapshots") \
            .select("*, businesses(name)") \
            .eq("id", str(scan_id)) \
            .single() \
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan {scan_id} not found"
            )

        scan = result.data
        business_name = scan["businesses"]["name"]

        # 진행률 계산
        total = scan["total_points"] or 1
        completed = scan["completed_points"] or 0
        progress = (completed / total) * 100

        return ScanProgress(
            scan_id=scan["id"],
            business_name=business_name,
            status=scan["status"],
            total_points=total,
            completed_points=completed,
            progress_percentage=round(progress, 2),
            average_rank=float(scan["average_rank"]) if scan.get("average_rank") else None,
            started_at=scan.get("started_at"),
            estimated_completion=None  # Phase 2에서 구현
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scan progress: {str(e)}"
        )


@router.get("/results/{scan_id}", response_model=ScanResults)
async def get_scan_results(scan_id: UUID4) -> ScanResults:
    """
    스캔 결과 조회

    - 스캔 완료 확인 (status=completed)
    - GridPoint 데이터 조회
    - 요약 통계 포함
    """
    try:
        supabase = get_supabase()

        # Snapshot + Business 조회
        snapshot_result = supabase.table("rank_snapshots") \
            .select("*, businesses(name)") \
            .eq("id", str(scan_id)) \
            .single() \
            .execute()

        if not snapshot_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan {scan_id} not found"
            )

        scan = snapshot_result.data

        # 완료 상태 확인
        if scan["status"] != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scan is not completed yet. Current status: {scan['status']}"
            )

        # GridPoints 조회
        points_result = supabase.table("grid_points") \
            .select("*") \
            .eq("snapshot_id", str(scan_id)) \
            .execute()

        grid_points = [
            GridPointResponse(
                grid_row=p["grid_row"],
                grid_col=p["grid_col"],
                lat=float(p["lat"]),
                lng=float(p["lng"]),
                rank=p.get("rank"),
                found=p["found"],
                business_name_in_result=p.get("business_name_in_result")
            )
            for p in points_result.data
        ]

        # 요약 통계
        summary = ScanResultsSummary(
            average_rank=float(scan["average_rank"]) if scan.get("average_rank") else None,
            best_rank=scan.get("best_rank"),
            worst_rank=scan.get("worst_rank"),
            found_count=scan["found_count"],
            not_found_count=scan["not_found_count"],
            total_points=scan["total_points"]
        )

        return ScanResults(
            scan_id=scan["id"],
            business_name=scan["businesses"]["name"],
            status=scan["status"],
            search_query=scan["search_query"],
            center_lat=float(scan["center_lat"]),
            center_lng=float(scan["center_lng"]),
            radius_miles=scan["radius_miles"],
            grid_size=scan["grid_size"],
            summary=summary,
            grid_points=grid_points,
            started_at=scan.get("started_at"),
            completed_at=scan.get("completed_at")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scan results: {str(e)}"
        )


# ===== Helper Functions =====
# (extract_business_name은 이제 scraper.parse_google_maps_url로 대체됨)
