-- =====================================================
-- SISTEMA DE REAÇÕES RÁPIDAS COM EMOJIS PARA FEED GLOBAL
-- =====================================================
-- Este script cria as tabelas para reações em treinos compartilhados
-- e quick workouts do feed global

-- 1. REAÇÕES EM TREINOS COMPARTILHADOS (SHARED_TREINOS)
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_treino_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_treino_id TEXT NOT NULL REFERENCES shared_treinos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL, -- '🐔', '🔥', '💪', '👏', '😍', '💯', '🎉', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(shared_treino_id, user_id, emoji) -- Um usuário pode dar várias reações diferentes
);

CREATE INDEX IF NOT EXISTS idx_shared_treino_reactions_treino ON shared_treino_reactions(shared_treino_id);
CREATE INDEX IF NOT EXISTS idx_shared_treino_reactions_user ON shared_treino_reactions(user_id);

-- RLS
ALTER TABLE shared_treino_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared treino reactions" ON shared_treino_reactions;
CREATE POLICY "Users can view shared treino reactions"
ON shared_treino_reactions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can react to shared treinos" ON shared_treino_reactions;
CREATE POLICY "Users can react to shared treinos"
ON shared_treino_reactions FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can remove own reactions" ON shared_treino_reactions;
CREATE POLICY "Users can remove own reactions"
ON shared_treino_reactions FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- 2. REAÇÕES EM QUICK WORKOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_workout_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id TEXT NOT NULL REFERENCES quick_workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL, -- '🐔', '🔥', '💪', '👏', '😍', '💯', '🎉', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(workout_id, user_id, emoji) -- Um usuário pode dar várias reações diferentes
);

CREATE INDEX IF NOT EXISTS idx_quick_workout_reactions_workout ON quick_workout_reactions(workout_id);
CREATE INDEX IF NOT EXISTS idx_quick_workout_reactions_user ON quick_workout_reactions(user_id);

-- RLS
ALTER TABLE quick_workout_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quick workout reactions" ON quick_workout_reactions;
CREATE POLICY "Users can view quick workout reactions"
ON quick_workout_reactions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can react to quick workouts" ON quick_workout_reactions;
CREATE POLICY "Users can react to quick workouts"
ON quick_workout_reactions FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can remove own quick workout reactions" ON quick_workout_reactions;
CREATE POLICY "Users can remove own quick workout reactions"
ON quick_workout_reactions FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- 3. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM REAGE AO SEU TREINO COMPARTILHADO
-- =====================================================
CREATE OR REPLACE FUNCTION notify_shared_treino_reacted()
RETURNS TRIGGER AS $$
DECLARE
  v_treino_owner_id TEXT;
  v_treino_title TEXT;
  v_reactor_name TEXT;
BEGIN
  -- Buscar dono do treino compartilhado
  SELECT user_id, COALESCE(treino_data->>'name', 'Treino') INTO v_treino_owner_id, v_treino_title
  FROM shared_treinos
  WHERE id = NEW.shared_treino_id;
  
  -- Usar o user_name que já vem no NEW
  v_reactor_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_treino_owner_id IS NOT NULL AND v_treino_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_treino_owner_id::uuid,
      'reaction',
      'Nova reação!',
      v_reactor_name || ' reagiu com ' || NEW.emoji || ' no seu treino: ' || v_treino_title,
      jsonb_build_object(
        'shared_treino_id', NEW.shared_treino_id,
        'user_id', NEW.user_id,
        'user_name', v_reactor_name,
        'emoji', NEW.emoji
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_shared_treino_reacted ON shared_treino_reactions;
CREATE TRIGGER trigger_notify_shared_treino_reacted
AFTER INSERT ON shared_treino_reactions
FOR EACH ROW EXECUTE FUNCTION notify_shared_treino_reacted();

-- 4. TRIGGER: NOTIFICAÇÃO QUANDO ALGUÉM REAGE AO SEU QUICK WORKOUT
-- =====================================================
CREATE OR REPLACE FUNCTION notify_quick_workout_reacted()
RETURNS TRIGGER AS $$
DECLARE
  v_workout_owner_id TEXT;
  v_workout_title TEXT;
  v_reactor_name TEXT;
BEGIN
  -- Buscar dono do treino rápido
  SELECT user_id, COALESCE(title, activity_name, 'Treino') INTO v_workout_owner_id, v_workout_title
  FROM quick_workouts
  WHERE id = NEW.workout_id;
  
  -- Usar o user_name que já vem no NEW
  v_reactor_name := COALESCE(NEW.user_name, 'Alguém');
  
  -- Não notificar se for o próprio dono ou se não encontrou o treino
  IF v_workout_owner_id IS NOT NULL AND v_workout_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_workout_owner_id::uuid,
      'reaction',
      'Nova reação!',
      v_reactor_name || ' reagiu com ' || NEW.emoji || ' no seu treino: ' || v_workout_title,
      jsonb_build_object(
        'workout_id', NEW.workout_id,
        'user_id', NEW.user_id,
        'user_name', v_reactor_name,
        'emoji', NEW.emoji
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_quick_workout_reacted ON quick_workout_reactions;
CREATE TRIGGER trigger_notify_quick_workout_reacted
AFTER INSERT ON quick_workout_reactions
FOR EACH ROW EXECUTE FUNCTION notify_quick_workout_reacted();

-- Comentários
COMMENT ON TABLE shared_treino_reactions IS 'Reações com emojis em treinos compartilhados do feed global';
COMMENT ON TABLE quick_workout_reactions IS 'Reações com emojis em treinos rápidos do feed global';
COMMENT ON FUNCTION notify_shared_treino_reacted IS 'Cria notificação quando alguém reage a um treino compartilhado';
COMMENT ON FUNCTION notify_quick_workout_reacted IS 'Cria notificação quando alguém reage a um treino rápido';

