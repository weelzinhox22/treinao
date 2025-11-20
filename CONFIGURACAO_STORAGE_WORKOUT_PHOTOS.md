# 📸 Configuração do Storage para Fotos de Treinos

Este guia explica como configurar o bucket `workout-photos` no Supabase Storage para armazenar fotos dos treinos rápidos.

## 📋 Passo a Passo

### 1. Criar o Bucket

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `workout-photos`
   - **Public bucket**: ✅ **Marcar como público** (para que as fotos sejam acessíveis)
   - **File size limit**: 10 MB (ou o valor desejado)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### 2. Configurar RLS (Row Level Security)

No **SQL Editor** do Supabase, execute:

```sql
-- Política para permitir que qualquer usuário autenticado faça upload
CREATE POLICY "Users can upload workout photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que qualquer pessoa veja as fotos (bucket público)
CREATE POLICY "Anyone can view workout photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'workout-photos');

-- Política para permitir que usuários deletem suas próprias fotos
CREATE POLICY "Users can delete own workout photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Estrutura de Pastas

As fotos serão organizadas assim:
```
workout-photos/
  └── {user_id}/
      └── workouts/
          └── {timestamp}.{ext}
```

Exemplo:
```
workout-photos/
  └── abc123/
      └── workouts/
          └── 1704067200000.jpg
```

## ✅ Verificação

Após configurar, teste fazendo upload de uma foto através do app. A foto deve:
- Ser salva no bucket `workout-photos`
- Ser acessível publicamente via URL
- Aparecer no feed após o upload

## 🔒 Segurança

- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Usuários só podem fazer upload em suas próprias pastas
- ✅ Fotos são públicas para visualização (necessário para o feed)
- ✅ Usuários podem deletar apenas suas próprias fotos

