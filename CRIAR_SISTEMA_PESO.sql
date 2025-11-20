-- =====================================================
-- SISTEMA DE RASTREAMENTO DE PESO
-- =====================================================
-- Este script cria:
-- - Tabela para armazenar registros de peso
-- - Views e funções para estatísticas
-- - RLS policies

-- 1. TABELA DE PESOS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  weight DECIMAL(5, 2) NOT NULL CHECK (weight > 0 AND weight < 1000),
  body_fat_percentage DECIMAL(4, 2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  muscle_mass DECIMAL(5, 2) CHECK (muscle_mass >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_weight CHECK (weight > 0 AND weight < 1000)
);

CREATE INDEX IF NOT EXISTS idx_user_weights_user_id ON user_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weights_created_at ON user_weights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_weights_user_created ON user_weights(user_id, created_at DESC);

-- 2. FUNÇÕES ÚTEIS
-- =====================================================

-- Buscar peso mais recente do usuário
CREATE OR REPLACE FUNCTION get_latest_weight(p_user_id TEXT)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_weight DECIMAL(5, 2);
BEGIN
  SELECT weight INTO v_weight
  FROM user_weights
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_weight, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calcular perda/ganho de peso desde o primeiro registro
CREATE OR REPLACE FUNCTION get_weight_change(p_user_id TEXT)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_first_weight DECIMAL(5, 2);
  v_latest_weight DECIMAL(5, 2);
BEGIN
  SELECT weight INTO v_first_weight
  FROM user_weights
  WHERE user_id = p_user_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  SELECT weight INTO v_latest_weight
  FROM user_weights
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_first_weight IS NULL OR v_latest_weight IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN v_latest_weight - v_first_weight;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VIEW PARA ESTATÍSTICAS DE PESO
-- =====================================================
CREATE OR REPLACE VIEW user_weight_stats AS
SELECT 
  user_id,
  COUNT(*) as total_records,
  MIN(weight) as min_weight,
  MAX(weight) as max_weight,
  AVG(weight) as avg_weight,
  (SELECT weight FROM user_weights w2 WHERE w2.user_id = w1.user_id ORDER BY created_at DESC LIMIT 1) as latest_weight,
  (SELECT weight FROM user_weights w2 WHERE w2.user_id = w1.user_id ORDER BY created_at ASC LIMIT 1) as first_weight,
  (SELECT created_at FROM user_weights w2 WHERE w2.user_id = w1.user_id ORDER BY created_at DESC LIMIT 1) as last_recorded_at,
  (SELECT created_at FROM user_weights w2 WHERE w2.user_id = w1.user_id ORDER BY created_at ASC LIMIT 1) as first_recorded_at
FROM user_weights w1
GROUP BY user_id;

-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weights" ON user_weights;
CREATE POLICY "Users can view own weights"
ON user_weights FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can insert own weights" ON user_weights;
CREATE POLICY "Users can insert own weights"
ON user_weights FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can update own weights" ON user_weights;
CREATE POLICY "Users can update own weights"
ON user_weights FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

DROP POLICY IF EXISTS "Users can delete own weights" ON user_weights;
CREATE POLICY "Users can delete own weights"
ON user_weights FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

-- Comentários
COMMENT ON TABLE user_weights IS 'Sistema de rastreamento de peso corporal';
COMMENT ON FUNCTION get_latest_weight IS 'Retorna o peso mais recente do usuário';
COMMENT ON FUNCTION get_weight_change IS 'Calcula a mudança de peso desde o primeiro registro';

