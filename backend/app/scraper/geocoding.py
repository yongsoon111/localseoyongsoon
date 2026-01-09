"""
주소를 좌표로 변환하는 Geocoding 기능
"""
import time
import requests
from typing import Optional, Tuple


def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    주소를 좌표(위도, 경도)로 변환

    Args:
        address: 주소 문자열

    Returns:
        (latitude, longitude) 또는 None
    """
    if not address or not address.strip():
        return None

    try:
        # Nominatim API 사용 (OpenStreetMap)
        # 무료이며 API 키 불필요
        url = "https://nominatim.openstreetmap.org/search"

        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }

        headers = {
            "User-Agent": "LocalSEORankTracker/1.0"  # Nominatim 정책: User-Agent 필수
        }

        print(f"[GEOCODING] Geocoding address: {address}")

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()

        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            print(f"[GEOCODING] Success: ({lat}, {lon})")
            return (lat, lon)
        else:
            print("[GEOCODING] No results found")
            return None

    except Exception as e:
        print(f"[GEOCODING] Error: {str(e)}")
        return None


def geocode_with_retry(address: str, max_retries: int = 2) -> Optional[Tuple[float, float]]:
    """
    재시도 로직이 포함된 Geocoding

    Args:
        address: 주소 문자열
        max_retries: 최대 재시도 횟수

    Returns:
        (latitude, longitude) 또는 None
    """
    for attempt in range(max_retries):
        result = geocode_address(address)
        if result:
            return result

        if attempt < max_retries - 1:
            print(f"[GEOCODING] Retry {attempt + 1}/{max_retries}")
            time.sleep(1)  # Rate limiting 방지

    return None
