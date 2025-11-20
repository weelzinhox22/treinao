-- =====================================================
-- NOTIFICAÇÕES PARA TREINOS COMPARTILHADOS (FEED GERAL)
-- =====================================================
-- Este script cria triggers para notificações quando alguém
-- curte ou comenta em treinos compartilhados no feed geral

-- 1. CRIAR TABELA DE LIKES DE TREINOS COMPARTILHADOS
-- =====================================================
-- Se não existir, criar tabela para armazenar likes individuais
CREATE TABLE IF NOT EXISTS treino_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_treino_id TEXT NOT NULL REFERENCES shared_treinos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um usuário só pode curtir uma vez
  UNIQUE(shared_treino_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_treino_likes_shared_treino ON treino_likes(shared_treino_id);
CREATE INDEX IF NOT EXISTS idx_treino_likes_user ON treino_likes(user_id);

-- RLS
ALTER TABLE treino_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view treino likes" ON treino_likes;
CREATE POLICY "Users can view treino likes"
ON treino_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can like treinos" ON treino_likes;
CREATE POLICY "Users can like treinos"
ON treino_likes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can unlike treinos" ON treino_likes;
CREATE POLICY "Users can unlike treinos"
ON treino_likes FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- 2. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM CURTE SEU TREINO COMPARTILHADO
-- =====================================================
CREATE OR REPLACE FUNCTION notify_shared_treino_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_treino_owner_id TEXT;
  v_treino_title TEXT;
  v_liker_name TEXT;
BEGIN
  -- Buscar dono do treino compartilhado
  SELECT user_id, COALESCE(treino_data->>'name', 'Treino') INTO v_treino_owner_id, v_treino_title
  FROM shared_treinos
  WHERE id = NEW.shared_treino_id;
  
  -- Usar o user_name que já vem no NEW
  v_liker_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_treino_owner_id IS NOT NULL AND v_treino_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_treino_owner_id::uuid,
      'like',
      'Nova curtida!',
      v_liker_name || ' curtiu seu treino: ' || v_treino_title,
      jsonb_build_object(
        'shared_treino_id', NEW.shared_treino_id,
        'user_id', NEW.user_id,
        'user_name', v_liker_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_shared_treino_liked ON treino_likes;
CREATE TRIGGER trigger_notify_shared_treino_liked
AFTER INSERT ON treino_likes
FOR EACH ROW EXECUTE FUNCTION notify_shared_treino_liked();

-- 3. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM COMENTA SEU TREINO COMPARTILHADO
-- =====================================================
CREATE OR REPLACE FUNCTION notify_shared_treino_commented()
RETURNS TRIGGER AS $$
DECLARE
  v_treino_owner_id TEXT;
  v_treino_title TEXT;
  v_commenter_name TEXT;
BEGIN
  -- Buscar dono do treino compartilhado
  SELECT user_id, COALESCE(treino_data->>'name', 'Treino') INTO v_treino_owner_id, v_treino_title
  FROM shared_treinos
  WHERE id = NEW.shared_treino_id;
  
  -- Usar o user_name que já vem no NEW
  v_commenter_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_treino_owner_id IS NOT NULL AND v_treino_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_treino_owner_id::uuid,
      'comment',
      'Novo comentário!',
      v_commenter_name || ' comentou no seu treino: ' || v_treino_title,
      jsonb_build_object(
        'shared_treino_id', NEW.shared_treino_id,
        'comment_id', NEW.id,
        'user_id', NEW.user_id,
        'user_name', v_commenter_name,
        'content', LEFT(NEW.comment, 100)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_shared_treino_commented ON treino_comments;
CREATE TRIGGER trigger_notify_shared_treino_commented
AFTER INSERT ON treino_comments
FOR EACH ROW EXECUTE FUNCTION notify_shared_treino_commented();

-- 4. TRIGGER: ATUALIZAR CONTADOR DE LIKES AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_shared_treino_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shared_treinos
    SET likes = (
      SELECT COUNT(*) FROM treino_likes 
      WHERE shared_treino_id = NEW.shared_treino_id
    )
    WHERE id = NEW.shared_treino_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shared_treinos
    SET likes = (
      SELECT COUNT(*) FROM treino_likes 
      WHERE shared_treino_id = OLD.shared_treino_id
    )
    WHERE id = OLD.shared_treino_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shared_treino_likes_count ON treino_likes;
CREATE TRIGGER trigger_update_shared_treino_likes_count
AFTER INSERT OR DELETE ON treino_likes
FOR EACH ROW EXECUTE FUNCTION update_shared_treino_likes_count();

-- 5. TRIGGER: ATUALIZAR CONTADOR DE COMENTÁRIOS AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_shared_treino_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shared_treinos
    SET comments = (
      SELECT COUNT(*) FROM treino_comments 
      WHERE shared_treino_id = NEW.shared_treino_id
    )
    WHERE id = NEW.shared_treino_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shared_treinos
    SET comments = (
      SELECT COUNT(*) FROM treino_comments 
      WHERE shared_treino_id = OLD.shared_treino_id
    )
    WHERE id = OLD.shared_treino_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shared_treino_comments_count ON treino_comments;
CREATE TRIGGER trigger_update_shared_treino_comments_count
AFTER INSERT OR DELETE ON treino_comments
FOR EACH ROW EXECUTE FUNCTION update_shared_treino_comments_count();

-- Comentários
COMMENT ON FUNCTION notify_shared_treino_liked IS 'Cria notificação quando alguém curte um treino compartilhado';
COMMENT ON FUNCTION notify_shared_treino_commented IS 'Cria notificação quando alguém comenta um treino compartilhado';
COMMENT ON FUNCTION update_shared_treino_likes_count IS 'Atualiza contador de likes automaticamente';
COMMENT ON FUNCTION update_shared_treino_comments_count IS 'Atualiza contador de comentários automaticamente';

