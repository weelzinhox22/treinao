-- =====================================================
-- SISTEMA COMPLETO DE FEED SOCIAL PARA GRUPOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. POSTS DO GRUPO (Treinos compartilhados)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  
  -- Conteúdo do Post
  title TEXT NOT NULL,
  description TEXT,
  workout_type TEXT NOT NULL, -- 'musculacao', 'cardio', 'yoga', 'outro'
  duration_minutes INTEGER NOT NULL,
  
  -- Dados do Treino (opcional)
  exercises JSONB, -- Array de exercícios
  total_volume NUMERIC,
  
  -- Mídia
  photo_url TEXT,
  
  -- Emoji do Dia
  mood_emoji TEXT, -- '😎', '💪', '🔥', '😴', etc
  
  -- Pontos
  points INTEGER DEFAULT 0,
  
  -- Métricas
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX idx_group_posts_created_at ON group_posts(created_at DESC);

-- 2. CURTIDAS (Likes)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, user_id) -- Um usuário só pode curtir uma vez
);

CREATE INDEX idx_group_post_likes_post_id ON group_post_likes(post_id);
CREATE INDEX idx_group_post_likes_user_id ON group_post_likes(user_id);

-- 3. REAÇÕES COM EMOJIS
-- =====================================================
CREATE TABLE IF NOT EXISTS group_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL, -- '🔥', '💪', '👏', '😍', '😂', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, user_id, emoji) -- Um usuário pode dar várias reações diferentes
);

CREATE INDEX idx_group_post_reactions_post_id ON group_post_reactions(post_id);
CREATE INDEX idx_group_post_reactions_user_id ON group_post_reactions(user_id);

-- 4. COMENTÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_post_comments_post_id ON group_post_comments(post_id);
CREATE INDEX idx_group_post_comments_user_id ON group_post_comments(user_id);
CREATE INDEX idx_group_post_comments_created_at ON group_post_comments(created_at ASC);

-- 5. FUNÇÃO PARA ATUALIZAR CONTADORES
-- =====================================================

-- Atualizar contador de likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para likes
DROP TRIGGER IF EXISTS trigger_update_likes_count ON group_post_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON group_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentários
DROP TRIGGER IF EXISTS trigger_update_comments_count ON group_post_comments;
CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON group_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;

-- POLICIES PARA GROUP_POSTS
-- Membros do grupo podem ver posts
CREATE POLICY "Group members can view posts"
ON group_posts FOR SELECT
TO authenticated
USING (true); -- Simplificado: todos autenticados veem (para facilitar)

-- Membros podem criar posts
CREATE POLICY "Users can create posts"
ON group_posts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Autor pode atualizar próprio post
CREATE POLICY "Users can update own posts"
ON group_posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Autor pode deletar próprio post
CREATE POLICY "Users can delete own posts"
ON group_posts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- POLICIES PARA LIKES
CREATE POLICY "Anyone can view likes"
ON group_post_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can like posts"
ON group_post_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
ON group_post_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- POLICIES PARA REAÇÕES
CREATE POLICY "Anyone can view reactions"
ON group_post_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can react to posts"
ON group_post_reactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions"
ON group_post_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- POLICIES PARA COMENTÁRIOS
CREATE POLICY "Anyone can view comments"
ON group_post_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can comment"
ON group_post_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON group_post_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON group_post_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 7. VERIFICAR SE FOI CRIADO
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('group_posts', 'group_post_likes', 'group_post_reactions', 'group_post_comments')
ORDER BY table_name, ordinal_position;

-- Ver as políticas criadas
SELECT 
  tablename, 
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE cmd
  END as "Comando"
FROM pg_policies 
WHERE tablename LIKE 'group_post%'
ORDER BY tablename, policyname;

-- ✅ RESULTADO ESPERADO:
-- 4 tabelas criadas (group_posts, group_post_likes, group_post_reactions, group_post_comments)
-- 2 funções (update_post_likes_count, update_post_comments_count)
-- 2 triggers (automáticos para contadores)
-- 14 políticas RLS

-- 🎉 FEED SOCIAL COMPLETO CONFIGURADO!

