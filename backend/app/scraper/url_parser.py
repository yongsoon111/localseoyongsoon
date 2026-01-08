"""
Google Maps URL 파싱 유틸리티
"""
import re
from typing import Dict, Optional
from urllib.parse import unquote


def parse_google_maps_url(url: str) -> Dict[str, Optional[str]]:
    """
    Google Maps URL에서 비즈니스 정보 추출

    Args:
        url: Google Maps URL

    Returns:
        {
            "business_name": str,
            "lat": str,
            "lng": str,
            "place_id": str
        }

    Examples:
        >>> parse_google_maps_url("https://www.google.com/maps/place/...")
        {"business_name": "Joe's Pizza", "lat": "40.7589", ...}
    """
    result = {
        "business_name": None,
        "lat": None,
        "lng": None,
        "place_id": None,
    }

    # 비즈니스 이름 추출 (/place/ 이후)
    result["business_name"] = _extract_business_name(url)

    # 좌표 추출 (@lat,lng 패턴)
    coords = _extract_coordinates(url)
    if coords:
        result["lat"] = coords[0]
        result["lng"] = coords[1]

    # Place ID 추출
    result["place_id"] = _extract_place_id(url)

    return result


def _extract_business_name(url: str) -> Optional[str]:
    """URL에서 비즈니스 이름 추출"""
    match = re.search(r"/place/([^/]+)", url)
    if match:
        name = match.group(1)
        # URL 디코딩 및 정리
        name = unquote(name).replace("+", " ")
        return name[:255]
    return None


def _extract_coordinates(url: str) -> Optional[tuple[str, str]]:
    """URL에서 위도/경도 추출 (@lat,lng,zoom 패턴)"""
    match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
    if match:
        return (match.group(1), match.group(2))
    return None


def _extract_place_id(url: str) -> Optional[str]:
    """URL에서 Place ID 추출"""
    match = re.search(r"!1s([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)
    return None
