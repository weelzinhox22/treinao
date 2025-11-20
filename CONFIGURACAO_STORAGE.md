# 📦 Configuração do Supabase Storage para Fotos de Perfil

Este guia explica como configurar o Supabase Storage para armazenar fotos de perfil dos usuários.

## 🚀 Passo a Passo

### 1. Criar Bucket de Storage

1. Acesse o painel do Supabase
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **SIM** (para que as fotos sejam acessíveis publicamente)
   - **File size limit:** `5 MB` (ou o valor desejado)
   - **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

### 2. Configurar Políticas de Segurança

No SQL Editor do Supabase, execute:

```sql
-- Política para permitir upload de fotos de perfil
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir leitura pública de avatares
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir atualização de própria foto
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir deleção de própria foto
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Estrutura de Pastas

As fotos serão armazenadas na seguinte estrutura:
```
avatars/
  └── {user_id}/
      └── {timestamp}.{ext}
```

Exemplo: `avatars/123e4567-e89b-12d3-a456-426614174000/1704067200000.jpg`

### 4. Verificar Configuração

Após configurar, teste fazendo upload de uma foto de perfil no app. A foto deve:
- ✅ Ser salva no bucket `avatars`
- ✅ Ter uma URL pública acessível
- ✅ Ser atualizada na tabela `users` (campo `avatar_url`)

## 🔒 Segurança

- ✅ Apenas o próprio usuário pode fazer upload/atualizar/deletar sua foto
- ✅ Fotos são públicas para leitura (necessário para exibir no feed)
- ✅ Limite de tamanho de arquivo configurado (5MB)
- ✅ Apenas tipos de imagem permitidos

## 📝 Notas

- O serviço `profileService.ts` já está configurado para usar o Supabase Storage
- Em caso de erro, há fallback para base64 no localStorage
- URLs das fotos são salvas na tabela `users` no campo `avatar_url`

