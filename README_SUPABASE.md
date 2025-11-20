# 🗄️ Integração com Supabase

Este documento descreve como integrar o TREINÃO DOS CARAS com Supabase para persistência de dados em nuvem.

## 📋 Estrutura de Tabelas

### 1. **users**

**⚠️ IMPORTANTE:** Se a tabela `users` já existe, use o script `ATUALIZAR_TABELA_USERS.sql` para adicionar as colunas `avatar_url` e `bio`.

**Para criar nova tabela (se não existir):**
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Para atualizar tabela existente:**
Execute o arquivo `ATUALIZAR_TABELA_USERS.sql` que adiciona apenas as colunas necessárias sem modificar a estrutura existente.

### 2. **treinos**
```sql
CREATE TABLE treinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  date DATE NOT NULL,
  exercises JSONB NOT NULL,
  total_volume NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_treinos_user_id ON treinos(user_id);
CREATE INDEX idx_treinos_date ON treinos(date);
```

### 3. **fotos**
```sql
CREATE TABLE fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fotos_user_id ON fotos(user_id);
```

### 4. **metas**
```sql
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  exercise_name TEXT,
  target NUMERIC NOT NULL,
  current NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metas_user_id ON metas(user_id);
```

### 5. **achievements**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE UNIQUE INDEX idx_achievements_user_badge ON achievements(user_id, badge_id);
```

### 6. **templates**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL,
  category TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
```

### 7. **shared_treinos** (Feed Social)
```sql
CREATE TABLE shared_treinos (
  id TEXT PRIMARY KEY,
  treino_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  is_public BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[],
  treino_data JSONB
);

CREATE INDEX idx_shared_treinos_user_id ON shared_treinos(user_id);
CREATE INDEX idx_shared_treinos_public ON shared_treinos(is_public) WHERE is_public = true;
CREATE INDEX idx_shared_treinos_shared_at ON shared_treinos(shared_at DESC);
```

### 8. **treino_comments** (Comentários do Feed)
```sql
CREATE TABLE treino_comments (
  id TEXT PRIMARY KEY,
  shared_treino_id TEXT NOT NULL REFERENCES shared_treinos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_treino_comments_shared_treino_id ON treino_comments(shared_treino_id);
CREATE INDEX idx_treino_comments_user_id ON treino_comments(user_id);
```

### 9. **groups** (Grupos)
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
```

### 10. **group_members** (Membros dos Grupos)
```sql
CREATE TABLE group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE UNIQUE INDEX idx_group_members_unique ON group_members(group_id, user_id);
```

### 11. **challenges** (Desafios)
```sql
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_challenges_group_id ON challenges(group_id);
CREATE INDEX idx_challenges_is_active ON challenges(is_active);
```

### 12. **challenge_participants** (Participantes dos Desafios)
```sql
CREATE TABLE challenge_participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0
);

CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE UNIQUE INDEX idx_challenge_participants_unique ON challenge_participants(challenge_id, user_id);
```

### 13. **quick_workouts** (Treinos Rápidos do Feed)
```sql
CREATE TABLE quick_workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  points INTEGER NOT NULL,
  challenge_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quick_workouts_user_id ON quick_workouts(user_id);
CREATE INDEX idx_quick_workouts_date ON quick_workouts(date);
CREATE INDEX idx_quick_workouts_challenge_ids ON quick_workouts USING GIN(challenge_ids);
CREATE INDEX idx_quick_workouts_created_at ON quick_workouts(created_at DESC);
```

## 🔐 Row Level Security (RLS)

**⚠️ CRÍTICO: RLS deve ser habilitado em TODAS as tabelas para segurança**

**📝 IMPORTANTE sobre tipos de dados:**
- Tabelas com `user_id UUID`: Use `auth.uid() = user_id` (sem conversão)
- Tabelas com `user_id TEXT`: Use `auth.uid()::text = user_id` (com conversão)

**Tabelas com UUID:** `treinos`, `fotos`, `metas`, `achievements`, `templates`  
**Tabelas com TEXT:** `shared_treinos`, `treino_comments`

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para treinos (user_id é UUID)
CREATE POLICY "Users can view own treinos" ON treinos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treinos" ON treinos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treinos" ON treinos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treinos" ON treinos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para fotos (user_id é UUID)
CREATE POLICY "Users can view own fotos" ON fotos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fotos" ON fotos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fotos" ON fotos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fotos" ON fotos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para metas (user_id é UUID)
CREATE POLICY "Users can view own metas" ON metas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metas" ON metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metas" ON metas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metas" ON metas
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para achievements (user_id é UUID)
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para templates (user_id é UUID)
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para shared_treinos (Feed Social)
CREATE POLICY "Anyone can view public shared treinos" ON shared_treinos
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own shared treinos" ON shared_treinos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own shared treinos" ON shared_treinos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own shared treinos" ON shared_treinos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own shared treinos" ON shared_treinos
  FOR DELETE USING (auth.uid()::text = user_id);

-- Políticas para treino_comments
CREATE POLICY "Anyone can view comments on public treinos" ON treino_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_treinos 
      WHERE shared_treinos.id = treino_comments.shared_treino_id 
      AND shared_treinos.is_public = true
    )
  );

CREATE POLICY "Users can view own comments" ON treino_comments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert comments" ON treino_comments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own comments" ON treino_comments
  FOR DELETE USING (auth.uid()::text = user_id);
```

## 🚀 Como Integrar

1. **Instalar Supabase Client:**
```bash
npm install @supabase/supabase-js
```

2. **Configurar variáveis de ambiente:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

3. **Atualizar `src/config/supabase.ts`:**
   - Descomentar o código
   - Configurar com suas credenciais

4. **Atualizar tabela users (se já existir):**
   - Execute o script `ATUALIZAR_TABELA_USERS.sql` no SQL Editor
   - Isso adiciona `avatar_url` e `bio` sem modificar dados existentes

5. **Configurar Storage para fotos de perfil:**
   - Siga o guia em `CONFIGURACAO_STORAGE.md`
   - Crie o bucket `avatars` no Supabase Storage
   - Configure as políticas de segurança

6. **Migrar serviços:**
   - Atualizar `treinoService.ts` para usar Supabase
   - Atualizar `fotoService.ts` para usar Supabase
   - Atualizar `metasService.ts` para usar Supabase
   - Atualizar `gamificationService.ts` para usar Supabase
   - Atualizar `templatesService.ts` para usar Supabase
   - Atualizar `socialService.ts` para usar Supabase (✅ JÁ CONECTADO)
   - Atualizar `profileService.ts` para usar Supabase (✅ JÁ CONECTADO)

5. **Implementar sincronização:**
   - Usar `supabaseService.syncPending()` quando voltar online
   - Implementar detecção de conflitos
   - Adicionar retry logic

## 📦 Estrutura de Migração

O serviço `supabaseService.ts` já está preparado com:
- ✅ Fallback para localStorage
- ✅ Detecção de status online/offline
- ✅ Sistema de sincronização pendente
- ✅ Estrutura pronta para Supabase

Basta descomentar e implementar as chamadas ao Supabase quando estiver pronto!

## 📄 Script SQL Completo

Um arquivo `POLITICAS_RLS_CORRETAS.sql` foi criado na raiz do projeto com todas as políticas RLS corretas. Você pode copiar e colar diretamente no SQL Editor do Supabase.

