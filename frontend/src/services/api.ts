import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  BusinessCreate,
  ScanConfig,
  ScanProgress,
  ScanResults,
  ScanCreateResponse,
} from '../types';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Axios instance for backend API
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: backendUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Business API functions
export const businessApi = {
  create: async (data: BusinessCreate) => {
    const response = await apiClient.post('/api/business', data);
    return response.data;
  },

  get: async (businessId: string) => {
    const response = await apiClient.get(`/api/business/${businessId}`);
    return response.data;
  },

  scrape: async (googleMapsUrl: string) => {
    const response = await apiClient.post('/api/business/scrape', {
      google_maps_url: googleMapsUrl
    });
    return response.data;
  },
};

// Scan API functions
export const scanApi = {
  create: async (config: ScanConfig): Promise<ScanCreateResponse> => {
    const response = await apiClient.post('/api/scan', config);
    return response.data;
  },

  getProgress: async (scanId: string): Promise<ScanProgress> => {
    const response = await apiClient.get(`/api/scan/${scanId}`);
    return response.data;
  },

  getResults: async (scanId: string): Promise<ScanResults> => {
    const response = await apiClient.get(`/api/results/${scanId}`);
    return response.data;
  },

  cancel: async (scanId: string) => {
    const response = await apiClient.post(`/api/scan/${scanId}/cancel`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
