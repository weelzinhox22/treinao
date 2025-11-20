-- ========================================
-- SISTEMA DE TREINOS COMPARTILHADOS E RANKING GLOBAL
-- ========================================

-- 1. Criar tabela de estatísticas globais (ranking geral)
CREATE TABLE IF NOT EXISTS public.global_user_stats (
  user_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  
  -- Estatísticas globais
  total_points INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_comments_made INTEGER DEFAULT 0,
  total_workout_minutes INTEGER DEFAULT 0,
  total_volume_kg INTEGER DEFAULT 0,
  
  -- Rank global
  global_rank INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criar tabela de treinos compartilhados (templates que outros podem fazer)
CREATE TABLE IF NOT EXISTS public.shared_workouts (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_avatar_url TEXT,
  
  title TEXT NOT NULL,
  description TEXT,
  workout_type TEXT NOT NULL, -- 'musculacao', 'cardio', 'yoga', 'outro'
  difficulty TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  estimated_duration INTEGER, -- minutos
  
  -- Exercícios (JSON array)
  exercises JSONB NOT NULL, -- [{name, sets, reps, weight, notes}, ...]
  
  -- Estatísticas
  times_completed INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Criar tabela de participações em treinos compartilhados
CREATE TABLE IF NOT EXISTS public.workout_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_workout_id TEXT NOT NULL REFERENCES public.shared_workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  
  -- Progresso (quais exercícios foram feitos)
  completed_exercises JSONB DEFAULT '[]'::jsonb, -- [0, 1, 3] indices dos exercícios completados
  
  -- Resultado final
  duration_minutes INTEGER,
  notes TEXT,
  photo_url TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(shared_workout_id, user_id)
);

-- 4. Adicionar campo de exercícios detalhados aos posts do grupo
ALTER TABLE public.group_posts 
ADD COLUMN IF NOT EXISTS detailed_exercises JSONB;

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_global_stats_rank ON public.global_user_stats(global_rank);
CREATE INDEX IF NOT EXISTS idx_global_stats_points ON public.global_user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_shared_workouts_group ON public.shared_workouts(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_workouts_creator ON public.shared_workouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_workout_participations_workout ON public.workout_participations(shared_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_participations_user ON public.workout_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_participations_status ON public.workout_participations(status);

-- 6. Função para atualizar estatísticas globais
CREATE OR REPLACE FUNCTION update_global_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um post é criado em qualquer lugar (feed ou grupo)
  IF TG_TABLE_NAME = 'group_posts' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.global_user_stats (
      user_id,
      user_name,
      user_avatar_url,
      total_points,
      total_posts,
      total_workouts,
      total_workout_minutes
    )
    VALUES (
      NEW.user_id,
      NEW.user_name,
      NEW.user_avatar_url,
      NEW.points,
      1,
      1,
      NEW.duration_minutes
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_points = global_user_stats.total_points + NEW.points,
      total_posts = global_user_stats.total_posts + 1,
      total_workouts = global_user_stats.total_workouts + 1,
      total_workout_minutes = global_user_stats.total_workout_minutes + NEW.duration_minutes,
      user_name = NEW.user_name,
      user_avatar_url = NEW.user_avatar_url,
      updated_at = NOW();
  END IF;

  -- Quando uma curtida é recebida
  IF TG_TABLE_NAME = 'group_post_likes' AND TG_OP = 'INSERT' THEN
    DECLARE
      post_user_id TEXT;
      post_user_name TEXT;
    BEGIN
      SELECT user_id, user_name INTO post_user_id, post_user_name
      FROM public.group_posts
      WHERE id = NEW.post_id;
      
      IF post_user_id IS NOT NULL THEN
        INSERT INTO public.global_user_stats (
          user_id,
          user_name,
          total_points,
          total_likes_received
        )
        VALUES (
          post_user_id,
          post_user_name,
          1,
          1
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          total_points = global_user_stats.total_points + 1,
          total_likes_received = global_user_stats.total_likes_received + 1,
          updated_at = NOW();
      END IF;
    END;
  END IF;

  -- Quando um comentário é feito
  IF TG_TABLE_NAME = 'group_post_comments' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.global_user_stats (
      user_id,
      user_name,
      user_avatar_url,
      total_comments_made
    )
    VALUES (
      NEW.user_id,
      NEW.user_name,
      NEW.user_avatar_url,
      1
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_comments_made = global_user_stats.total_comments_made + 1,
      updated_at = NOW();
  END IF;

  -- Quando um treino compartilhado é completado
  IF TG_TABLE_NAME = 'workout_participations' AND TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Atualizar contador do treino
    UPDATE public.shared_workouts
    SET times_completed = times_completed + 1
    WHERE id = NEW.shared_workout_id;
    
    -- Dar pontos ao usuário
    INSERT INTO public.global_user_stats (
      user_id,
      user_name,
      user_avatar_url,
      total_points,
      total_workouts
    )
    VALUES (
      NEW.user_id,
      NEW.user_name,
      NEW.user_avatar_url,
      50, -- Bônus por completar treino compartilhado
      1
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_points = global_user_stats.total_points + 50,
      total_workouts = global_user_stats.total_workouts + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar triggers para estatísticas globais
DROP TRIGGER IF EXISTS trigger_global_stats_post ON public.group_posts;
CREATE TRIGGER trigger_global_stats_post
  AFTER INSERT ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_global_stats();

DROP TRIGGER IF EXISTS trigger_global_stats_like ON public.group_post_likes;
CREATE TRIGGER trigger_global_stats_like
  AFTER INSERT ON public.group_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_global_stats();

DROP TRIGGER IF EXISTS trigger_global_stats_comment ON public.group_post_comments;
CREATE TRIGGER trigger_global_stats_comment
  AFTER INSERT ON public.group_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_global_stats();

DROP TRIGGER IF EXISTS trigger_global_stats_workout_complete ON public.workout_participations;
CREATE TRIGGER trigger_global_stats_workout_complete
  AFTER UPDATE ON public.workout_participations
  FOR EACH ROW
  EXECUTE FUNCTION update_global_stats();

-- 8. Função para atualizar ranking global
CREATE OR REPLACE FUNCTION update_global_rankings()
RETURNS void AS $$
BEGIN
  -- Atualizar ranks baseado em pontos
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, total_workouts DESC) as new_rank
    FROM public.global_user_stats
  )
  UPDATE public.global_user_stats gus
  SET global_rank = ru.new_rank,
      updated_at = NOW()
  FROM ranked_users ru
  WHERE gus.user_id = ru.user_id;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies

-- global_user_stats: Todos podem ver
ALTER TABLE public.global_user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver estatísticas globais" ON public.global_user_stats;
CREATE POLICY "Todos podem ver estatísticas globais"
  ON public.global_user_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sistema pode gerenciar stats globais" ON public.global_user_stats;
CREATE POLICY "Sistema pode gerenciar stats globais"
  ON public.global_user_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- shared_workouts: Membros do grupo podem ver
ALTER TABLE public.shared_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros podem ver treinos do grupo" ON public.shared_workouts;
CREATE POLICY "Membros podem ver treinos do grupo"
  ON public.shared_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = shared_workouts.group_id
        AND group_members.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Membros podem criar treinos" ON public.shared_workouts;
CREATE POLICY "Membros podem criar treinos"
  ON public.shared_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = shared_workouts.group_id
        AND group_members.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Criador pode deletar treino" ON public.shared_workouts;
CREATE POLICY "Criador pode deletar treino"
  ON public.shared_workouts FOR DELETE
  USING (creator_id = auth.uid()::text);

-- workout_participations: Usuários podem ver suas participações e dos membros do grupo
ALTER TABLE public.workout_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver participações do grupo" ON public.workout_participations;
CREATE POLICY "Ver participações do grupo"
  ON public.workout_participations FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.shared_workouts sw
      INNER JOIN public.group_members gm ON gm.group_id = sw.group_id
      WHERE sw.id = workout_participations.shared_workout_id
        AND gm.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Usuário pode gerenciar suas participações" ON public.workout_participations;
CREATE POLICY "Usuário pode gerenciar suas participações"
  ON public.workout_participations FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 10. Executar atualização inicial
SELECT update_global_rankings();

-- ========================================
-- QUERIES ÚTEIS
-- ========================================

-- Ver ranking global (top 10)
-- SELECT * FROM global_user_stats ORDER BY global_rank LIMIT 10;

-- Ver treinos compartilhados de um grupo
-- SELECT * FROM shared_workouts WHERE group_id = 'SEU_GROUP_ID';

-- Ver quem está fazendo um treino
-- SELECT * FROM workout_participations WHERE shared_workout_id = 'SEU_WORKOUT_ID';

-- Atualizar rankings manualmente
-- SELECT update_global_rankings();

COMMENT ON TABLE public.global_user_stats IS 'Estatísticas e ranking global de todos os usuários';
COMMENT ON TABLE public.shared_workouts IS 'Treinos compartilhados que outros membros podem fazer';
COMMENT ON TABLE public.workout_participations IS 'Participações e progresso em treinos compartilhados';
COMMENT ON FUNCTION update_global_stats() IS 'Atualiza estatísticas globais automaticamente';
COMMENT ON FUNCTION update_global_rankings() IS 'Recalcula ranking global de todos os usuários';

