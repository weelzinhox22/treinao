-- =====================================================
-- CORREÇÃO DO TRIGGER DE COMENTÁRIOS
-- =====================================================
-- Este script corrige o trigger que está causando erro
-- ao adicionar comentários

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_notify_post_commented ON group_post_comments;

-- Recriar função corrigida
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
  
  -- Usar o user_name que já vem no NEW (não precisa buscar novamente)
  v_commenter_name := COALESCE(NEW.user_name, 'Alguém');
  
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
        'content', LEFT(NEW.content, 100),
        'group_id', (SELECT group_id FROM group_posts WHERE id = NEW.post_id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER trigger_notify_post_commented
AFTER INSERT ON group_post_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_commented();

-- Comentário
COMMENT ON FUNCTION notify_post_commented IS 'Cria notificação quando alguém comenta um post';

