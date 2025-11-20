-- =====================================================
-- SCRIPT SIMPLES PARA CRIAR STORAGE NO SUPABASE
-- =====================================================
-- Cole TUDO no SQL Editor e clique em RUN
-- =====================================================

-- 1. CRIAR OS DOIS BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('workout-photos', 'workout-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. LIMPAR POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own workout photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own workout photo" ON storage.objects;

-- 3. CRIAR POLÍTICAS PARA AVATARS
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. CRIAR POLÍTICAS PARA WORKOUT-PHOTOS
CREATE POLICY "Users can upload own workout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view workout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workout-photos');

CREATE POLICY "Users can update own workout photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own workout photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. VERIFICAR SE FOI CRIADO
SELECT 
  id, 
  name, 
  public,
  file_size_limit / 1024 / 1024 as "Tamanho Máximo (MB)"
FROM storage.buckets 
WHERE id IN ('avatars', 'workout-photos');

-- Deve retornar 2 linhas:
-- avatars          | true | 10
-- workout-photos   | true | 10

-- ✅ SE APARECER AS 2 LINHAS, ESTÁ PRONTO!
-- ✅ Agora teste o upload na aplicação


