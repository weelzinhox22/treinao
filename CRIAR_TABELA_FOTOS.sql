-- =====================================================
-- CRIAR TABELA DE FOTOS NO SUPABASE
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. CRIAR TABELA FOTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS fotos (
  id TEXT PRIMARY KEY, -- Usando TEXT ao invés de UUID para compatibilidade com localStorage
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_fotos_user_id ON fotos(user_id);
CREATE INDEX IF NOT EXISTS idx_fotos_date ON fotos(date DESC);

-- 2. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can insert own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can update own fotos" ON fotos;
DROP POLICY IF EXISTS "Users can delete own fotos" ON fotos;

-- 4. CRIAR POLÍTICAS RLS
-- =====================================================

-- Permitir que usuários vejam suas próprias fotos
CREATE POLICY "Users can view own fotos"
ON fotos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários insiram suas próprias fotos
CREATE POLICY "Users can insert own fotos"
ON fotos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Users can update own fotos"
ON fotos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários deletem suas próprias fotos
CREATE POLICY "Users can delete own fotos"
ON fotos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. VERIFICAR SE FOI CRIADO
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'fotos'
ORDER BY ordinal_position;

-- Ver as políticas criadas
SELECT 
  schemaname, 
  tablename, 
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE cmd
  END as "Comando"
FROM pg_policies 
WHERE tablename = 'fotos'
ORDER BY policyname;

-- ✅ RESULTADO ESPERADO:
-- - Tabela fotos criada com 6 colunas
-- - 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)
-- - Índices criados

-- 🎉 SE APARECER TUDO, ESTÁ PRONTO!

