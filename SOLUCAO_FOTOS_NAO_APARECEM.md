# 🔧 Solução: Fotos não aparecem na página

## ❌ Problema Atual

- ✅ Fotos estão indo para o **Supabase Storage** (arquivos)
- ✅ Fotos aparecem no **localStorage**
- ❌ Fotos **NÃO aparecem** quando abro em outro navegador/dispositivo
- ❌ Query retorna erro ou vazio do banco

## 🎯 Causa Raiz

**A tabela `fotos` não existe no banco de dados do Supabase!**

As fotos estão sendo salvas como arquivos no Storage, mas o registro (metadados) precisa estar numa tabela do banco para aparecer em outros dispositivos.

---

## ✅ Solução Passo a Passo

### 1️⃣ Executar SQL no Supabase

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral (ícone 📊)
4. Clique em **"+ New query"**
5. Cole o SQL abaixo:

```sql
-- CRIAR TABELA DE FOTOS
CREATE TABLE IF NOT EXISTS fotos (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_fotos_user_id ON fotos(user_id);
CREATE INDEX IF NOT EXISTS idx_fotos_date ON fotos(date DESC);

-- Habilitar RLS
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can insert own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can update own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can delete own fotos" ON fotos;

CREATE POLICY "Users can view own fotos"
ON fotos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fotos"
ON fotos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fotos"
ON fotos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fotos"
ON fotos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

6. Clique em **"Run"** (ou F5)
7. Deve aparecer: **"Success. No rows returned"**

### 2️⃣ Verificar se foi criado

No mesmo SQL Editor, execute:

```sql
-- Ver a tabela
SELECT * FROM fotos;

-- Ver as políticas
SELECT policyname FROM pg_policies WHERE tablename = 'fotos';
```

Deve retornar:
- Tabela vazia (0 linhas) ✅
- 4 políticas ✅

---

## 🧪 Testar a Solução

### 1. Abra o Console do Navegador (F12)

### 2. Limpe o cache:
```javascript
localStorage.clear();
location.reload();
```

### 3. Faça login novamente

### 4. Faça upload de uma foto

### 5. Observe os logs no Console:
```
📸 Carregando fotos do usuário: abc-123...
🔄 Buscando fotos do Supabase...
💾 Salvando em fotos: [...]
📤 Enviando para Supabase: [...]
✅ Dados salvos em fotos: [...]
✅ Fotos do Supabase: 1 [...]
```

### 6. Abra em outro navegador

As fotos devem aparecer! 🎉

---

## 🔍 Como Debugar

### Se ainda não aparecer, verifique os logs:

1. **Console do navegador** - Procure por:
   - ❌ **Erro ao buscar fotos** → Tabela não existe
   - ❌ **Erro ao salvar fotos** → Problema de permissão RLS
   - ❌ **code: "PGRST204"** → Tabela não existe
   - ❌ **code: "42P01"** → Tabela não existe

2. **No Supabase Dashboard**:
   - Vá em **Table Editor**
   - Procure tabela **fotos**
   - Deve ter suas fotos lá!

3. **Verificar se user_id está correto**:
   ```sql
   -- Ver qual user_id está logado
   SELECT auth.uid();
   
   -- Ver fotos desse usuário
   SELECT * FROM fotos WHERE user_id = auth.uid();
   ```

---

## 🚨 Erros Comuns

### Erro: "relation 'fotos' does not exist"
**Solução:** Execute o SQL do passo 1

### Erro: "new row violates row-level security policy"
**Solução:** Execute as políticas RLS do passo 1

### Fotos aparecem mas somem ao recarregar
**Solução:** Limpe o localStorage e faça novo upload após criar a tabela

### Erro 500 no console
**Solução:** Provavelmente a tabela não existe. Execute o SQL.

---

## 📊 Estrutura de Dados

Após salvar uma foto, ela fica em **2 lugares**:

### 1. **Supabase Storage** (arquivo de imagem)
```
workout-photos/
  └── abc-123-user-id/
      └── workouts/
          └── 1763646370388.jpg  ← Arquivo físico
```

### 2. **Tabela fotos** (metadados)
```
id: "1763646370388"
user_id: "abc-123-user-id"
url: "https://...supabase.co/storage/v1/object/public/workout-photos/abc-123-user-id/workouts/1763646370388.jpg"
date: "2024-01-15T10:30:00Z"
description: "Treino de hoje"
```

**A página busca da TABELA**, não do Storage! Por isso precisa criar a tabela.

---

## ✅ Checklist Final

- [ ] Executei o SQL no Supabase
- [ ] Verifiquei que a tabela `fotos` existe
- [ ] Limpei o localStorage
- [ ] Fiz novo upload de foto
- [ ] Foto aparece no Console com ✅
- [ ] Foto aparece na página
- [ ] Abri em outro navegador e foto aparece
- [ ] **Funcionou!** 🎉

