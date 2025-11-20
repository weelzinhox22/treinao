# 📧 Resolver "Email not confirmed"

## 🚨 Problema

Erro ao fazer login: `AuthApiError: Email not confirmed`

## 📋 Causa

Por padrão, o Supabase exige que os usuários **confirmem seu email** antes de fazer login. Quando você criou a conta, o Supabase enviou um email de confirmação.

## ✅ Solução

### Opção 1: Confirmar o Email (Recomendado para produção)

1. **Verifique sua caixa de entrada:**
   - Procure por um email do Supabase
   - Assunto: "Confirm your signup" ou "Confirme seu cadastro"
   - Remetente: `noreply@mail.app.supabase.io`

2. **Clique no link de confirmação no email**

3. **Tente fazer login novamente**

### Opção 2: Desabilitar Confirmação de Email (Para desenvolvimento)

**⚠️ Apenas para desenvolvimento! Não use em produção!**

1. **Acesse o painel do Supabase:**
   - https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para Authentication → Email Auth:**
   - Menu lateral → **Authentication**
   - Clique na aba **Providers**
   - Procure por **Email**
   - Clique para editar

3. **Desabilite confirmação de email:**
   - Encontre a opção **"Confirm email"**
   - Desmarque a caixa
   - Clique em **Save**

4. **Crie uma nova conta ou confirme manualmente:**
   - Se já criou a conta, você precisa confirmá-la manualmente no banco de dados:

```sql
-- Execute no SQL Editor do Supabase
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu-email@exemplo.com';
```

### Opção 3: Confirmar Email Manualmente no Banco de Dados

1. **Acesse o SQL Editor:**
   - Menu lateral → **SQL Editor**
   - Clique em **New query**

2. **Execute este comando:**

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email real
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu-email@exemplo.com';
```

3. **Tente fazer login novamente**

## 🔍 Verificar se o Email foi Confirmado

Execute esta query no SQL Editor:

```sql
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

- Se `email_confirmed_at` for `NULL` → Email não confirmado
- Se `email_confirmed_at` tiver uma data → Email confirmado ✅

## 📝 Melhorias no Código

Vou atualizar o código para mostrar uma mensagem mais clara quando o email não estiver confirmado.

## 🚀 Após Resolver

Depois de confirmar o email:
1. Faça login com suas credenciais
2. Configure o Storage (veja `GUIA_CONFIGURAR_STORAGE.md`)
3. Teste o upload do avatar

## 💡 Dica

Para desenvolvimento local, é mais prático desabilitar a confirmação de email. Para produção, sempre mantenha habilitada por segurança.

