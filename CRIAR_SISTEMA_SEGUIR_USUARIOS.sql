-- =====================================================
-- SISTEMA DE SEGUIR USUÁRIOS (INSTAGRAM STYLE)
-- =====================================================
-- Este script cria:
-- - Tabela de relacionamentos (follows)
-- - Triggers para notificações
-- - Views para estatísticas

-- 1. TABELA DE SEGUIR/SEGUIDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id TEXT NOT NULL, -- UUID como TEXT para compatibilidade
  following_id TEXT NOT NULL, -- UUID como TEXT para compatibilidade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um usuário só pode seguir outro uma vez
  UNIQUE(follower_id, following_id),
  
  -- Não pode seguir a si mesmo
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Índices (criar apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_follows_follower') THEN
    CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_follows_following') THEN
    CREATE INDEX idx_user_follows_following ON user_follows(following_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_follows_created_at') THEN
    CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);
  END IF;
END $$;

-- 2. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM TE SEGUE
-- =====================================================
CREATE OR REPLACE FUNCTION notify_user_followed()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name TEXT;
  v_follower_avatar TEXT;
BEGIN
  -- Buscar nome e avatar de quem está seguindo
  -- Usar função SECURITY DEFINER para acessar auth.users
  SELECT 
    COALESCE(raw_user_meta_data->>'name', email),
    COALESCE(raw_user_meta_data->>'avatar_url', NULL)
  INTO v_follower_name, v_follower_avatar
  FROM auth.users
  WHERE id::text = NEW.follower_id;
  
  -- Criar notificação apenas se encontrou o usuário
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

-- 3. FUNÇÕES ÚTEIS
-- =====================================================

-- Verificar se usuário A segue usuário B
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id::text = p_follower_id::text
      AND following_id::text = p_following_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contar seguidores de um usuário
CREATE OR REPLACE FUNCTION get_followers_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_follows
  WHERE following_id::text = p_user_id::text;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contar quem o usuário segue
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_follows
  WHERE follower_id::text = p_user_id::text;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VIEW PARA ESTATÍSTICAS DE PERFIL
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

-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;

-- Usuários podem ver quem segue/quem é seguido
CREATE POLICY "Users can view follows"
ON user_follows FOR SELECT
USING (true);

-- Usuários podem seguir outros
CREATE POLICY "Users can follow others"
ON user_follows FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = follower_id::text
);

-- Usuários podem deixar de seguir
CREATE POLICY "Users can unfollow"
ON user_follows FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = follower_id::text
);

-- Comentários
COMMENT ON TABLE user_follows IS 'Sistema de seguir/seguidores estilo Instagram';
COMMENT ON FUNCTION is_following IS 'Verifica se um usuário segue outro';
COMMENT ON FUNCTION get_followers_count IS 'Conta quantos seguidores um usuário tem';
COMMENT ON FUNCTION get_following_count IS 'Conta quantas pessoas um usuário segue';

