# 🔧 Desabilitar Confirmação de Email no Supabase

## ⚠️ IMPORTANTE

Para que o registro funcione sem confirmação de email, você precisa desabilitar essa opção no **Supabase Dashboard**.

---

## 📋 Passo a Passo

### 1. Acessar Configurações de Autenticação

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Authentication** → **Settings** (ou **Configurações**)

### 2. Desabilitar Confirmação de Email

1. Na seção **"Email Auth"** ou **"Autenticação por Email"**
2. Procure por: **"Enable email confirmations"** ou **"Habilitar confirmações de email"**
3. **Desmarque** ☐ essa opção
4. Clique em **"Save"** ou **"Salvar"**

### 3. Verificar Configurações Adicionais

Certifique-se de que:
- ✅ **"Enable email confirmations"** está **DESABILITADO**
- ✅ **"Enable email change confirmations"** pode estar habilitado (não afeta registro)
- ✅ Salve as alterações

---

## 🔍 Localização Exata

**Caminho completo:**
```
Supabase Dashboard
  → Seu Projeto
    → Authentication (menu lateral)
      → Settings / Configurações
        → Email Auth
          → Enable email confirmations ☐ (DESMARCAR)
```

---

## ✅ Após Desabilitar

1. **Novos registros** não precisarão confirmar email
2. **Usuários serão logados automaticamente** após registro
3. **Login funcionará imediatamente** com email e senha

---

## 🧪 Testar

1. Faça um novo registro
2. Verifique se o usuário é redirecionado para `/dashboard` automaticamente
3. Verifique se não aparece mensagem de "verificar email"

---

## ⚠️ Nota de Segurança

Desabilitar confirmação de email reduz a segurança, pois:
- Qualquer pessoa pode criar contas com emails falsos
- Não há verificação de que o email é válido

**Recomendação:** Para produção, considere manter a confirmação habilitada ou usar outras formas de verificação.

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentação:** https://supabase.com/docs/guides/auth/auth-email

