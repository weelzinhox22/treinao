-- Adicionar campos de horário de início e duração detalhada
ALTER TABLE quick_workouts 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_minutes_detailed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- Manter duration_minutes para compatibilidade (será calculado)
-- Se já existir, não precisa fazer nada

-- Comentários para documentação
COMMENT ON COLUMN quick_workouts.start_time IS 'Horário de início do treino';
COMMENT ON COLUMN quick_workouts.duration_hours IS 'Horas de duração do treino';
COMMENT ON COLUMN quick_workouts.duration_minutes_detailed IS 'Minutos de duração do treino';
COMMENT ON COLUMN quick_workouts.duration_seconds IS 'Segundos de duração do treino';
COMMENT ON COLUMN quick_workouts.duration_minutes IS 'Duração total em minutos (calculado)';

