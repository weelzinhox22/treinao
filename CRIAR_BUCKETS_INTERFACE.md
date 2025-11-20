# 🗂️ Criar Buckets no Supabase - Interface Visual

## 📋 Passo a Passo (5 minutos)

### 1. Acessar o Painel do Supabase

1. Vá para: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **hvpbouaonwolixgedjaf**

### 2. Criar Bucket "avatars" (Fotos de Perfil)

1. **No menu lateral esquerdo, clique em: Storage**

2. **Clique no botão verde: "New bucket"** (ou "Create bucket")

3. **Preencha os campos:**
   - **Name:** `avatars` (sem espaços, minúsculo)
   - **Public bucket:** ✅ **MARQUE ESTA CAIXA** (muito importante!)
   - **File size limit:** `10` MB
   - **Allowed MIME types:** Deixe em branco (ou adicione: `image/jpeg,image/png,image/webp,image/gif`)

4. **Clique em: "Create bucket"** (ou "Save")

5. **Configurar Políticas:**
   - Após criar, você verá o bucket na lista
   - Clique no bucket **"avatars"**
   - Vá para a aba **"Policies"**
   - Clique em **"New policy"**
   - Selecione **"For full customization"** ou **"Create policy from scratch"**
   - Cole as políticas abaixo:

```sql
-- Política 1: Upload (INSERT)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 2: Visualização (SELECT)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política 3: Atualização (UPDATE)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Deleção (DELETE)
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Criar Bucket "workout-photos" (Fotos de Treino)

**Repita o processo acima**, mas com estas configurações:
   - **Name:** `workout-photos` (sem espaços, minúsculo)
   - **Public bucket:** ✅ **MARQUE ESTA CAIXA**
   - **File size limit:** `10` MB
   - **Allowed MIME types:** Deixe em branco

**Políticas para workout-photos:**

```sql
-- Política 1: Upload (INSERT)
CREATE POLICY "Users can upload own workout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 2: Visualização (SELECT)
CREATE POLICY "Anyone can view workout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workout-photos');

-- Política 3: Atualização (UPDATE)
CREATE POLICY "Users can update own workout photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Deleção (DELETE)
CREATE POLICY "Users can delete own workout photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ MÉTODO MAIS RÁPIDO: Usar SQL Editor

Se você preferir fazer tudo de uma vez via SQL:

1. **Menu lateral → SQL Editor**
2. **Clique em: "New query"**
3. **Cole TODO o conteúdo do arquivo:** `CRIAR_BUCKETS_STORAGE.sql`
4. **Clique em: Run** (ou Ctrl+Enter)
5. **Pronto!** ✅

## 🔍 Verificar se Funcionou

### Método 1: Interface

1. Menu lateral → **Storage**
2. Você deve ver 2 buckets:
   - ✅ `avatars`
   - ✅ `workout-photos`
3. Ambos devem ter um ícone de "público" (🌐)

### Método 2: SQL

Execute no SQL Editor:

```sql
SELECT * FROM storage.buckets 
WHERE id IN ('avatars', 'workout-photos');
```

Deve retornar **2 linhas**.

## 🎯 Testar Upload

Após criar os buckets:

1. **Atualize a página** da aplicação (F5)
2. **Vá para: /perfil**
3. **Clique em: Editar perfil**
4. **Escolha uma foto**
5. **Clique em: Salvar**
6. **Deve funcionar!** ✅

Se aparecer erro, verifique:
- Os buckets estão marcados como **públicos** ✅
- As **políticas (RLS)** foram criadas ✅
- Você está **logado** na aplicação ✅

## 🆘 Erros Comuns

### "Bucket not found"
❌ O bucket não foi criado
✅ Crie o bucket via interface ou SQL

### "new row violates row-level security policy"
❌ As políticas RLS não foram criadas
✅ Execute as políticas SQL acima

### "User not authenticated"
❌ Você não está logado
✅ Faça login novamente

## 📝 Checklist

- [ ] Bucket `avatars` criado
- [ ] Bucket `avatars` marcado como **público**
- [ ] Políticas RLS do `avatars` criadas (4 políticas)
- [ ] Bucket `workout-photos` criado
- [ ] Bucket `workout-photos` marcado como **público**
- [ ] Políticas RLS do `workout-photos` criadas (4 políticas)
- [ ] Testado upload de avatar
- [ ] Testado upload de foto de treino

## 🎉 Pronto!

Depois de criar os buckets, tudo deve funcionar perfeitamente!


