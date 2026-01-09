"""
Google Maps 비즈니스 정보 스크래핑
"""
import time
from typing import Dict, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def scrape_business_info(driver: webdriver.Chrome, google_maps_url: str) -> Dict[str, Optional[str]]:
    """
    Google Maps URL에서 비즈니스 상세 정보 스크래핑

    Args:
        driver: Selenium WebDriver
        google_maps_url: Google Maps 비즈니스 URL

    Returns:
        {
            "name": str,
            "address": str,
            "phone": str,
            "website": str,
            "category": str,
            "rating": str,
            "review_count": str,
            "place_id": str
        }
    """
    result = {
        "name": None,
        "address": None,
        "phone": None,
        "website": None,
        "category": None,
        "rating": None,
        "review_count": None,
        "place_id": None,
    }

    try:
        # Google Maps 페이지 방문
        driver.get(google_maps_url)

        # 페이지 로딩 대기 (Render 환경에서는 느릴 수 있음)
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1"))
        )

        time.sleep(3)  # 추가 로딩 대기

        # 비즈니스 이름
        result["name"] = _extract_business_name(driver)

        # 카테고리
        result["category"] = _extract_category(driver)

        # 주소
        result["address"] = _extract_address(driver)

        # 전화번호
        result["phone"] = _extract_phone(driver)

        # 웹사이트
        result["website"] = _extract_website(driver)

        # 평점 및 리뷰 수
        rating_info = _extract_rating_info(driver)
        result["rating"] = rating_info.get("rating")
        result["review_count"] = rating_info.get("review_count")

        # Place ID (URL에서 추출)
        result["place_id"] = _extract_place_id_from_url(google_maps_url)

        print(f"[SCRAPER] Successfully scraped: {result['name']}")

    except Exception as e:
        print(f"[SCRAPER ERROR] Failed to scrape business info: {str(e)}")

    return result


def _extract_business_name(driver: webdriver.Chrome) -> Optional[str]:
    """비즈니스 이름 추출"""
    try:
        # h1 태그에서 비즈니스 이름 추출
        name_element = driver.find_element(By.CSS_SELECTOR, "h1.DUwDvf")
        return name_element.text.strip() if name_element else None
    except:
        try:
            # 대체 셀렉터
            name_element = driver.find_element(By.CSS_SELECTOR, "h1")
            return name_element.text.strip() if name_element else None
        except:
            return None


def _extract_category(driver: webdriver.Chrome) -> Optional[str]:
    """카테고리 추출"""
    try:
        # 비즈니스 타입/카테고리 버튼
        category_element = driver.find_element(By.CSS_SELECTOR, "button[jsaction*='category']")
        return category_element.text.strip() if category_element else None
    except:
        try:
            # 대체: aria-label에서 추출
            category_element = driver.find_element(By.CSS_SELECTOR, "button.DkEaL")
            return category_element.text.strip() if category_element else None
        except:
            return None


def _extract_address(driver: webdriver.Chrome) -> Optional[str]:
    """주소 추출"""
    try:
        # 주소 버튼 찾기 (data-item-id="address")
        address_element = driver.find_element(By.CSS_SELECTOR, "button[data-item-id='address']")
        address_text = address_element.get_attribute("aria-label")
        if address_text:
            # "주소: ..." 형식에서 주소만 추출
            return address_text.replace("주소:", "").replace("Address:", "").strip()
        return None
    except:
        try:
            # 대체: div.Io6YTe 안의 텍스트
            address_element = driver.find_element(By.CSS_SELECTOR, "div.Io6YTe.fontBodyMedium")
            return address_element.text.strip() if address_element else None
        except:
            return None


def _extract_phone(driver: webdriver.Chrome) -> Optional[str]:
    """전화번호 추출"""
    try:
        # 전화번호 버튼 찾기 (data-item-id="phone:tel:...")
        phone_element = driver.find_element(By.CSS_SELECTOR, "button[data-item-id^='phone']")
        phone_text = phone_element.get_attribute("aria-label")
        if phone_text:
            # "전화번호: ..." 형식에서 번호만 추출
            return phone_text.replace("전화:", "").replace("Phone:", "").strip()
        return None
    except:
        return None


def _extract_website(driver: webdriver.Chrome) -> Optional[str]:
    """웹사이트 추출"""
    try:
        # 웹사이트 링크 찾기 (data-item-id="authority")
        website_element = driver.find_element(By.CSS_SELECTOR, "a[data-item-id='authority']")
        return website_element.get_attribute("href")
    except:
        return None


def _extract_rating_info(driver: webdriver.Chrome) -> Dict[str, Optional[str]]:
    """평점 및 리뷰 수 추출"""
    result = {"rating": None, "review_count": None}

    try:
        # 평점과 리뷰 수가 함께 있는 div 찾기
        rating_element = driver.find_element(By.CSS_SELECTOR, "div.F7nice span[aria-hidden='true']")
        rating_text = rating_element.text.strip()

        # 예: "4.5" 형식
        if rating_text:
            result["rating"] = rating_text

        # 리뷰 수 찾기
        review_element = driver.find_element(By.CSS_SELECTOR, "div.F7nice span span[aria-label*='리뷰'], div.F7nice span span[aria-label*='reviews']")
        review_text = review_element.get_attribute("aria-label")
        if review_text:
            # "리뷰 1,234개" -> "1234"로 변환
            import re
            numbers = re.findall(r'[\d,]+', review_text)
            if numbers:
                result["review_count"] = numbers[0].replace(",", "")

    except:
        pass

    return result


def _extract_place_id_from_url(url: str) -> Optional[str]:
    """URL에서 Place ID 추출"""
    import re
    match = re.search(r"!1s([a-zA-Z0-9_:-]+)", url)
    if match:
        return match.group(1)
    return None
