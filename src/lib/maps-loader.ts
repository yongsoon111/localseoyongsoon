// src/lib/maps-loader.ts

let mapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Google Maps API 로드 (스크립트 태그 방식)
 */
export async function loadGoogleMaps(): Promise<void> {
  // 이미 로드됨
  if (mapsLoaded && typeof google !== 'undefined') {
    return;
  }

  // 로딩 중이면 기존 Promise 반환
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (typeof google !== 'undefined' && google.maps) {
      mapsLoaded = true;
      resolve();
      return;
    }

    // 기존 스크립트 확인
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // 이미 스크립트가 있으면 로드 완료 대기
      const checkLoaded = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps) {
          mapsLoaded = true;
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ko`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Google Maps API가 로드되었는지 확인
 */
export function isGoogleMapsLoaded(): boolean {
  return mapsLoaded && typeof google !== 'undefined';
}
