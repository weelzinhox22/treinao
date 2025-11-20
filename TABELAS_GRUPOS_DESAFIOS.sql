-- 🎯 Tabelas para Sistema de Grupos, Desafios e Pontuação
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. GROUPS (Grupos)
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);

-- ============================================
-- 2. GROUP_MEMBERS (Membros dos Grupos)
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique ON group_members(group_id, user_id);

-- ============================================
-- 3. CHALLENGES (Desafios)
-- ============================================
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_group_id ON challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

-- ============================================
-- 4. CHALLENGE_PARTICIPANTS (Participantes dos Desafios)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_participants_unique ON challenge_participants(challenge_id, user_id);

-- ============================================
-- 5. QUICK_WORKOUTS (Treinos Rápidos do Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS quick_workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  points INTEGER NOT NULL,
  challenge_ids TEXT[], -- Array de IDs dos desafios
  photo_url TEXT, -- URL da foto do treino
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_workouts_user_id ON quick_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_workouts_date ON quick_workouts(date);
CREATE INDEX IF NOT EXISTS idx_quick_workouts_challenge_ids ON quick_workouts USING GIN(challenge_ids);
CREATE INDEX IF NOT EXISTS idx_quick_workouts_created_at ON quick_workouts(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_workouts ENABLE ROW LEVEL SECURITY;

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

