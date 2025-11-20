-- =====================================================
-- CORREÇÃO DA FUNÇÃO update_global_stats
-- =====================================================
-- Esta função estava tentando acessar NEW.status
-- mesmo quando a tabela não tinha esse campo

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

  -- Quando alguém curte um post
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
      COALESCE(NEW.user_avatar_url, NULL),
      1
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_comments_made = global_user_stats.total_comments_made + 1,
      updated_at = NOW();
  END IF;

  -- Quando um treino compartilhado é completado
  -- IMPORTANTE: Só executa se a tabela for workout_participations
  IF TG_TABLE_NAME = 'workout_participations' AND TG_OP = 'UPDATE' THEN
    -- Verificar se status mudou para 'completed'
    -- Usar COALESCE para evitar erro se status for NULL
    IF COALESCE(NEW.status, '') = 'completed' 
       AND COALESCE(OLD.status, '') != 'completed' THEN
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
        COALESCE(NEW.user_name, 'Usuário'),
        NEW.user_avatar_url,
        50,
        1
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        total_points = global_user_stats.total_points + 50,
        total_workouts = global_user_stats.total_workouts + 1,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION update_global_stats() IS 'Atualiza estatísticas globais automaticamente - versão corrigida';

