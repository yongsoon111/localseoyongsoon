"""
순위 측정 서비스
"""
from datetime import datetime, timezone
from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

from app.database import get_supabase
from app.scraper import (
    create_driver,
    close_driver,
    parse_google_maps_url,
    generate_grid,
    search_google_maps,
    extract_business_names,
    find_rank,
)


def scan_business(scan_id: str) -> Dict[str, Any]:
    """
    비즈니스 순위 스캔 실행

    Args:
        scan_id: RankSnapshot ID

    Returns:
        {
            "status": "completed" | "failed",
            "message": str,
            "summary": dict
        }

    Process:
        1. DB에서 스캔 정보 조회
        2. Google Maps URL 파싱
        3. 그리드 포인트 생성
        4. 각 포인트별 순위 측정
        5. DB 업데이트 (진행률, 결과)
    """
    print(f"[SCAN] Starting scan for ID: {scan_id}")
    driver = None

    try:
        supabase = get_supabase()
        print("[SCAN] Connected to Supabase")

        # Step 1: 스캔 정보 조회
        scan_data = _fetch_scan_data(supabase, scan_id)

        # Step 2: 타겟 비즈니스 이름
        target_business = scan_data["business_name"]
        print(f"[SCAN] Target business: {target_business}")

        # Step 3: 그리드 생성
        grid_points = generate_grid(
            center_lat=scan_data["center_lat"],
            center_lng=scan_data["center_lng"],
            radius_miles=scan_data["radius_miles"],
            grid_size=scan_data["grid_size"],
        )

        # Step 4: 스캔 시작 업데이트
        _update_scan_status(supabase, scan_id, "in_progress")

        # Step 5: 각 그리드 포인트 순위 측정 (병렬 처리)
        results = _measure_ranks_parallel(
            supabase=supabase,
            scan_id=scan_id,
            target_business=target_business,
            search_query=scan_data["search_query"],
            grid_points=grid_points,
        )

        # Step 6: 스캔 완료 및 통계 업데이트
        summary = _finalize_scan(supabase, scan_id, results)

        return {
            "status": "completed",
            "message": "Scan completed successfully",
            "summary": summary,
        }

    except Exception as e:
        # 에러 발생 시 실패 처리
        import traceback
        error_msg = f"Scan failed: {str(e)}"
        print(f"[SCAN ERROR] {error_msg}")
        traceback.print_exc()

        try:
            _update_scan_status(get_supabase(), scan_id, "failed")
        except Exception as update_error:
            print(f"[SCAN ERROR] Failed to update status: {update_error}")

        return {
            "status": "failed",
            "message": error_msg,
            "summary": None,
        }


def _fetch_scan_data(supabase: Any, scan_id: str) -> Dict[str, Any]:
    """DB에서 스캔 정보 조회"""
    result = (
        supabase.table("rank_snapshots")
        .select("*, businesses(name, google_maps_url)")
        .eq("id", scan_id)
        .single()
        .execute()
    )

    scan = result.data
    return {
        "center_lat": float(scan["center_lat"]),
        "center_lng": float(scan["center_lng"]),
        "radius_miles": scan["radius_miles"],
        "grid_size": scan["grid_size"],
        "search_query": scan["search_query"],
        "google_maps_url": scan["businesses"]["google_maps_url"],
        "business_name": scan["businesses"]["name"],
    }


def _update_scan_status(
    supabase: Any,
    scan_id: str,
    status: str
) -> None:
    """스캔 상태 업데이트"""
    update_data = {"status": status}

    if status == "in_progress":
        update_data["started_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    supabase.table("rank_snapshots").update(update_data).eq("id", scan_id).execute()


def _measure_ranks_parallel(
    supabase: Any,
    scan_id: str,
    target_business: str,
    search_query: str,
    grid_points: list,
) -> list:
    """각 그리드 포인트별 순위 측정 (병렬 처리)"""
    results = []
    total_points = len(grid_points)
    completed_count = 0
    lock = threading.Lock()

    # Render Free Tier: 최대 4개 동시 실행 (메모리 고려)
    # 유료 플랜에서는 8-10으로 증가 가능
    MAX_WORKERS = 4

    print(f"[SCAN] Starting parallel scan with {MAX_WORKERS} workers")

    def process_point(idx_point):
        """단일 포인트 처리 (독립 Chrome 사용)"""
        idx, point = idx_point
        driver = None
        try:
            # 각 워커가 자신의 Chrome 인스턴스 생성
            driver = create_driver(headless=True)

            # 검색 실행
            success = search_google_maps(
                driver=driver,
                query=search_query,
                lat=point["lat"],
                lng=point["lng"],
            )

            if success:
                # 비즈니스 이름 추출
                business_names = extract_business_names(driver)

                # 순위 찾기
                rank_result = find_rank(target_business, business_names)

                result = {
                    "point": point,
                    "rank": rank_result["rank"],
                    "found": rank_result["rank"] is not None,
                    "matched_name": rank_result["matched_name"],
                }
            else:
                # 검색 실패
                result = {
                    "point": point,
                    "rank": None,
                    "found": False,
                    "matched_name": None,
                }

            # GridPoint DB 저장
            _save_grid_point(supabase, scan_id, point, result)

            # 진행률 업데이트 (thread-safe)
            nonlocal completed_count
            with lock:
                completed_count += 1
                _update_progress(supabase, scan_id, completed_count, total_points)

            return (idx, result)

        except Exception as e:
            print(f"[SCAN] Error processing point {idx}: {e}")
            result = {
                "point": point,
                "rank": None,
                "found": False,
                "matched_name": None,
            }
            return (idx, result)

        finally:
            if driver:
                close_driver(driver)

    # 병렬 실행
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # 각 포인트를 (인덱스, 포인트) 튜플로 변환
        indexed_points = list(enumerate(grid_points, start=1))

        # 모든 작업 제출
        future_to_point = {
            executor.submit(process_point, ip): ip for ip in indexed_points
        }

        # 완료되는 대로 결과 수집
        temp_results = {}
        for future in as_completed(future_to_point):
            idx, result = future.result()
            temp_results[idx] = result

    # 순서대로 정렬
    results = [temp_results[i] for i in range(1, total_points + 1)]

    print(f"[SCAN] Parallel scan completed: {len(results)} points processed")
    return results


def _measure_ranks(
    driver: Any,
    supabase: Any,
    scan_id: str,
    target_business: str,
    search_query: str,
    grid_points: list,
) -> list:
    """각 그리드 포인트별 순위 측정 (레거시, 순차 처리)"""
    results = []
    total_points = len(grid_points)

    for idx, point in enumerate(grid_points, start=1):
        # 검색 실행
        success = search_google_maps(
            driver=driver,
            query=search_query,
            lat=point["lat"],
            lng=point["lng"],
        )

        if success:
            # 비즈니스 이름 추출
            business_names = extract_business_names(driver)

            # 순위 찾기
            rank_result = find_rank(target_business, business_names)

            results.append({
                "point": point,
                "rank": rank_result["rank"],
                "found": rank_result["rank"] is not None,
                "matched_name": rank_result["matched_name"],
            })
        else:
            # 검색 실패
            results.append({
                "point": point,
                "rank": None,
                "found": False,
                "matched_name": None,
            })

        # GridPoint DB 저장
        _save_grid_point(supabase, scan_id, point, results[-1])

        # 진행률 업데이트
        _update_progress(supabase, scan_id, idx, total_points)

    return results


def _save_grid_point(
    supabase: Any,
    scan_id: str,
    point: dict,
    result: dict
) -> None:
    """GridPoint DB에 저장"""
    supabase.table("grid_points").insert({
        "snapshot_id": scan_id,
        "grid_row": point["row"],
        "grid_col": point["col"],
        "lat": point["lat"],
        "lng": point["lng"],
        "rank": result["rank"],
        "found": result["found"],
        "business_name_in_result": result["matched_name"],
    }).execute()


def _update_progress(
    supabase: Any,
    scan_id: str,
    completed: int,
    total: int
) -> None:
    """진행률 업데이트"""
    supabase.table("rank_snapshots").update({
        "completed_points": completed
    }).eq("id", scan_id).execute()


def _finalize_scan(supabase: Any, scan_id: str, results: list) -> dict:
    """스캔 완료 및 통계 계산"""
    ranks = [r["rank"] for r in results if r["rank"] is not None]

    found_count = sum(1 for r in results if r["found"])
    not_found_count = len(results) - found_count

    summary = {
        "average_rank": round(sum(ranks) / len(ranks), 2) if ranks else None,
        "best_rank": min(ranks) if ranks else None,
        "worst_rank": max(ranks) if ranks else None,
        "found_count": found_count,
        "not_found_count": not_found_count,
    }

    # DB 업데이트
    supabase.table("rank_snapshots").update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "average_rank": summary["average_rank"],
        "best_rank": summary["best_rank"],
        "worst_rank": summary["worst_rank"],
        "found_count": summary["found_count"],
        "not_found_count": summary["not_found_count"],
    }).eq("id", scan_id).execute()

    return summary
