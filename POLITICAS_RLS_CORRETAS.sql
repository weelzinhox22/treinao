-- 🔐 Políticas RLS Corretas para TREINÃO DOS CARAS
-- ⚠️ IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Este script remove políticas existentes e cria novas com os tipos corretos

-- Habilitar RLS em todas as tabelas
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Remover políticas existentes (se houver)
-- ============================================

-- Remover políticas antigas de treinos
DROP POLICY IF EXISTS "Users can view own treinos" ON treinos;
DROP POLICY IF EXISTS "Users can insert own treinos" ON treinos;
DROP POLICY IF EXISTS "Users can update own treinos" ON treinos;
DROP POLICY IF EXISTS "Users can delete own treinos" ON treinos;

-- Remover políticas antigas de fotos
DROP POLICY IF EXISTS "Users can view own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can insert own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can update own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can delete own fotos" ON fotos;

-- Remover políticas antigas de metas
DROP POLICY IF EXISTS "Users can view own metas" ON metas;
DROP POLICY IF EXISTS "Users can insert own metas" ON metas;
DROP POLICY IF EXISTS "Users can update own metas" ON metas;
DROP POLICY IF EXISTS "Users can delete own metas" ON metas;

-- Remover políticas antigas de achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;

-- Remover políticas antigas de templates
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Remover políticas antigas de shared_treinos
DROP POLICY IF EXISTS "Anyone can view public shared treinos" ON shared_treinos;
DROP POLICY IF EXISTS "Users can view own shared treinos" ON shared_treinos;
DROP POLICY IF EXISTS "Users can insert own shared treinos" ON shared_treinos;
DROP POLICY IF EXISTS "Users can update own shared treinos" ON shared_treinos;
DROP POLICY IF EXISTS "Users can delete own shared treinos" ON shared_treinos;

-- Remover políticas antigas de treino_comments
DROP POLICY IF EXISTS "Anyone can view comments on public treinos" ON treino_comments;
DROP POLICY IF EXISTS "Users can view own comments" ON treino_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON treino_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON treino_comments;

-- ============================================
-- Criar novas políticas para tabelas com user_id UUID
-- ============================================

-- Políticas para treinos (user_id é UUID)
CREATE POLICY "Users can view own treinos" ON treinos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treinos" ON treinos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treinos" ON treinos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treinos" ON treinos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para fotos (user_id é UUID)
CREATE POLICY "Users can view own fotos" ON fotos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fotos" ON fotos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fotos" ON fotos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fotos" ON fotos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para metas (user_id é UUID)
CREATE POLICY "Users can view own metas" ON metas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metas" ON metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metas" ON metas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metas" ON metas
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para achievements (user_id é UUID)
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para templates (user_id é UUID)
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Criar novas políticas para tabelas com user_id TEXT
-- ============================================

-- Políticas para shared_treinos (Feed Social) - user_id é TEXT
CREATE POLICY "Anyone can view public shared treinos" ON shared_treinos
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own shared treinos" ON shared_treinos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own shared treinos" ON shared_treinos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own shared treinos" ON shared_treinos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own shared treinos" ON shared_treinos
  FOR DELETE USING (auth.uid()::text = user_id);

-- Políticas para treino_comments - user_id é TEXT
CREATE POLICY "Anyone can view comments on public treinos" ON treino_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_treinos 
      WHERE shared_treinos.id = treino_comments.shared_treino_id 
      AND shared_treinos.is_public = true
    )
  );

CREATE POLICY "Users can view own comments" ON treino_comments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert comments" ON treino_comments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own comments" ON treino_comments
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- Políticas para Grupos, Desafios e Treinos Rápidos
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE IF EXISTS groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quick_workouts ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view public groups or own groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Owners can update own groups" ON groups;
DROP POLICY IF EXISTS "Owners can delete own groups" ON groups;

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can update own membership" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

DROP POLICY IF EXISTS "Users can view challenges of their groups" ON challenges;
DROP POLICY IF EXISTS "Group members can create challenges" ON challenges;
DROP POLICY IF EXISTS "Creators can update challenges" ON challenges;
DROP POLICY IF EXISTS "Creators can delete challenges" ON challenges;

DROP POLICY IF EXISTS "Users can view participants of challenges they joined" ON challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;
DROP POLICY IF EXISTS "Users can leave challenges" ON challenge_participants;

DROP POLICY IF EXISTS "Anyone can view quick workouts" ON quick_workouts;
DROP POLICY IF EXISTS "Users can create own workouts" ON quick_workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON quick_workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON quick_workouts;

-- Políticas para GROUPS
CREATE POLICY "Users can view public groups or own groups" ON groups
  FOR SELECT USING (
    is_public = true OR 
    owner_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (owner_id = auth.uid()::text);

CREATE POLICY "Owners can update own groups" ON groups
  FOR UPDATE USING (owner_id = auth.uid()::text);

CREATE POLICY "Owners can delete own groups" ON groups
  FOR DELETE USING (owner_id = auth.uid()::text);

-- Políticas para GROUP_MEMBERS
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own membership" ON group_members
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE USING (user_id = auth.uid()::text);

-- Políticas para CHALLENGES
CREATE POLICY "Users can view challenges of their groups" ON challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = challenges.group_id
      AND group_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Group members can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = challenges.group_id
      AND group_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Creators can update challenges" ON challenges
  FOR UPDATE USING (created_by = auth.uid()::text);

CREATE POLICY "Creators can delete challenges" ON challenges
  FOR DELETE USING (created_by = auth.uid()::text);

-- Políticas para CHALLENGE_PARTICIPANTS
CREATE POLICY "Users can view participants of challenges they joined" ON challenge_participants
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id
      AND cp.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own participation" ON challenge_participants
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can leave challenges" ON challenge_participants
  FOR DELETE USING (user_id = auth.uid()::text);

-- Políticas para QUICK_WORKOUTS
CREATE POLICY "Anyone can view quick workouts" ON quick_workouts
  FOR SELECT USING (true);

CREATE POLICY "Users can create own workouts" ON quick_workouts
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own workouts" ON quick_workouts
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own workouts" ON quick_workouts
  FOR DELETE USING (user_id = auth.uid()::text);

