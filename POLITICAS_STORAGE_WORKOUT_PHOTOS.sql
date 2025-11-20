-- Políticas RLS para o bucket 'workout-photos' (fotos de treinos)
-- Execute este script no SQL Editor do Supabase após criar o bucket 'workout-photos'

-- Habilitar RLS no storage.objects (se ainda não estiver habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para permitir upload de fotos de treinos (apenas do próprio usuário)
DROP POLICY IF EXISTS "Users can upload own workout photos" ON storage.objects;
CREATE POLICY "Users can upload own workout photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir leitura de fotos de treinos (público)
DROP POLICY IF EXISTS "Anyone can view workout photos" ON storage.objects;
CREATE POLICY "Anyone can view workout photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'workout-photos');

-- Política para permitir deleção de própria foto de treino
DROP POLICY IF EXISTS "Users can delete own workout photos" ON storage.objects;
CREATE POLICY "Users can delete own workout photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workout-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

