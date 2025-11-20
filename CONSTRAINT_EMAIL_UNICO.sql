-- Garantir que o email seja único na tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar constraint de unicidade no email (se ainda não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Criar índice para melhor performance (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Comentário para documentação
COMMENT ON COLUMN users.email IS 'Email único do usuário (usado para autenticação)';

