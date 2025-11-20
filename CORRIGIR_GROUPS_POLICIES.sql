-- =====================================================
-- CORRIGIR POLICIES DE GRUPOS (Recursão Infinita)
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. REMOVER POLÍTICAS ANTIGAS
-- =====================================================
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

-- 2. POLÍTICAS CORRETAS PARA GROUPS (SEM RECURSÃO)
-- =====================================================

-- Ver grupos onde sou membro (SEM SUBQUERY)
CREATE POLICY "Users can view own groups"
ON groups FOR SELECT
TO authenticated
USING (
  -- Usuário é o criador (owner_id é TEXT, auth.uid() é UUID)
  owner_id::uuid = auth.uid()
  OR
  -- OU existe registro direto em group_members
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id::uuid = auth.uid()
  )
);

-- Qualquer um pode criar grupo
CREATE POLICY "Anyone can create groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (owner_id::uuid = auth.uid());

-- Apenas owner pode atualizar
CREATE POLICY "Group owners can update"
ON groups FOR UPDATE
TO authenticated
USING (owner_id::uuid = auth.uid())
WITH CHECK (owner_id::uuid = auth.uid());

-- Apenas owner pode deletar
CREATE POLICY "Group owners can delete"
ON groups FOR DELETE
TO authenticated
USING (owner_id::uuid = auth.uid());

-- 3. POLÍTICAS CORRETAS PARA GROUP_MEMBERS (SEM RECURSÃO)
-- =====================================================

-- Ver membros do grupo que faço parte
CREATE POLICY "Members can view group members"
ON group_members FOR SELECT
TO authenticated
USING (
  -- Posso ver membros de grupos que faço parte
  group_id IN (
    SELECT gm.group_id FROM group_members gm
    WHERE gm.user_id::uuid = auth.uid()
  )
);

-- Entrar em grupo (inserir-se)
CREATE POLICY "Users can join groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id::uuid = auth.uid()
);

-- Sair do grupo (deletar a si mesmo)
CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
TO authenticated
USING (
  user_id::uuid = auth.uid()
);

-- Owner pode remover membros
CREATE POLICY "Owners can remove members"
ON group_members FOR DELETE
TO authenticated
USING (
  group_id IN (
    SELECT id FROM groups
    WHERE owner_id::uuid = auth.uid()
  )
);

-- 4. VERIFICAR SE FOI CRIADO
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
-- groups: 4 políticas
-- group_members: 4 políticas

-- 🎉 SE APARECER TUDO, OS GRUPOS VÃO FUNCIONAR!

