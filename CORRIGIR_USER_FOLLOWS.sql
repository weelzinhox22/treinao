-- =====================================================
-- CORREÇÃO PARA TABELA user_follows
-- =====================================================
-- Execute este script se a tabela já existir e estiver dando erro de permissão

-- 1. Se a tabela já existe com UUID, recriar com TEXT
-- =====================================================
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows') THEN
    -- Dropar dependências primeiro
    DROP VIEW IF EXISTS user_profile_stats CASCADE;
    DROP FUNCTION IF EXISTS notify_user_followed() CASCADE;
    DROP FUNCTION IF EXISTS is_following(UUID, UUID) CASCADE;
    DROP FUNCTION IF EXISTS get_followers_count(UUID) CASCADE;
    DROP FUNCTION IF EXISTS get_following_count(UUID) CASCADE;
    
    -- Dropar a tabela
    DROP TABLE IF EXISTS user_follows CASCADE;
  END IF;
END $$;

-- 2. Recriar tabela com TEXT
-- =====================================================
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- 3. Criar índices
-- =====================================================
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

-- 4. Recriar trigger de notificação
-- =====================================================
CREATE OR REPLACE FUNCTION notify_user_followed()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name TEXT;
  v_follower_avatar TEXT;
BEGIN
  SELECT 
    COALESCE(raw_user_meta_data->>'name', email),
    COALESCE(raw_user_meta_data->>'avatar_url', NULL)
  INTO v_follower_name, v_follower_avatar
  FROM auth.users
  WHERE id::text = NEW.follower_id;
  
  IF v_follower_name IS NOT NULL THEN
    -- Converter following_id de TEXT para UUID para a função create_notification
    PERFORM create_notification(
      NEW.following_id::uuid,
      'follow',
      'Novo seguidor!',
      v_follower_name || ' começou a te seguir',
      jsonb_build_object(
        'follower_id', NEW.follower_id,
        'follower_name', v_follower_name,
        'follower_avatar', v_follower_avatar
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_user_followed ON user_follows;
CREATE TRIGGER trigger_notify_user_followed
AFTER INSERT ON user_follows
FOR EACH ROW EXECUTE FUNCTION notify_user_followed();

-- 5. Recriar funções
-- =====================================================
CREATE OR REPLACE FUNCTION is_following(p_follower_id TEXT, p_following_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = p_follower_id
      AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_followers_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_follows
  WHERE following_id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_following_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_follows
  WHERE follower_id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar view
-- =====================================================
CREATE OR REPLACE VIEW user_profile_stats AS
SELECT 
  u.id::text as user_id,
  COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id::text) as followers_count,
  (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id::text) as following_count,
  (SELECT COUNT(*) FROM group_posts WHERE user_id::text = u.id::text) as posts_count,
  (SELECT COALESCE(SUM(points), 0) FROM group_posts WHERE user_id::text = u.id::text) as total_points
FROM auth.users u;

-- 7. RLS Policies
-- =====================================================
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
CREATE POLICY "Users can view follows"
ON user_follows FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others"
ON user_follows FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = follower_id
);

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow"
ON user_follows FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = follower_id
);

