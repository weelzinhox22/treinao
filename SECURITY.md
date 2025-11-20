# 🔒 Guia de Segurança - TREINÃO DOS CARAS

## ⚠️ IMPORTANTE: Proteção de Chaves

### Chaves do Supabase

1. **Anon/Public Key** (`VITE_SUPABASE_ANON_KEY`)
   - ✅ Segura para usar no frontend
   - ✅ Pode ser exposta no código do cliente
   - ✅ Protegida por Row Level Security (RLS)

2. **Service Role Key** (`VITE_SUPABASE_SERVICE_ROLE_KEY`)
   - ❌ **NUNCA** use no frontend
   - ❌ **NUNCA** faça commit no Git
   - ✅ Use apenas em ambientes server-side seguros
   - ✅ Bypassa RLS - acesso total ao banco

### Boas Práticas

1. **Nunca commite o arquivo `.env`**
   - Já está no `.gitignore`
   - Use `.env.example` como template

2. **Validação de Variáveis**
   - O código valida se as variáveis existem
   - Fallback para localStorage se não configurado

3. **Row Level Security (RLS)**
   - Todas as tabelas devem ter RLS habilitado
   - Políticas devem garantir que usuários só vejam seus próprios dados

4. **Autenticação**
   - Use Supabase Auth para gerenciar sessões
   - Tokens são gerenciados automaticamente
   - Sessões são persistidas e renovadas automaticamente

## 🛡️ Proteções Implementadas

### Frontend
- ✅ Apenas anon key no código
- ✅ Validação de variáveis de ambiente
- ✅ Fallback seguro para localStorage
- ✅ Validação de dados antes de enviar

### Backend (quando implementado)
- ✅ Service role key apenas em servidor
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ Rate limiting (recomendado)

## 📋 Checklist de Segurança

Antes de fazer deploy:

- [ ] Verificar que `.env` está no `.gitignore`
- [ ] Confirmar que apenas anon key está no frontend
- [ ] Validar que RLS está habilitado em todas as tabelas
- [ ] Testar que usuários só veem seus próprios dados
- [ ] Verificar que service role key não está exposta
- [ ] Confirmar que autenticação está funcionando
- [ ] Validar sanitização de inputs do usuário

## 🚨 Se Suas Chaves Forem Comprometidas

1. **Imediatamente:**
   - Revogue as chaves no painel do Supabase
   - Gere novas chaves
   - Atualize o arquivo `.env`

2. **Verificar:**
   - Logs de acesso no Supabase
   - Dados acessados indevidamente
   - Possíveis alterações maliciosas

3. **Prevenir:**
   - Nunca compartilhe chaves
   - Use variáveis de ambiente
   - Mantenha `.env` fora do Git

## 📚 Recursos

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

