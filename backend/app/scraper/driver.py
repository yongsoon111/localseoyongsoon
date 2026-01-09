"""
Selenium WebDriver 설정 및 관리
"""
import os
import random
import shutil
from typing import Optional
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options


USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
]


def create_driver(headless: bool = True) -> webdriver.Chrome:
    """
    Chrome WebDriver 생성

    Args:
        headless: Headless 모드 활성화 여부

    Returns:
        설정된 Chrome WebDriver
    """
    options = Options()

    # Headless 모드
    if headless:
        options.add_argument("--headless=new")

    # User-Agent 랜덤 설정
    user_agent = random.choice(USER_AGENTS)
    options.add_argument(f"user-agent={user_agent}")

    # WebDriver 감지 방지
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    # 성능 최적화
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")

    # ChromeDriver 경로 설정
    # Production 환경 (Render 등): 시스템에 설치된 chromedriver 사용
    driver_path = shutil.which('chromedriver')

    if driver_path:
        # System chromedriver found (production)
        service = Service(driver_path)
    else:
        # Development: use webdriver-manager
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            driver_path = ChromeDriverManager().install()
            # Fix webdriver-manager bug: ensure we use the actual chromedriver binary
            if 'THIRD_PARTY_NOTICES' in driver_path:
                driver_dir = os.path.dirname(driver_path)
                driver_path = os.path.join(driver_dir, 'chromedriver')
            service = Service(driver_path)
        except ImportError:
            # webdriver-manager not available, use default
            service = Service()

    driver = webdriver.Chrome(service=service, options=options)

    # WebDriver 속성 숨기기
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        },
    )

    return driver


def close_driver(driver: Optional[webdriver.Chrome]) -> None:
    """
    WebDriver 안전하게 종료

    Args:
        driver: 종료할 WebDriver 인스턴스
    """
    if driver:
        try:
            driver.quit()
        except Exception:
            pass
