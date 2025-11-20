-- =====================================================
-- CORRIGIR POLICIES DE GRUPOS (VERSÃO SIMPLES - SEM RECURSÃO)
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can view public groups or own groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Anyone can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update" ON groups;
DROP POLICY IF EXISTS "Owners can update own groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete" ON groups;
DROP POLICY IF EXISTS "Owners can delete own groups" ON groups;

DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can update own membership" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Owners can remove members" ON group_members;

-- 2. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- 3. REABILITAR RLS
-- =====================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS SIMPLES PARA GROUPS (SEM RECURSÃO)
-- =====================================================

-- Qualquer usuário autenticado pode ver TODOS os grupos
-- (isso permite buscar por invite_code)
CREATE POLICY "Anyone can view all groups"
ON groups FOR SELECT
TO authenticated
USING (true);

-- Qualquer um pode criar grupo
CREATE POLICY "Anyone can create groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (owner_id::uuid = auth.uid());

-- Apenas owner pode atualizar
CREATE POLICY "Owners can update groups"
ON groups FOR UPDATE
TO authenticated
USING (owner_id::uuid = auth.uid());

-- Apenas owner pode deletar
CREATE POLICY "Owners can delete groups"
ON groups FOR DELETE
TO authenticated
USING (owner_id::uuid = auth.uid());

-- 5. POLÍTICAS SIMPLES PARA GROUP_MEMBERS (SEM RECURSÃO)
-- =====================================================

-- Qualquer usuário autenticado pode ver TODOS os membros
-- (necessário para listar membros do grupo)
CREATE POLICY "Anyone can view all members"
ON group_members FOR SELECT
TO authenticated
USING (true);

-- Usuários podem se adicionar a grupos
CREATE POLICY "Users can join groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (user_id::uuid = auth.uid());

-- Usuários podem atualizar apenas seu próprio registro
CREATE POLICY "Users can update own membership"
ON group_members FOR UPDATE
TO authenticated
USING (user_id::uuid = auth.uid());

-- Usuários podem sair de grupos (deletar a si mesmos)
CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
TO authenticated
USING (user_id::uuid = auth.uid());

-- 6. VERIFICAR SE FOI CRIADO
-- =====================================================
SELECT 
  schemaname, 
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
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- ✅ DEVE RETORNAR:
-- groups: 4 políticas (view, create, update, delete)
-- group_members: 4 políticas (view, join, update, leave)

-- 🎉 AGORA VAI FUNCIONAR SEM RECURSÃO!

-- NOTA: Estas políticas são mais permissivas (qualquer autenticado vê tudo)
-- mas isso é OK para um app social de fitness onde grupos são semi-públicos.
-- Se precisar de mais privacidade depois, podemos ajustar.

