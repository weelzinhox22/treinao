-- =====================================================
-- CONFIRMAR EMAIL MANUALMENTE NO SUPABASE
-- =====================================================
-- Use este script se você não recebeu o email de confirmação
-- ou se deseja confirmar o email manualmente
-- =====================================================

-- 1. VERIFICAR SE O EMAIL FOI CONFIRMADO
-- =====================================================
-- Execute esta query primeiro para verificar o status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
    ELSE '✅ Confirmado'
  END AS status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. CONFIRMAR EMAIL MANUALMENTE
-- =====================================================
-- IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo email correto!

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu-email@exemplo.com';

-- OU se você souber o ID do usuário:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE id = 'user-id-aqui';

-- 3. VERIFICAR SE FUNCIONOU
-- =====================================================
-- Execute novamente a query de verificação
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com';

-- Se email_confirmed_at tiver uma data, está confirmado! ✅

-- =====================================================
-- DESABILITAR CONFIRMAÇÃO DE EMAIL (Para desenvolvimento)
-- =====================================================
-- Se você quiser desabilitar a confirmação de email completamente,
-- vá para o painel do Supabase:
-- Authentication → Providers → Email → Desmarque "Confirm email"

-- =====================================================
-- REENVIAR EMAIL DE CONFIRMAÇÃO (Via código)
-- =====================================================
-- Se preferir reenviar o email de confirmação via código,
-- você pode usar a API do Supabase no seu frontend:
/*
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'seu-email@exemplo.com'
});
*/


