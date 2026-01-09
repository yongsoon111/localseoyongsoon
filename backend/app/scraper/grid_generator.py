"""
그리드 포인트 생성 유틸리티
"""
import math
from typing import List, Dict


# 위도 1도 = 약 69마일
MILES_PER_DEGREE_LAT = 69.0


def generate_grid(
    center_lat: float,
    center_lng: float,
    radius_miles: int,
    grid_size: int
) -> List[Dict[str, float]]:
    """
    중심점 기준 NxN 그리드 포인트 생성

    Args:
        center_lat: 중심 위도
        center_lng: 중심 경도
        radius_miles: 반경 (마일)
        grid_size: 그리드 크기 (3, 5, 7 등)

    Returns:
        [{"lat": float, "lng": float, "row": int, "col": int}, ...]

    Example:
        >>> generate_grid(40.7589, -73.9851, 3, 5)
        [{"lat": 40.8, "lng": -74.0, "row": 0, "col": 0}, ...]
    """
    grid_points = []

    # 마일 -> 위도/경도 변환
    lat_delta = radius_miles / MILES_PER_DEGREE_LAT
    lng_delta = _miles_to_lng_delta(center_lat, radius_miles)

    # 각 셀 크기 계산 (전체를 grid_size로 나눔)
    cell_size_lat = (2 * lat_delta) / grid_size
    cell_size_lng = (2 * lng_delta) / grid_size

    # 그리드 생성 (각 셀의 중심에 포인트 배치)
    for row in range(grid_size):
        for col in range(grid_size):
            # 각 셀의 중심 좌표 계산
            # 최북단에서 시작해서 남쪽으로 이동
            lat = center_lat + lat_delta - (row + 0.5) * cell_size_lat
            # 최서단에서 시작해서 동쪽으로 이동
            lng = center_lng - lng_delta + (col + 0.5) * cell_size_lng

            grid_points.append({
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "row": row,
                "col": col
            })

    return grid_points


def _miles_to_lng_delta(latitude: float, miles: float) -> float:
    """
    위도에 따른 경도 변환 (지구는 구형이므로 위도마다 다름)

    Args:
        latitude: 위도
        miles: 마일

    Returns:
        경도 변화량
    """
    # 해당 위도에서 1도당 마일
    miles_per_degree_lng = MILES_PER_DEGREE_LAT * math.cos(math.radians(latitude))

    # 0으로 나누기 방지 (극지방)
    if miles_per_degree_lng < 0.1:
        miles_per_degree_lng = 0.1

    return miles / miles_per_degree_lng
