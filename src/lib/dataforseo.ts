// src/lib/dataforseo.ts

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

function getAuthHeader(): string {
  const credentials = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

interface DataForSEOResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: {
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: Record<string, unknown>;
    result: T[] | null;
  }[];
}

// Google Reviews 관련 타입
export interface DataForSEOReview {
  review_id: string;
  rating: {
    rating_type: string;
    value: number;
    max_value: number;
  };
  review_text: string;
  original_review_text: string | null; // 원본 언어 리뷰 텍스트
  original_language: string | null;    // 원본 언어 코드 (en, ja, ko 등)
  review_url: string;
  original_review_url: string;
  time_ago: string;
  timestamp: string;
  review_images: string[] | null;
  profile_name: string;
  profile_url: string;
  profile_image_url: string;
  owner_answer: string | null;
  owner_answer_timestamp: string | null;
  local_guide: boolean;
  reviews_count: number;
  photos_count: number;
}

export interface ReviewsResult {
  keyword: string;
  cid: string;
  place_id: string;
  rating: {
    rating_type: string;
    value: number;
    max_value: number;
    rating_count: number;
  };
  reviews_count: number;
  items_count: number;
  items: DataForSEOReview[];
}

// SERP 관련 타입
export interface SERPLocalPackItem {
  rank_group: number;
  rank_absolute: number;
  title: string;
  domain: string;
  url: string;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
  };
  cid: string;
  is_paid: boolean;
}

export interface SERPResult {
  keyword: string;
  check_url: string;
  items: SERPLocalPackItem[];
}

/**
 * Google Reviews 수집 - Task POST
 */
export async function postGoogleReviewsTask(params: {
  placeId?: string;
  keyword?: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
  sortBy?: 'newest' | 'highest_rating' | 'lowest_rating' | 'relevant';
}): Promise<string> {
  const {
    placeId,
    keyword,
    locationName = 'South Korea',
    languageCode = 'ko', // API 작동을 위해 필수 (원본은 original_review_text로 제공됨)
    depth = 100,
    sortBy = 'newest',
  } = params;

  if (!placeId && !keyword) {
    throw new Error('placeId 또는 keyword가 필요합니다');
  }

  const taskData: Record<string, unknown>[] = [{
    ...(placeId ? { place_id: placeId } : { keyword }),
    location_name: locationName,
    ...(languageCode && { language_code: languageCode }),
    depth,
    sort_by: sortBy,
  }];

  console.log('[DataForSEO] Reviews task_post 요청:', JSON.stringify(taskData));

  const response = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/task_post', {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  const data: DataForSEOResponse<unknown> = await response.json();

  console.log('[DataForSEO] Reviews task_post 응답:', JSON.stringify({
    status_code: data.status_code,
    status_message: data.status_message,
    tasks_count: data.tasks?.length,
    task_id: data.tasks?.[0]?.id,
    task_status_code: data.tasks?.[0]?.status_code,
    task_status_message: data.tasks?.[0]?.status_message,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];
  const taskId = task?.id;

  // 개별 태스크 상태 확인 (40501 = Invalid Field 등)
  if (task?.status_code && task.status_code !== 20100 && task.status_code !== 20000) {
    console.error(`[DataForSEO] Task creation error: ${task.status_code} - ${task.status_message}`);
    throw new Error(`태스크 생성 실패: ${task.status_message}`);
  }

  if (!taskId) {
    throw new Error('Task ID를 받지 못했습니다');
  }

  console.log(`[DataForSEO] Reviews 태스크 생성 완료: ${taskId}`);
  return taskId;
}

/**
 * Google Reviews 결과 조회 - Task GET
 */
export async function getGoogleReviewsResult(taskId: string): Promise<ReviewsResult | null> {
  const response = await fetch(`https://api.dataforseo.com/v3/business_data/google/reviews/task_get/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  const data: DataForSEOResponse<ReviewsResult> = await response.json();

  console.log(`[DataForSEO] task_get response:`, JSON.stringify({
    status_code: data.status_code,
    status_message: data.status_message,
    task_status_code: data.tasks?.[0]?.status_code,
    task_status_message: data.tasks?.[0]?.status_message,
    result_count: data.tasks?.[0]?.result_count,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];

  // 40102 = No Search Results - 영구 에러, 재시도 불필요
  if (task.status_code === 40102) {
    throw new Error('검색 결과 없음: 비즈니스 이름을 정확히 입력해주세요');
  }

  // 40401 = Task Not Found - 태스크가 만료되었거나 존재하지 않음
  if (task.status_code === 40401 || task.status_message?.includes('Task Not Found')) {
    console.error(`[DataForSEO] Task Not Found: ${taskId}`);
    // 특별한 에러로 표시하여 재시도 가능하도록 함
    const error = new Error('TASK_NOT_FOUND');
    (error as any).retryable = true;
    throw error;
  }

  // 아직 처리 중 (20100 = Task Created, 40601 = Task Handed, 40602 = Task In Queue)
  if (task.status_code === 20100 ||
      task.status_code === 40601 ||
      task.status_code === 40602 ||
      task.status_message?.includes('Queue') ||
      task.status_message?.includes('In Progress') ||
      task.status_message?.includes('Handed')) {
    console.log(`[DataForSEO] Task ${taskId} still processing: ${task.status_code} - ${task.status_message}`);
    return null;
  }

  if (task.status_code !== 20000) {
    console.error(`[DataForSEO] Task error: ${task.status_code} - ${task.status_message}`);
    throw new Error(`Task Error: ${task.status_message}`);
  }

  console.log(`[DataForSEO] Task ${taskId} completed, items: ${task.result?.[0]?.items_count}`);
  return task.result?.[0] || null;
}

/**
 * Google Reviews 수집 (폴링 방식 + 재시도)
 */
export async function fetchGoogleReviews(params: {
  placeId?: string;
  keyword?: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
  sortBy?: 'newest' | 'highest_rating' | 'lowest_rating' | 'relevant';
  maxWaitMs?: number;
  pollIntervalMs?: number;
  maxRetries?: number;
}): Promise<ReviewsResult> {
  const { maxWaitMs = 300000, pollIntervalMs = 5000, maxRetries = 3, ...taskParams } = params;

  let lastError: Error | null = null;

  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      if (retry > 0) {
        console.log(`[DataForSEO] Reviews 재시도 ${retry}/${maxRetries}...`);
      }

      const taskId = await postGoogleReviewsTask(taskParams);
      console.log(`[DataForSEO] Reviews 태스크 폴링 시작: ${taskId}`);

      const startTime = Date.now();
      let pollCount = 0;

      while (Date.now() - startTime < maxWaitMs) {
        pollCount++;
        try {
          const result = await getGoogleReviewsResult(taskId);

          if (result) {
            console.log(`[DataForSEO] Reviews 수집 완료 (${pollCount}회 폴링, ${Math.round((Date.now() - startTime) / 1000)}초)`);
            return result;
          }
        } catch (pollError: any) {
          // TASK_NOT_FOUND 에러는 재시도 가능
          if (pollError.message === 'TASK_NOT_FOUND' && pollError.retryable) {
            console.log(`[DataForSEO] Task Not Found - 새 태스크로 재시도...`);
            break; // 내부 while 루프 탈출, for 루프에서 재시도
          }
          throw pollError; // 다른 에러는 그대로 throw
        }

        // 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      // 시간 초과 시 다음 재시도
      console.log(`[DataForSEO] 태스크 ${taskId} 시간 초과, 재시도...`);
    } catch (error) {
      lastError = error as Error;
      console.error(`[DataForSEO] Reviews 에러 (시도 ${retry + 1}/${maxRetries}):`, lastError.message);

      // 재시도 불가능한 에러는 바로 throw
      if (lastError.message.includes('검색 결과 없음') || lastError.message.includes('비즈니스 이름')) {
        throw lastError;
      }

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (retry < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError || new Error('리뷰 수집 실패: 최대 재시도 횟수 초과');
}

/**
 * SERP Local Pack 조회 - Task POST
 */
export async function postSERPLocalPackTask(params: {
  keyword: string;
  locationName?: string;
  locationCoordinate?: string; // "lat,lng,radius" 형식
  languageCode?: string;
}): Promise<string> {
  const {
    keyword,
    locationName = 'South Korea',
    locationCoordinate,
    languageCode = 'ko',
  } = params;

  const taskData: Record<string, unknown>[] = [{
    keyword,
    location_name: locationName,
    ...(locationCoordinate && { location_coordinate: locationCoordinate }),
    language_code: languageCode,
    device: 'desktop',
    os: 'windows',
  }];

  const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/task_post', {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  const data: DataForSEOResponse<unknown> = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO SERP Error: ${data.status_message}`);
  }

  const taskId = data.tasks[0]?.id;
  if (!taskId) {
    throw new Error('Task ID를 받지 못했습니다');
  }

  return taskId;
}

/**
 * SERP 결과 조회 - Task GET
 */
export async function getSERPResult(taskId: string): Promise<SERPResult | null> {
  const response = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  const data: DataForSEOResponse<SERPResult> = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];

  if (task.status_code === 20100) {
    return null;
  }

  if (task.status_code !== 20000) {
    throw new Error(`Task Error: ${task.status_message}`);
  }

  return task.result?.[0] || null;
}

/**
 * SERP Local Pack 조회 (폴링 방식)
 */
export async function fetchSERPLocalPack(params: {
  keyword: string;
  locationName?: string;
  locationCoordinate?: string;
  languageCode?: string;
  maxWaitMs?: number;
  pollIntervalMs?: number;
}): Promise<SERPResult> {
  const { maxWaitMs = 60000, pollIntervalMs = 2000, ...taskParams } = params;

  const taskId = await postSERPLocalPackTask(taskParams);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getSERPResult(taskId);

    if (result) {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('SERP 조회 시간 초과');
}

/**
 * API 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    });

    const data = await response.json();
    return data.status_code === 20000;
  } catch {
    return false;
  }
}

// Google My Business Info 관련 타입
export interface LocalBusinessLink {
  title: string;
  url: string;
  type?: string;
}

export interface PlaceTopic {
  title: string;
  count?: number;
}

export interface BusinessInfoResult {
  keyword: string;
  cid: string;
  place_id: string;
  title: string;
  original_title?: string; // 원본 제목 (로컬 언어)
  category: string;
  category_ids?: string[];
  additional_categories?: string[]; // 서브 카테고리들
  address: string;
  address_info: {
    city: string;
    region: string;
    country_code: string;
  } | null;
  phone: string;
  url: string;
  domain: string;
  logo?: string;
  main_image: string;
  total_photos: number;
  rating: {
    rating_type: string;
    value: number;
    max_value: number;
    rating_count: number;
    votes_count?: number;
  } | null;
  rating_distribution?: Record<string, number>; // 별점 분포
  hotel_rating: number | null;
  price_level: string;
  latitude: number;
  longitude: number;
  is_claimed: boolean;
  description: string;
  snippet?: string;
  attributes: {
    available_attributes?: Record<string, string[]>;
    unavailable_attributes?: Record<string, string[]>;
    service_options?: string[];
    accessibility?: string[];
    offerings?: string[];
    amenities?: string[];
    atmosphere?: string[];
    crowd?: string[];
    planning?: string[];
    [key: string]: string[] | Record<string, string[]> | undefined;
  } | null;
  work_hours: {
    work_hours: {
      day: string;
      time: { open: { hour: number; minute: number }; close: { hour: number; minute: number } }[];
    }[];
  } | null;
  // 대안 필드명들 (DataForSEO가 다른 필드명을 사용할 수 있음)
  work_time?: {
    work_hours?: {
      timetable?: Record<string, { open: { hour: number; minute: number }; close: { hour: number; minute: number } }[]>;
      current_status?: string;
    };
  };
  hours?: unknown;
  opening_hours?: unknown;
  business_hours?: unknown;
  // 추가 데이터
  local_business_links?: LocalBusinessLink[]; // 예약, 메뉴, 주문 링크
  place_topics?: Record<string, number> | PlaceTopic[]; // 리뷰에서 추출된 키워드 (객체 또는 배열)
  people_also_search?: { title: string; cid: string; rating?: { value: number } }[];
  popular_times?: Record<string, { time: number; popular_index: number }[]>;
}

/**
 * Google My Business Info 조회 - Live 엔드포인트 (즉시 결과)
 */
export async function fetchGoogleBusinessInfo(params: {
  keyword: string;
  locationName?: string;
  languageCode?: string;
}): Promise<BusinessInfoResult> {
  const {
    keyword,
    locationName = 'South Korea',
    languageCode = 'ko',
  } = params;

  const taskData: Record<string, unknown>[] = [{
    keyword,
    location_name: locationName,
    language_code: languageCode,
  }];

  console.log(`[DataForSEO] Fetching business info (Live) for: ${keyword}`);

  const response = await fetch('https://api.dataforseo.com/v3/business_data/google/my_business_info/live', {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  const data: DataForSEOResponse<BusinessInfoResult> = await response.json();

  console.log(`[DataForSEO] Live response:`, JSON.stringify({
    status_code: data.status_code,
    status_message: data.status_message,
    task_status_code: data.tasks?.[0]?.status_code,
    result_count: data.tasks?.[0]?.result_count,
  }));

  // 전체 응답 구조 확인
  console.log(`[DataForSEO] Full task result:`, JSON.stringify(data.tasks?.[0]?.result, null, 2));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];

  if (task.status_code !== 20000) {
    throw new Error(`Task Error: ${task.status_message}`);
  }

  // DataForSEO 응답 구조: result[0].items[0]에 비즈니스 정보가 있음
  const resultWrapper = task.result?.[0] as { items?: BusinessInfoResult[] } | undefined;

  if (!resultWrapper) {
    console.log(`[DataForSEO] No result wrapper found`);
    throw new Error('비즈니스 정보를 찾을 수 없습니다');
  }

  console.log(`[DataForSEO] Result wrapper keys:`, Object.keys(resultWrapper));

  // items 배열에서 첫 번째 항목 가져오기
  const items = resultWrapper.items;
  if (!items || items.length === 0) {
    console.log(`[DataForSEO] No items in result:`, JSON.stringify(resultWrapper));
    throw new Error('비즈니스 정보를 찾을 수 없습니다');
  }

  const result = items[0];

  if (!result || !result.title) {
    console.log(`[DataForSEO] Item missing title:`, JSON.stringify(result));
    throw new Error('비즈니스 정보를 찾을 수 없습니다');
  }

  console.log(`[DataForSEO] Found business: ${result.title}`);
  return result;
}

// GMB Updates 관련 타입
export interface GMBUpdateItem {
  rank_group: number;
  rank_absolute: number;
  author: string;
  post_text: string;
  snippet: string | null;
  post_date: string;  // "mm/dd/yyyy hh:mm:ss" 형식
  timestamp: string;  // UTC 형식
  images_url: string[] | null;
  url: string;
  links: { type: string; title: string; url: string }[] | null;
}

export interface GMBUpdatesResult {
  keyword: string;
  cid: string;
  check_url: string;
  datetime: string;
  items_count: number;
  items: GMBUpdateItem[];
}

// Q&A 관련 타입
export interface QAAnswerItem {
  answer_id: string;
  answer_text: string;
  original_answer_text: string | null;
  profile_name: string;
  profile_url: string;
  profile_image_url: string;
  timestamp: string;
  time_ago: string;
}

export interface QAQuestionItem {
  type: string;
  question_id: string;
  question_text: string;
  original_question_text: string | null;
  profile_name: string;
  profile_url: string;
  profile_image_url: string;
  timestamp: string;
  time_ago: string;
  items?: QAAnswerItem[];  // 답변 배열
}

export interface QAResult {
  keyword: string;
  cid: string;
  check_url: string;
  datetime: string;
  items_count: number;
  items: QAQuestionItem[];  // 답변이 있는 질문들
  items_without_answers: QAQuestionItem[];  // 답변이 없는 질문들
}

/**
 * GMB Updates (게시물/소식) 수집 - Task POST
 */
export async function postGMBUpdatesTask(params: {
  keyword: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
}): Promise<string> {
  const {
    keyword,
    locationName = 'South Korea',
    languageCode = 'ko',
    depth = 20,
  } = params;

  const taskData: Record<string, unknown>[] = [{
    keyword,
    location_name: locationName,
    language_code: languageCode,
    depth,
  }];

  console.log('[DataForSEO] GMB Updates task_post 요청:', JSON.stringify(taskData));

  const response = await fetch('https://api.dataforseo.com/v3/business_data/google/my_business_updates/task_post', {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  const data: DataForSEOResponse<unknown> = await response.json();

  console.log('[DataForSEO] GMB Updates task_post 응답:', JSON.stringify({
    status_code: data.status_code,
    status_message: data.status_message,
    task_id: data.tasks?.[0]?.id,
    task_status_code: data.tasks?.[0]?.status_code,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];
  if (task?.status_code && task.status_code !== 20100 && task.status_code !== 20000) {
    throw new Error(`태스크 생성 실패: ${task.status_message}`);
  }

  const taskId = task?.id;
  if (!taskId) {
    throw new Error('Task ID를 받지 못했습니다');
  }

  return taskId;
}

/**
 * GMB Updates 결과 조회 - Task GET
 */
export async function getGMBUpdatesResult(taskId: string): Promise<GMBUpdatesResult | null> {
  const response = await fetch(`https://api.dataforseo.com/v3/business_data/google/my_business_updates/task_get/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  const data: DataForSEOResponse<GMBUpdatesResult> = await response.json();

  console.log(`[DataForSEO] GMB Updates task_get 응답:`, JSON.stringify({
    status_code: data.status_code,
    task_status_code: data.tasks?.[0]?.status_code,
    result_count: data.tasks?.[0]?.result_count,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];

  // 아직 처리 중
  if (task.status_code === 20100 || task.status_code === 40601 || task.status_code === 40602) {
    return null;
  }

  if (task.status_code !== 20000) {
    // 결과 없음은 빈 결과로 처리
    if (task.status_code === 40102) {
      return {
        keyword: '',
        cid: '',
        check_url: '',
        datetime: new Date().toISOString(),
        items_count: 0,
        items: [],
      };
    }
    throw new Error(`Task Error: ${task.status_message}`);
  }

  return task.result?.[0] || null;
}

/**
 * GMB Updates 수집 (폴링 방식)
 */
export async function fetchGMBUpdates(params: {
  keyword: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
  maxWaitMs?: number;
  pollIntervalMs?: number;
}): Promise<GMBUpdatesResult> {
  const { maxWaitMs = 60000, pollIntervalMs = 3000, ...taskParams } = params;

  const taskId = await postGMBUpdatesTask(taskParams);
  console.log(`[DataForSEO] GMB Updates 태스크 폴링 시작: ${taskId}`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getGMBUpdatesResult(taskId);

    if (result) {
      console.log(`[DataForSEO] GMB Updates 수집 완료, items: ${result.items_count}`);
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('GMB Updates 조회 시간 초과');
}

/**
 * Q&A (질문과 답변) 수집 - Task POST
 */
export async function postQATask(params: {
  keyword: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
}): Promise<string> {
  const {
    keyword,
    locationName = 'South Korea',
    languageCode = 'ko',
    depth = 20,
  } = params;

  const taskData: Record<string, unknown>[] = [{
    keyword,
    location_name: locationName,
    language_code: languageCode,
    depth,
  }];

  console.log('[DataForSEO] Q&A task_post 요청:', JSON.stringify(taskData));

  const response = await fetch('https://api.dataforseo.com/v3/business_data/google/questions_and_answers/task_post', {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  const data: DataForSEOResponse<unknown> = await response.json();

  console.log('[DataForSEO] Q&A task_post 응답:', JSON.stringify({
    status_code: data.status_code,
    status_message: data.status_message,
    task_id: data.tasks?.[0]?.id,
    task_status_code: data.tasks?.[0]?.status_code,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];
  if (task?.status_code && task.status_code !== 20100 && task.status_code !== 20000) {
    throw new Error(`태스크 생성 실패: ${task.status_message}`);
  }

  const taskId = task?.id;
  if (!taskId) {
    throw new Error('Task ID를 받지 못했습니다');
  }

  return taskId;
}

/**
 * Q&A 결과 조회 - Task GET
 */
export async function getQAResult(taskId: string): Promise<QAResult | null> {
  const response = await fetch(`https://api.dataforseo.com/v3/business_data/google/questions_and_answers/task_get/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  const data: DataForSEOResponse<QAResult> = await response.json();

  console.log(`[DataForSEO] Q&A task_get 응답:`, JSON.stringify({
    status_code: data.status_code,
    task_status_code: data.tasks?.[0]?.status_code,
    result_count: data.tasks?.[0]?.result_count,
  }));

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO Error: ${data.status_message}`);
  }

  const task = data.tasks[0];

  // 아직 처리 중
  if (task.status_code === 20100 || task.status_code === 40601 || task.status_code === 40602) {
    return null;
  }

  if (task.status_code !== 20000) {
    // 결과 없음은 빈 결과로 처리
    if (task.status_code === 40102) {
      return {
        keyword: '',
        cid: '',
        check_url: '',
        datetime: new Date().toISOString(),
        items_count: 0,
        items: [],
        items_without_answers: [],
      };
    }
    throw new Error(`Task Error: ${task.status_message}`);
  }

  return task.result?.[0] || null;
}

/**
 * Q&A 수집 (폴링 방식)
 */
export async function fetchQA(params: {
  keyword: string;
  locationName?: string;
  languageCode?: string;
  depth?: number;
  maxWaitMs?: number;
  pollIntervalMs?: number;
}): Promise<QAResult> {
  const { maxWaitMs = 60000, pollIntervalMs = 3000, ...taskParams } = params;

  const taskId = await postQATask(taskParams);
  console.log(`[DataForSEO] Q&A 태스크 폴링 시작: ${taskId}`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getQAResult(taskId);

    if (result) {
      console.log(`[DataForSEO] Q&A 수집 완료, items: ${result.items_count}`);
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Q&A 조회 시간 초과');
}

// 순위 체크 결과 타입
export interface RankingResult {
  lat: number;
  lng: number;
  rank: number | null;
  competitors: {
    rank: number;
    name: string;
    placeId: string;
    rating: number;
  }[];
}

// 비즈니스 이름 정규화 (매칭용)
function normalizeBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣ぁ-んァ-ヶー一-龯]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ') // 공백 정규화
    .trim();
}

// 두 좌표 간 거리 계산 (미터)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}

/**
 * 특정 위치에서 키워드 검색 순위 체크 (SERP 사용)
 */
export async function checkRankingWithDataForSEO(
  keyword: string,
  lat: number,
  lng: number,
  targetPlaceId: string,
  targetBusinessName?: string,
  targetBusinessLat?: number,
  targetBusinessLng?: number
): Promise<RankingResult> {
  try {
    // locationCoordinate 형식: "lat,lng,radius"
    const locationCoordinate = `${lat},${lng},1000`;

    const result = await fetchSERPLocalPack({
      keyword,
      locationCoordinate,
      maxWaitMs: 30000,
    });

    // Local Pack 아이템에서 순위 찾기
    interface SERPItem {
      type?: string;
      cid?: string;
      title?: string;
      rating?: { value?: number; votes_count?: number };
      rank_group?: number;
      latitude?: number;
      longitude?: number;
    }

    const items = (result as unknown as { items?: SERPItem[] })?.items || [];
    const localPackItems = items.filter((item: SERPItem) => item.type === 'local_pack');

    const competitors = localPackItems.slice(0, 10).map((item: SERPItem, index: number) => ({
      rank: index + 1,
      name: item.title || '',
      placeId: item.cid || '',
      rating: item.rating?.value || 0,
    }));

    // 타겟 비즈니스 순위 찾기
    // 1. CID로 찾기 (DataForSEO의 CID와 Place ID가 같은 경우)
    let targetIndex = localPackItems.findIndex((item: SERPItem) => item.cid === targetPlaceId);

    // 2. CID로 못 찾으면 비즈니스 이름 + 위치로 찾기
    if (targetIndex === -1 && targetBusinessName) {
      const normalizedTarget = normalizeBusinessName(targetBusinessName);

      targetIndex = localPackItems.findIndex((item: SERPItem) => {
        const normalizedItem = normalizeBusinessName(item.title || '');

        // 이름이 매칭되는지 확인
        const nameMatches = normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem);

        if (!nameMatches) return false;

        // 이름이 매칭되면, 위치 정보가 있을 경우 위치도 확인 (500m 이내)
        if (targetBusinessLat !== undefined && targetBusinessLng !== undefined &&
            item.latitude !== undefined && item.longitude !== undefined) {
          const distance = calculateDistance(
            targetBusinessLat,
            targetBusinessLng,
            item.latitude,
            item.longitude
          );
          return distance <= 500; // 500m 이내만 같은 비즈니스로 간주
        }

        // 위치 정보가 없으면 이름만으로 매칭
        return true;
      });
    }

    return {
      lat,
      lng,
      rank: targetIndex >= 0 ? targetIndex + 1 : null,
      competitors,
    };
  } catch (error) {
    console.error(`Ranking check error at (${lat}, ${lng}):`, error);
    return {
      lat,
      lng,
      rank: null,
      competitors: [],
    };
  }
}
