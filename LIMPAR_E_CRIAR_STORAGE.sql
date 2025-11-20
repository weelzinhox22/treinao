-- =====================================================
-- LIMPAR E CRIAR STORAGE DO ZERO (SEGURO)
-- =====================================================
-- Este script remove tudo e recria do zero
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================
-- Não dará erro se não existirem

-- Políticas do bucket avatars
DROP POLICY IF EXISTS "Allow public to view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Políticas do bucket workout-photos
DROP POLICY IF EXISTS "Allow public to view workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their own workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update own workout photo" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete own workout photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own workout photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own workout photo" ON storage.objects;

-- 2. CRIAR OU ATUALIZAR OS BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('workout-photos', 'workout-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. CRIAR POLÍTICAS PARA AVATARS
-- =====================================================

-- Permitir upload (apenas do próprio usuário)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização pública
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir atualização (apenas próprio usuário)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir deleção (apenas próprio usuário)
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. CRIAR POLÍTICAS PARA WORKOUT-PHOTOS
-- =====================================================

-- Permitir upload (apenas do próprio usuário)
CREATE POLICY "Users can upload own workout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização pública
CREATE POLICY "Anyone can view workout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workout-photos');

-- Permitir atualização (apenas próprio usuário)
CREATE POLICY "Users can update own workout photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir deleção (apenas próprio usuário)
CREATE POLICY "Users can delete own workout photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. VERIFICAR SE TUDO FOI CRIADO
-- =====================================================

-- Ver os buckets criados
SELECT 
  id, 
  name, 
  public,
  file_size_limit / 1024 / 1024 as "Tamanho Máximo (MB)",
  allowed_mime_types as "Tipos Permitidos"
FROM storage.buckets 
WHERE id IN ('avatars', 'workout-photos')
ORDER BY id;

-- Ver as políticas criadas
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
WHERE tablename = 'objects'
  AND (policyname LIKE '%avatar%' OR policyname LIKE '%workout%')
ORDER BY policyname;

-- ✅ RESULTADO ESPERADO:
-- - 2 buckets (avatars e workout-photos)
-- - 8 políticas (4 para cada bucket)

-- 🎉 SE APARECER TUDO, ESTÁ PRONTO!

