-- =====================================================
-- SISTEMA DE LIKES E COMENTÁRIOS PARA QUICK WORKOUTS
-- =====================================================
-- Este script cria as tabelas e triggers necessários
-- para curtir e comentar treinos rápidos no feed global

-- 1. CRIAR TABELA DE LIKES DE QUICK WORKOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_workout_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id TEXT NOT NULL REFERENCES quick_workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um usuário só pode curtir uma vez
  UNIQUE(workout_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quick_workout_likes_workout ON quick_workout_likes(workout_id);
CREATE INDEX IF NOT EXISTS idx_quick_workout_likes_user ON quick_workout_likes(user_id);

-- RLS
ALTER TABLE quick_workout_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quick workout likes" ON quick_workout_likes;
CREATE POLICY "Users can view quick workout likes"
ON quick_workout_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can like quick workouts" ON quick_workout_likes;
CREATE POLICY "Users can like quick workouts"
ON quick_workout_likes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can unlike quick workouts" ON quick_workout_likes;
CREATE POLICY "Users can unlike quick workouts"
ON quick_workout_likes FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- 2. CRIAR TABELA DE COMENTÁRIOS DE QUICK WORKOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_workout_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id TEXT NOT NULL REFERENCES quick_workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quick_workout_comments_workout ON quick_workout_comments(workout_id);
CREATE INDEX IF NOT EXISTS idx_quick_workout_comments_user ON quick_workout_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_workout_comments_created_at ON quick_workout_comments(created_at ASC);

-- RLS
ALTER TABLE quick_workout_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quick workout comments" ON quick_workout_comments;
CREATE POLICY "Users can view quick workout comments"
ON quick_workout_comments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can comment on quick workouts" ON quick_workout_comments;
CREATE POLICY "Users can comment on quick workouts"
ON quick_workout_comments FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can delete own comments" ON quick_workout_comments;
CREATE POLICY "Users can delete own comments"
ON quick_workout_comments FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- 3. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM CURTE SEU QUICK WORKOUT
-- =====================================================
CREATE OR REPLACE FUNCTION notify_quick_workout_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_workout_owner_id TEXT;
  v_workout_title TEXT;
  v_liker_name TEXT;
BEGIN
  -- Buscar dono do treino rápido
  SELECT user_id, COALESCE(title, activity_name, 'Treino') INTO v_workout_owner_id, v_workout_title
  FROM quick_workouts
  WHERE id = NEW.workout_id;
  
  -- Usar o user_name que já vem no NEW
  v_liker_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_workout_owner_id IS NOT NULL AND v_workout_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_workout_owner_id::uuid,
      'like',
      'Nova curtida!',
      v_liker_name || ' curtiu seu treino: ' || v_workout_title,
      jsonb_build_object(
        'workout_id', NEW.workout_id,
        'user_id', NEW.user_id,
        'user_name', v_liker_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_quick_workout_liked ON quick_workout_likes;
CREATE TRIGGER trigger_notify_quick_workout_liked
AFTER INSERT ON quick_workout_likes
FOR EACH ROW EXECUTE FUNCTION notify_quick_workout_liked();

-- 4. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM COMENTA SEU QUICK WORKOUT
-- =====================================================
CREATE OR REPLACE FUNCTION notify_quick_workout_commented()
RETURNS TRIGGER AS $$
DECLARE
  v_workout_owner_id TEXT;
  v_workout_title TEXT;
  v_commenter_name TEXT;
BEGIN
  -- Buscar dono do treino rápido
  SELECT user_id, COALESCE(title, activity_name, 'Treino') INTO v_workout_owner_id, v_workout_title
  FROM quick_workouts
  WHERE id = NEW.workout_id;
  
  -- Usar o user_name que já vem no NEW
  v_commenter_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_workout_owner_id IS NOT NULL AND v_workout_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_workout_owner_id::uuid,
      'comment',
      'Novo comentário!',
      v_commenter_name || ' comentou no seu treino: ' || v_workout_title,
      jsonb_build_object(
        'workout_id', NEW.workout_id,
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

DROP TRIGGER IF EXISTS trigger_notify_quick_workout_commented ON quick_workout_comments;
CREATE TRIGGER trigger_notify_quick_workout_commented
AFTER INSERT ON quick_workout_comments
FOR EACH ROW EXECUTE FUNCTION notify_quick_workout_commented();

-- Comentários
COMMENT ON TABLE quick_workout_likes IS 'Curtidas em treinos rápidos do feed global';
COMMENT ON TABLE quick_workout_comments IS 'Comentários em treinos rápidos do feed global';
COMMENT ON FUNCTION notify_quick_workout_liked IS 'Cria notificação quando alguém curte um treino rápido';
COMMENT ON FUNCTION notify_quick_workout_commented IS 'Cria notificação quando alguém comenta um treino rápido';

