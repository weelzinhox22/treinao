# 🔧 Configuração do Supabase

## ⚠️ IMPORTANTE: Segurança

**NUNCA compartilhe suas chaves:**
- ❌ Não faça commit do arquivo `.env` no Git
- ❌ Não compartilhe a service role key
- ✅ Use apenas a anon key no frontend
- ✅ A service role key só deve ser usada em servidores seguros

## 📝 Passo a Passo

### 1. Criar arquivo `.env` na raiz do projeto

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://hvpbouaownwolixgedjaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cGJvdWFvbndvbGl4Z2VkamFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTkzNDIsImV4cCI6MjA3OTE3NTM0Mn0.RlMMMVdj4CJH916sUu4d_gCgVZ3sEeriZ627ybanEsw
```

### 2. Verificar que `.env` está no `.gitignore`

O arquivo `.env` já está configurado para ser ignorado pelo Git.

### 3. Reiniciar o servidor de desenvolvimento

Após criar o arquivo `.env`, reinicie o servidor:

```bash
npm run dev
```

## 🔒 Segurança Implementada

✅ **Apenas anon key no frontend** - A service role key nunca é usada no código do cliente
✅ **Validação de variáveis** - O código verifica se as variáveis existem antes de usar
✅ **Fallback seguro** - Se Supabase não estiver configurado, usa localStorage
✅ **RLS (Row Level Security)** - Todas as queries verificam `user_id` para garantir que usuários só vejam seus dados

## 📋 Próximos Passos

1. Criar as tabelas no Supabase (veja `README_SUPABASE.md`)
2. Configurar Row Level Security (RLS)
3. Testar a conexão
4. Migrar dados do localStorage para Supabase (opcional)

## 🚨 Se suas chaves forem comprometidas

1. Revogue as chaves no painel do Supabase
2. Gere novas chaves
3. Atualize o arquivo `.env`
4. Verifique logs de acesso

