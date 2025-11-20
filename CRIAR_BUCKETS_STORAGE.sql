-- =====================================================
-- CRIAR BUCKETS DE STORAGE NO SUPABASE
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. CRIAR BUCKET PARA AVATARS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- público para que todos possam ver os avatars
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. CRIAR BUCKET PARA FOTOS DE TREINO
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-photos',
  'workout-photos',
  true, -- público para que todos possam ver as fotos
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE ACESSO PARA AVATARS
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete own avatar" ON storage.objects;

-- Permitir que usuários autenticados façam upload de seus próprios avatars
CREATE POLICY "Allow authenticated users to upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que qualquer pessoa veja os avatars (público)
CREATE POLICY "Allow public to view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir que o dono do avatar atualize
CREATE POLICY "Allow owner to update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que o dono do avatar delete
CREATE POLICY "Allow owner to delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLÍTICAS DE ACESSO PARA WORKOUT-PHOTOS
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated users to upload their own workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view all workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update own workout photo" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete own workout photo" ON storage.objects;

-- Permitir que usuários autenticados façam upload de suas próprias fotos de treino
CREATE POLICY "Allow authenticated users to upload their own workout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que qualquer pessoa veja as fotos de treino (público)
CREATE POLICY "Allow public to view workout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workout-photos');

-- Permitir que o dono da foto atualize
CREATE POLICY "Allow owner to update own workout photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que o dono da foto delete
CREATE POLICY "Allow owner to delete own workout photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICAR SE OS BUCKETS FORAM CRIADOS
-- =====================================================
-- Execute esta query para verificar:
-- SELECT * FROM storage.buckets WHERE id IN ('avatars', 'workout-photos');

