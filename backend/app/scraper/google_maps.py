"""
Google Maps 검색 및 순위 추출
"""
import time
import random
from typing import List, Optional, Dict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from rapidfuzz import fuzz


def search_google_maps(
    driver: webdriver.Chrome,
    query: str,
    lat: float,
    lng: float
) -> bool:
    """
    Google Maps에서 특정 위치 기준 검색

    Args:
        driver: Selenium WebDriver
        query: 검색 쿼리 (예: "pizza restaurant")
        lat: 검색 위도
        lng: 검색 경도

    Returns:
        검색 성공 여부
    """
    try:
        # Google Maps 검색 URL 생성
        search_url = (
            f"https://www.google.com/maps/search/{query.replace(' ', '+')}/"
            f"@{lat},{lng},15z"
        )

        driver.get(search_url)

        # 검색 결과 로딩 대기 (최대 10초)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='feed']"))
        )

        # 랜덤 딜레이 (2-5초)
        time.sleep(random.uniform(2, 5))

        return True

    except Exception as e:
        print(f"Search failed: {str(e)}")
        return False


def extract_business_names(driver: webdriver.Chrome) -> List[str]:
    """
    검색 결과에서 비즈니스 이름 목록 추출

    Args:
        driver: Selenium WebDriver

    Returns:
        비즈니스 이름 리스트 (순위 순서대로)

    Note:
        실제 셀렉터는 Google Maps DOM 구조 분석 후 업데이트 필요
    """
    business_names = []

    try:
        # 스크롤하여 더 많은 결과 로드
        _scroll_results(driver)

        # 비즈니스 이름 추출 (실제 셀렉터는 테스트 후 수정)
        # 현재는 샘플 셀렉터
        results = driver.find_elements(
            By.CSS_SELECTOR,
            "div[role='feed'] a[aria-label]"
        )

        for result in results[:20]:  # 상위 20개만
            name = result.get_attribute("aria-label")
            if name:
                business_names.append(name)

    except Exception as e:
        print(f"Extraction failed: {str(e)}")

    return business_names


def find_rank(
    target_business: str,
    business_list: List[str],
    threshold: int = 80
) -> Dict[str, Optional[int]]:
    """
    비즈니스 목록에서 타겟 비즈니스 순위 찾기 (퍼지 매칭)

    Args:
        target_business: 찾을 비즈니스 이름
        business_list: 검색 결과 비즈니스 리스트
        threshold: 유사도 임계값 (0-100)

    Returns:
        {"rank": int or None, "matched_name": str or None}
    """
    best_match_ratio = 0
    best_match_rank = None
    best_match_name = None

    for rank, business_name in enumerate(business_list, start=1):
        # 퍼지 매칭 점수 계산
        ratio = fuzz.token_sort_ratio(
            target_business.lower(),
            business_name.lower()
        )

        if ratio > best_match_ratio:
            best_match_ratio = ratio
            best_match_rank = rank
            best_match_name = business_name

    # 임계값 이상인 경우에만 매칭 성공
    if best_match_ratio >= threshold:
        return {"rank": best_match_rank, "matched_name": best_match_name}

    return {"rank": None, "matched_name": None}


def _scroll_results(driver: webdriver.Chrome, scrolls: int = 3) -> None:
    """
    검색 결과 스크롤하여 더 많은 결과 로드

    Args:
        driver: Selenium WebDriver
        scrolls: 스크롤 횟수
    """
    try:
        scrollable_div = driver.find_element(By.CSS_SELECTOR, "div[role='feed']")

        for _ in range(scrolls):
            driver.execute_script(
                "arguments[0].scrollTop = arguments[0].scrollHeight",
                scrollable_div
            )
            time.sleep(1)

    except Exception:
        pass
