// Business types
export interface Business {
  id: string;
  name: string;
  google_maps_url: string;
  place_id?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessCreate {
  name: string;
  google_maps_url: string;
  place_id?: string;
  address?: string;
}

// Scan configuration types
export interface ScanConfig {
  google_maps_url: string;
  business_name: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  grid_size: number;
  search_query: string;
}

// Scan progress types
export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScanProgress {
  scan_id: string;
  status: ScanStatus;
  progress_percent: number;
  completed_points: number;
  total_points: number;
  average_rank?: number;
  message?: string;
}

// Grid point types
export interface GridPoint {
  id?: string;
  snapshot_id?: string;
  grid_row: number;
  grid_col: number;
  row: number;
  col: number;
  lat: number;
  lng: number;
  rank: number | null;
  found: boolean;
  business_name_in_result?: string | null;
}

// Scan results types
export interface ScanResults {
  scan_id: string;
  business_name: string;
  status: ScanStatus;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  grid_size: number;
  average_rank: number | null;
  best_rank: number | null;
  worst_rank: number | null;
  found_count: number;
  not_found_count: number;
  grid_points: GridPoint[];
  created_at: string;
  completed_at: string | null;
  started_at?: string | null;
}

// Type alias for convenience
export type ScanResult = ScanResults

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScanCreateResponse {
  snapshot_id: string;
  business_id: string;
  message: string;
  status: string;
}
