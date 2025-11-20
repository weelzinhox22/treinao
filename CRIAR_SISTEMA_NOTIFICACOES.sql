-- =====================================================
-- SISTEMA COMPLETO DE NOTIFICAÇÕES
-- =====================================================
-- Este script cria o sistema de notificações com:
-- - Tabela de notificações
-- - Triggers automáticos para criar notificações
-- - Função para admin enviar notificações para todos
-- - RLS policies

-- 1. TABELA DE NOTIFICAÇÕES
-- =====================================================
-- Remover índices antigos se existirem
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'comment', 'reaction', 'follow', 'badge', 'goal', 'admin', 'workout_reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Dados adicionais (post_id, user_name, etc)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN (
    'like', 'comment', 'reaction', 'follow', 'badge', 
    'goal', 'admin', 'workout_reminder', 'group_post', 
    'challenge', 'ranking'
  ))
);

-- Índices (criar apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
    CREATE INDEX idx_notifications_read ON notifications(user_id, read);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
  END IF;
END $$;

-- 2. FUNÇÃO PARA CRIAR NOTIFICAÇÃO
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA ADMIN ENVIAR NOTIFICAÇÃO PARA TODOS
-- =====================================================
CREATE OR REPLACE FUNCTION send_notification_to_all(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_admin_email TEXT;
  v_current_user_email TEXT;
BEGIN
  -- Verificar se o usuário é admin
  -- Pegar email do usuário atual
  SELECT email INTO v_current_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Lista de emails admin (ajuste conforme necessário)
  -- Você pode criar uma tabela de admins ou usar uma lista fixa
  IF v_current_user_email NOT IN (
    'weelzinhox22@gmail.com',
    -- Adicione outros emails de admin aqui
    (SELECT email FROM auth.users WHERE email LIKE '%@admin.%' LIMIT 1) -- Exemplo: qualquer email com @admin.
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem enviar notificações para todos';
  END IF;
  
  -- Inserir notificação para todos os usuários
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    id,
    p_type,
    p_title,
    p_message,
    p_data
  FROM auth.users
  WHERE id IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger: Notificação quando alguém curte seu post
CREATE OR REPLACE FUNCTION notify_post_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_liker_name TEXT;
BEGIN
  -- Buscar dono do post
  SELECT user_id, title INTO v_post_owner_id, v_post_title
  FROM group_posts
  WHERE id = NEW.post_id;
  
  -- Buscar nome de quem curtiu
  SELECT user_name INTO v_liker_name
  FROM group_post_likes
  WHERE id = NEW.id;
  
  -- Não notificar se for o próprio dono
  IF v_post_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_post_owner_id,
      'like',
      'Nova curtida!',
      v_liker_name || ' curtiu seu post: ' || COALESCE(v_post_title, 'Treino'),
      jsonb_build_object(
        'post_id', NEW.post_id,
        'user_id', NEW.user_id,
        'user_name', v_liker_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_post_liked ON group_post_likes;
CREATE TRIGGER trigger_notify_post_liked
AFTER INSERT ON group_post_likes
FOR EACH ROW EXECUTE FUNCTION notify_post_liked();

-- Trigger: Notificação quando alguém comenta seu post
CREATE OR REPLACE FUNCTION notify_post_commented()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_commenter_name TEXT;
BEGIN
  -- Buscar dono do post e título
  SELECT user_id, COALESCE(title, 'Treino') INTO v_post_owner_id, v_post_title
  FROM group_posts
  WHERE id = NEW.post_id;
  
  -- Usar o user_name que já vem no NEW
  v_commenter_name := NEW.user_name;
  
  -- Não notificar se for o próprio dono ou se não encontrou o post
  IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_post_owner_id,
      'comment',
      'Novo comentário!',
      v_commenter_name || ' comentou no seu post: ' || v_post_title,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'user_id', NEW.user_id,
        'user_name', v_commenter_name,
        'content', LEFT(NEW.content, 100)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_post_commented ON group_post_comments;
CREATE TRIGGER trigger_notify_post_commented
AFTER INSERT ON group_post_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_commented();

-- Trigger: Notificação quando alguém reage ao seu post
CREATE OR REPLACE FUNCTION notify_post_reacted()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_reactor_name TEXT;
BEGIN
  -- Buscar dono do post
  SELECT user_id, title INTO v_post_owner_id, v_post_title
  FROM group_posts
  WHERE id = NEW.post_id;
  
  -- Buscar nome de quem reagiu
  SELECT user_name INTO v_reactor_name
  FROM group_post_reactions
  WHERE id = NEW.id;
  
  -- Não notificar se for o próprio dono
  IF v_post_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_post_owner_id,
      'reaction',
      'Nova reação!',
      v_reactor_name || ' reagiu com ' || NEW.emoji || ' no seu post',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'user_id', NEW.user_id,
        'user_name', v_reactor_name,
        'emoji', NEW.emoji
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_post_reacted ON group_post_reactions;
CREATE TRIGGER trigger_notify_post_reacted
AFTER INSERT ON group_post_reactions
FOR EACH ROW EXECUTE FUNCTION notify_post_reacted();

-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Apenas sistema pode criar notificações (via função)
-- Não permitir INSERT direto para segurança

-- 6. FUNÇÃO PARA MARCAR NOTIFICAÇÕES COMO LIDAS
-- =====================================================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE id = p_notification_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA MARCAR TODAS COMO LIDAS
-- =====================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = auth.uid()
    AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. VIEW PARA CONTAR NOTIFICAÇÕES NÃO LIDAS
-- =====================================================
CREATE OR REPLACE VIEW user_unread_notifications_count AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE read = FALSE
GROUP BY user_id;

-- Comentários
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON FUNCTION send_notification_to_all IS 'Permite admin enviar notificações para todos os usuários';
COMMENT ON FUNCTION create_notification IS 'Cria uma notificação para um usuário específico';

