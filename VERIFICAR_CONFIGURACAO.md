# 🔍 Verificação de Configuração do Supabase

## Problemas Comuns e Soluções

### 1. ❌ Usuários conseguem criar múltiplas contas com o mesmo email

**Causa:** O código estava caindo no fallback do localStorage quando o Supabase não estava configurado ou havia erro.

**Solução:** 
- ✅ Removido fallback do localStorage para login/registro
- ✅ Adicionada validação para verificar se email já existe antes de criar conta
- ✅ Erros agora são lançados corretamente

**Verificar:**
1. As variáveis de ambiente estão configuradas no arquivo `.env`?
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```
2. O servidor foi reiniciado após criar o `.env`?
3. As políticas RLS estão configuradas corretamente?

### 2. ❌ Fotos não estão sendo salvas

**Causa:** Buckets de Storage não configurados ou políticas RLS bloqueando upload.

**Solução:**
- ✅ Adicionada verificação se buckets existem antes de fazer upload
- ✅ Adicionada verificação de autenticação antes de upload
- ✅ Mensagens de erro mais claras

**Verificar:**

#### Para Fotos de Perfil (avatars):
1. No Supabase Dashboard, vá em **Storage**
2. Crie um bucket chamado `avatars`
3. Configure como **Public**
4. Execute este SQL no SQL Editor:

```sql
-- Política para permitir upload de avatares
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir leitura de avatares
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir atualização de próprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir deleção de próprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Para Fotos de Treinos (workout-photos):
1. No Supabase Dashboard, vá em **Storage**
2. Crie um bucket chamado `workout-photos`
3. Configure como **Public**
4. Execute este SQL no SQL Editor:

```sql
-- Política para permitir upload de fotos de treinos
CREATE POLICY "Users can upload own workout photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir leitura de fotos de treinos
CREATE POLICY "Anyone can view workout photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'workout-photos');

-- Política para permitir deleção de própria foto de treino
CREATE POLICY "Users can delete own workout photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workout-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. ✅ Como Verificar se Está Funcionando

1. **Verificar autenticação:**
   - Abra o console do navegador (F12)
   - Faça login
   - Deve aparecer: "Auth state changed: SIGNED_IN"
   - Não deve aparecer: "Supabase não configurado"

2. **Verificar upload de fotos:**
   - Tente fazer upload de uma foto de perfil
   - Se der erro, verifique o console para mensagens específicas
   - Verifique se os buckets existem no Supabase Dashboard

3. **Verificar banco de dados:**
   - No Supabase Dashboard, vá em **Table Editor**
   - Verifique se a tabela `users` existe
   - Verifique se novos usuários estão sendo criados ao registrar

### 4. 🔧 Comandos Úteis

**Verificar variáveis de ambiente:**
```bash
# No terminal, dentro do projeto
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Limpar cache e reiniciar:**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Vite
rm -rf .vite

# Reiniciar servidor
npm run dev
```

### 5. 📝 Checklist de Configuração

- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas
- [ ] Servidor reiniciado após criar `.env`
- [ ] Tabela `users` criada no Supabase
- [ ] Políticas RLS configuradas para `users`
- [ ] Bucket `avatars` criado e configurado como Public
- [ ] Políticas RLS configuradas para `avatars`
- [ ] Bucket `workout-photos` criado e configurado como Public
- [ ] Políticas RLS configuradas para `workout-photos`
- [ ] Testado login com email existente (não deve criar nova conta)
- [ ] Testado upload de foto de perfil
- [ ] Testado upload de foto de treino

