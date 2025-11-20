-- ========================================
-- SISTEMA DE PONTUAÇÃO E GAMIFICAÇÃO DOS GRUPOS
-- ========================================

-- 1. Criar tabela de estatísticas dos membros
CREATE TABLE IF NOT EXISTS public.group_member_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  
  -- Estatísticas
  total_points INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  reactions_received INTEGER DEFAULT 0,
  total_workout_minutes INTEGER DEFAULT 0,
  
  -- Badges específicos do grupo
  is_top_contributor BOOLEAN DEFAULT false,
  is_most_consistent BOOLEAN DEFAULT false,
  is_motivation_master BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Garantir que cada usuário tenha apenas uma entrada por grupo
  UNIQUE(group_id, user_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_group_member_stats_group_id ON public.group_member_stats(group_id);
CREATE INDEX IF NOT EXISTS idx_group_member_stats_user_id ON public.group_member_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_group_member_stats_points ON public.group_member_stats(total_points DESC);

-- 3. Função para atualizar estatísticas do membro
CREATE OR REPLACE FUNCTION update_member_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um post é criado
  IF TG_TABLE_NAME = 'group_posts' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.group_member_stats (
      group_id,
      user_id,
      user_name,
      user_avatar_url,
      total_points,
      posts_count,
      total_workout_minutes
    )
    VALUES (
      NEW.group_id,
      NEW.user_id,
      NEW.user_name,
      NEW.user_avatar_url,
      NEW.points,
      1,
      NEW.duration_minutes
    )
    ON CONFLICT (group_id, user_id) 
    DO UPDATE SET
      total_points = group_member_stats.total_points + NEW.points,
      posts_count = group_member_stats.posts_count + 1,
      total_workout_minutes = group_member_stats.total_workout_minutes + NEW.duration_minutes,
      user_name = NEW.user_name,
      user_avatar_url = NEW.user_avatar_url,
      updated_at = NOW();
  END IF;

  -- Quando uma curtida é recebida
  IF TG_TABLE_NAME = 'group_post_likes' AND TG_OP = 'INSERT' THEN
    -- Buscar o autor do post
    DECLARE
      post_user_id TEXT;
      post_group_id TEXT;
      post_user_name TEXT;
    BEGIN
      SELECT user_id, group_id, user_name INTO post_user_id, post_group_id, post_user_name
      FROM public.group_posts
      WHERE id = NEW.post_id;
      
      IF post_user_id IS NOT NULL THEN
        INSERT INTO public.group_member_stats (
          group_id,
          user_id,
          user_name,
          total_points,
          likes_received
        )
        VALUES (
          post_group_id,
          post_user_id,
          post_user_name,
          1,
          1
        )
        ON CONFLICT (group_id, user_id)
        DO UPDATE SET
          likes_received = group_member_stats.likes_received + 1,
          total_points = group_member_stats.total_points + 1,
          updated_at = NOW();
      END IF;
    END;
  END IF;

  -- Quando um comentário é feito
  IF TG_TABLE_NAME = 'group_post_comments' AND TG_OP = 'INSERT' THEN
    -- Buscar o grupo do post
    DECLARE
      post_group_id TEXT;
    BEGIN
      SELECT group_id INTO post_group_id
      FROM public.group_posts
      WHERE id = NEW.post_id;
      
      IF post_group_id IS NOT NULL THEN
        INSERT INTO public.group_member_stats (
          group_id,
          user_id,
          user_name,
          user_avatar_url,
          comments_made
        )
        VALUES (
          post_group_id,
          NEW.user_id,
          NEW.user_name,
          NEW.user_avatar_url,
          1
        )
        ON CONFLICT (group_id, user_id)
        DO UPDATE SET
          comments_made = group_member_stats.comments_made + 1,
          updated_at = NOW();
      END IF;
    END;
  END IF;

  -- Quando uma reação é recebida
  IF TG_TABLE_NAME = 'group_post_reactions' AND TG_OP = 'INSERT' THEN
    -- Buscar o autor do post
    DECLARE
      post_user_id TEXT;
      post_group_id TEXT;
      post_user_name TEXT;
    BEGIN
      SELECT user_id, group_id, user_name INTO post_user_id, post_group_id, post_user_name
      FROM public.group_posts
      WHERE id = NEW.post_id;
      
      IF post_user_id IS NOT NULL THEN
        INSERT INTO public.group_member_stats (
          group_id,
          user_id,
          user_name,
          total_points,
          reactions_received
        )
        VALUES (
          post_group_id,
          post_user_id,
          post_user_name,
          1,
          1
        )
        ON CONFLICT (group_id, user_id)
        DO UPDATE SET
          reactions_received = group_member_stats.reactions_received + 1,
          total_points = group_member_stats.total_points + 1,
          updated_at = NOW();
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar triggers
DROP TRIGGER IF EXISTS trigger_update_stats_on_post ON public.group_posts;
CREATE TRIGGER trigger_update_stats_on_post
  AFTER INSERT ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_member_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_on_like ON public.group_post_likes;
CREATE TRIGGER trigger_update_stats_on_like
  AFTER INSERT ON public.group_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_member_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_on_comment ON public.group_post_comments;
CREATE TRIGGER trigger_update_stats_on_comment
  AFTER INSERT ON public.group_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_on_reaction ON public.group_post_reactions;
CREATE TRIGGER trigger_update_stats_on_reaction
  AFTER INSERT ON public.group_post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_member_stats();

-- 5. RLS Policies para group_member_stats
ALTER TABLE public.group_member_stats ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ver stats dos membros de grupos que participa
DROP POLICY IF EXISTS "Membros podem ver estatísticas do grupo" ON public.group_member_stats;
CREATE POLICY "Membros podem ver estatísticas do grupo"
  ON public.group_member_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_member_stats.group_id
        AND group_members.user_id::text = auth.uid()::text
    )
  );

-- Sistema pode inserir/atualizar (via triggers)
DROP POLICY IF EXISTS "Sistema pode gerenciar estatísticas" ON public.group_member_stats;
CREATE POLICY "Sistema pode gerenciar estatísticas"
  ON public.group_member_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. View para ranking simplificado
CREATE OR REPLACE VIEW group_rankings AS
SELECT 
  gms.*,
  ROW_NUMBER() OVER (PARTITION BY gms.group_id ORDER BY gms.total_points DESC) as rank,
  g.name as group_name
FROM public.group_member_stats gms
JOIN public.groups g ON g.id = gms.group_id
ORDER BY gms.group_id, gms.total_points DESC;

-- 7. Função para atualizar badges de gamificação
CREATE OR REPLACE FUNCTION update_group_badges()
RETURNS void AS $$
DECLARE
  group_record RECORD;
BEGIN
  -- Para cada grupo
  FOR group_record IN SELECT DISTINCT group_id FROM public.group_member_stats LOOP
    -- Top Contributor (maior pontuação)
    UPDATE public.group_member_stats
    SET is_top_contributor = false
    WHERE group_id = group_record.group_id;
    
    UPDATE public.group_member_stats
    SET is_top_contributor = true
    WHERE group_id = group_record.group_id
      AND total_points = (
        SELECT MAX(total_points)
        FROM public.group_member_stats
        WHERE group_id = group_record.group_id
      );
    
    -- Most Consistent (maior número de posts)
    UPDATE public.group_member_stats
    SET is_most_consistent = false
    WHERE group_id = group_record.group_id;
    
    UPDATE public.group_member_stats
    SET is_most_consistent = true
    WHERE group_id = group_record.group_id
      AND posts_count = (
        SELECT MAX(posts_count)
        FROM public.group_member_stats
        WHERE group_id = group_record.group_id
      );
    
    -- Motivation Master (maior número de curtidas + comentários dados)
    UPDATE public.group_member_stats
    SET is_motivation_master = false
    WHERE group_id = group_record.group_id;
    
    UPDATE public.group_member_stats
    SET is_motivation_master = true
    WHERE group_id = group_record.group_id
      AND comments_made = (
        SELECT MAX(comments_made)
        FROM public.group_member_stats
        WHERE group_id = group_record.group_id
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para buscar contagem de membros
CREATE OR REPLACE FUNCTION get_group_member_count(p_group_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.group_members
  WHERE group_id = p_group_id;
  
  RETURN member_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DADOS INICIAIS E TESTES
-- ========================================

-- Executar atualização de badges
SELECT update_group_badges();

-- ========================================
-- QUERIES ÚTEIS PARA DEBUGGING
-- ========================================

-- Ver ranking de um grupo específico
-- SELECT * FROM group_rankings WHERE group_id = 'SEU_GROUP_ID';

-- Ver estatísticas de um membro
-- SELECT * FROM group_member_stats WHERE user_id = 'SEU_USER_ID';

-- Atualizar badges manualmente
-- SELECT update_group_badges();

-- Ver contagem de membros
-- SELECT get_group_member_count('SEU_GROUP_ID');

COMMENT ON TABLE public.group_member_stats IS 'Estatísticas e pontuação dos membros em cada grupo';
COMMENT ON FUNCTION update_member_stats() IS 'Atualiza automaticamente as estatísticas quando posts/curtidas/comentários são criados';
COMMENT ON FUNCTION update_group_badges() IS 'Atualiza os badges de gamificação para todos os grupos';
COMMENT ON FUNCTION get_group_member_count(TEXT) IS 'Retorna o número de membros de um grupo';

