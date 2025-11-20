-- Adicionar coluna bio na tabela users
-- Execute este script no Supabase SQL Editor

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN bio TEXT;
        
        COMMENT ON COLUMN users.bio IS 'Biografia do usuário';
    END IF;
END $$;

-- Atualizar RLS para permitir leitura pública da bio
-- (já deve estar coberto pelas políticas existentes, mas vamos garantir)

-- Verificar se já existe política de leitura pública
-- Se não existir, criar uma que permita ver bio de todos os usuários
-- (As políticas existentes já devem cobrir isso)

