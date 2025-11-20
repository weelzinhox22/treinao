# 🗂️ Configurar Storage do Supabase

## 📋 Problema Identificado

Você conseguiu criar a conta (autenticação funcionando), mas o upload do avatar falhou porque:
1. Os **buckets de storage** não existem no Supabase
2. As **políticas de acesso (RLS)** do storage não estão configuradas

## ✅ Solução - Passo a Passo

### 1. Acessar o Painel do Supabase

1. Vá para: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **hvpbouaonwolixgedjaf**

### 2. Criar os Buckets de Storage

**Opção A: Via Interface (Recomendado para iniciantes)**

1. No menu lateral, clique em **Storage**
2. Clique em **Create bucket** (ou "Criar bucket")
3. Crie o primeiro bucket:
   - **Name:** `avatars`
   - **Public bucket:** ✅ Marque esta opção
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - Clique em **Create bucket**
4. Repita para o segundo bucket:
   - **Name:** `workout-photos`
   - **Public bucket:** ✅ Marque esta opção
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - Clique em **Create bucket**

**Opção B: Via SQL Editor**

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Copie e cole o conteúdo do arquivo `CRIAR_BUCKETS_STORAGE.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Configurar Políticas de Acesso (RLS)

1. No menu lateral, clique em **Storage**
2. Clique no bucket **avatars**
3. Vá para a aba **Policies**
4. Clique em **New policy**
5. Cole as políticas do arquivo `CRIAR_BUCKETS_STORAGE.sql`

**OU** execute o script SQL completo que já cria os buckets E as políticas.

### 4. Verificar se Funcionou

Após configurar, execute esta query no SQL Editor:

```sql
SELECT * FROM storage.buckets WHERE id IN ('avatars', 'workout-photos');
```

Você deve ver 2 linhas retornadas.

### 5. Testar o Upload

1. Volte para a aplicação
2. Faça logout e login novamente
3. Tente fazer upload do avatar novamente
4. Abra o console do navegador (F12)
5. Verifique se há erros

## 🔍 Verificar Autenticação

Para garantir que o usuário está autenticado ao fazer upload, abra o console do navegador e digite:

```javascript
// Ver sessão atual
console.log(await supabase.auth.getSession());

// Ver usuário atual
console.log(await supabase.auth.getUser());
```

Deve retornar os dados do usuário. Se retornar `null`, o usuário não está autenticado.

## 🚨 Erros Comuns

### Erro: "new row violates row-level security policy"
**Solução:** As políticas RLS do storage não estão configuradas. Execute o script `CRIAR_BUCKETS_STORAGE.sql`.

### Erro: "Bucket not found"
**Solução:** Os buckets não foram criados. Crie-os via interface ou SQL.

### Erro: "User not authenticated"
**Solução:** Faça logout e login novamente. Verifique se `supabase.auth.getSession()` retorna um usuário.

### Erro: "File size exceeds limit"
**Solução:** A imagem é maior que 10MB. Reduza o tamanho da imagem.

## 📝 Resumo

1. ✅ Criar bucket `avatars` (público, 10MB, imagens)
2. ✅ Criar bucket `workout-photos` (público, 10MB, imagens)
3. ✅ Configurar políticas RLS para ambos os buckets
4. ✅ Testar upload novamente

Após seguir estes passos, o upload de avatars e fotos de treino deve funcionar corretamente! 🎉

