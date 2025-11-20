# 📋 Passos para Configuração Completa do Supabase

## ✅ Status Atual

- ✅ Arquivo `.env` criado
- ✅ Supabase conectado (`hasUrl: true, hasKey: true`)
- ✅ Tabelas do banco de dados criadas
- ✅ Autenticação funcionando (conta criada)
- ⚠️ **Pendente:** Confirmar email
- ⚠️ **Pendente:** Configurar Storage (buckets)

## 🚀 Próximos Passos

### 1. Confirmar Email (URGENTE)

**Erro atual:** `Email not confirmed`

**Solução rápida (para desenvolvimento):**

```sql
-- Execute no SQL Editor do Supabase
-- Substitua 'seu-email@exemplo.com' pelo seu email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu-email@exemplo.com';
```

**OU desabilitar confirmação de email:**
1. Supabase Dashboard → Authentication → Providers
2. Clique em "Email"
3. Desmarque "Confirm email"
4. Salve

📄 **Guia completo:** `RESOLVER_EMAIL_NAO_CONFIRMADO.md`

### 2. Configurar Storage (Para upload de fotos)

**Criar buckets:**
```sql
-- Execute no SQL Editor do Supabase
-- OU use a interface gráfica (Storage → New bucket)

-- Copie e cole todo o conteúdo do arquivo:
CRIAR_BUCKETS_STORAGE.sql
```

📄 **Guia completo:** `GUIA_CONFIGURAR_STORAGE.md`

### 3. Testar Funcionalidades

Após resolver os passos 1 e 2:

1. **Fazer login:**
   - Vá para `/login`
   - Use suas credenciais
   - Deve funcionar agora! ✅

2. **Upload de avatar:**
   - Vá para `/perfil`
   - Clique em "Editar perfil"
   - Faça upload de uma foto
   - Deve salvar no Supabase! ✅

3. **Criar grupo:**
   - Vá para `/feed`
   - Clique em "Grupos"
   - Crie um grupo
   - Deve salvar no Supabase! ✅

4. **Registrar treino rápido:**
   - Vá para `/feed`
   - Clique em "Registrar Treino"
   - Preencha os dados
   - Faça upload de uma foto (opcional)
   - Deve salvar no Supabase! ✅

## 📂 Arquivos de Ajuda

| Arquivo | Descrição |
|---------|-----------|
| `RESOLVER_EMAIL_NAO_CONFIRMADO.md` | Como confirmar o email |
| `CONFIRMAR_EMAIL_MANUALMENTE.sql` | Script SQL para confirmar |
| `GUIA_CONFIGURAR_STORAGE.md` | Como configurar o Storage |
| `CRIAR_BUCKETS_STORAGE.sql` | Script completo do Storage |
| `README_SUPABASE.md` | Documentação geral |

## 🔍 Como Verificar se Está Tudo Funcionando

### Console do Navegador (F12)

Após fazer login, você deve ver:
```
✅ hasUrl: true
✅ hasKey: true
✅ Supabase configurado
```

### SQL Editor do Supabase

Execute para verificar dados:

```sql
-- Ver usuários
SELECT id, email, email_confirmed_at, created_at FROM auth.users;

-- Ver buckets de storage
SELECT * FROM storage.buckets WHERE id IN ('avatars', 'workout-photos');

-- Ver grupos criados
SELECT * FROM groups ORDER BY created_at DESC LIMIT 10;

-- Ver treinos rápidos
SELECT * FROM quick_workouts ORDER BY created_at DESC LIMIT 10;
```

## 🎯 Resumo de 2 Minutos

**Para começar a usar agora:**

1. **Confirmar email** (1 minuto):
   ```sql
   UPDATE auth.users SET email_confirmed_at = NOW() 
   WHERE email = 'seu-email@exemplo.com';
   ```

2. **Criar buckets** (1 minuto):
   - Copie `CRIAR_BUCKETS_STORAGE.sql`
   - Cole no SQL Editor
   - Execute (Run)

3. **Testar:**
   - Faça login
   - Teste upload de foto
   - 🎉 Tudo funcionando!

## 🆘 Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do SQL Editor
3. Consulte os arquivos de ajuda acima
4. Todos os erros comuns estão documentados

