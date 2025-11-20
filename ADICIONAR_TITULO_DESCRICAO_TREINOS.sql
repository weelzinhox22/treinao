-- Adicionar colunas title e description na tabela quick_workouts

ALTER TABLE public.quick_workouts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Comentários
COMMENT ON COLUMN public.quick_workouts.title IS 'Título opcional do treino';
COMMENT ON COLUMN public.quick_workouts.description IS 'Descrição/legenda opcional do treino';

