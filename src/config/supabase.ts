// Configuração do Supabase
// ⚠️ SEGURANÇA: Usamos apenas a anon key no frontend
// A service role key NUNCA deve ser usada no frontend

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado. Usando localStorage como fallback.');
}

// Criar cliente Supabase apenas se as variáveis estiverem configuradas
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

// Tabelas do Supabase:
// - users: id, email, name, created_at
// - treinos: id, user_id, name, date, exercises (jsonb), total_volume, created_at
// - fotos: id, user_id, url, date, description, created_at
// - metas: id, user_id, type, exercise_name, target, current, unit, description, deadline, achieved, created_at
// - achievements: id, user_id, badge_id, unlocked_at
// - templates: id, user_id, name, description, exercises (jsonb), category, is_default, created_at

