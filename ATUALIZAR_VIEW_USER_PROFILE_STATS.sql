-- Atualizar view user_profile_stats para incluir bio
-- Execute este script no Supabase SQL Editor

-- Dropar a view existente
DROP VIEW IF EXISTS user_profile_stats;

-- Recriar a view com bio
-- Usa auth.users como base e faz LEFT JOIN com users para pegar name, avatar_url, bio
CREATE OR REPLACE VIEW user_profile_stats AS
SELECT 
  au.id::text AS user_id,
  COALESCE(u.name, au.raw_user_meta_data->>'name', au.email) AS user_name,
  COALESCE(u.avatar_url, au.raw_user_meta_data->>'avatar_url') AS avatar_url,
  u.bio,
  COALESCE(COUNT(DISTINCT p.id), 0) AS posts_count,
  COALESCE(COUNT(DISTINCT CASE WHEN f.following_id::text = au.id::text THEN f.follower_id END), 0) AS followers_count,
  COALESCE(COUNT(DISTINCT CASE WHEN f.follower_id::text = au.id::text THEN f.following_id END), 0) AS following_count,
  COALESCE(SUM(p.points), 0) AS total_points
FROM auth.users au
LEFT JOIN users u ON u.id::text = au.id::text
LEFT JOIN group_posts p ON p.user_id::text = au.id::text
LEFT JOIN user_follows f ON (f.follower_id::text = au.id::text OR f.following_id::text = au.id::text)
GROUP BY au.id, au.email, au.raw_user_meta_data, u.name, u.avatar_url, u.bio;

-- Comentário na view
COMMENT ON VIEW user_profile_stats IS 'Estatísticas e informações do perfil do usuário, incluindo bio';

