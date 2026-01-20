// src/lib/supabase/admin.ts
// Service Role Key를 사용하는 관리자용 클라이언트 (서버 사이드 전용)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey === 'your_service_role_key') {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isAdminConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey !== 'your_service_role_key'
  );
}
