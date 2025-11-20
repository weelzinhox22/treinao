# 🔐 Configuração do Painel Admin de Notificações

## 📍 Onde Fica o Painel Admin

O painel admin aparece no **Dashboard** (`/dashboard`) apenas para usuários administradores.

**Localização:** No topo da página Dashboard, em um card destacado com borda azul.

---

## 🔧 Como Configurar Acesso Admin

### Opção 1: Por Email (Atual)

O sistema verifica se o email do usuário é:
- `weelzinhox22@gmail.com` (seu email)
- Qualquer email que contenha `@admin.` (ex: `admin@admin.com`)

**Para adicionar mais admins:**

1. Edite `src/components/AdminNotificationPanel.tsx`:
```typescript
const isAdmin = user?.email === 'weelzinhox22@gmail.com' 
  || user?.email === 'outro@admin.com'  // Adicione aqui
  || user?.email?.includes('@admin.');
```

2. Edite `src/pages/Dashboard.tsx`:
```typescript
{(user?.email === 'weelzinhox22@gmail.com' 
  || user?.email === 'outro@admin.com'  // Adicione aqui
  || user?.email?.includes('@admin.')) && (
```

3. Edite `CRIAR_SISTEMA_NOTIFICACOES.sql`:
```sql
IF v_current_user_email NOT IN (
  'weelzinhox22@gmail.com',
  'outro@admin.com',  -- Adicione aqui
  -- ...
) THEN
```

---

### Opção 2: Tabela de Admins (Recomendado)

Crie uma tabela de admins no Supabase:

```sql
-- Criar tabela de admins
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar você como admin
INSERT INTO admins (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'weelzinhox22@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- RLS: Apenas admins podem ver a lista
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admins list"
ON admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);
```

Depois atualize a função `send_notification_to_all`:

```sql
CREATE OR REPLACE FUNCTION send_notification_to_all(...)
RETURNS INTEGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem enviar notificações para todos';
  END IF;
  
  -- ... resto do código
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚀 Como Usar o Painel Admin

1. **Acesse o Dashboard:**
   - Faça login com sua conta admin
   - Vá para `/dashboard`
   - O card "Painel Administrativo" aparece no topo

2. **Enviar Notificação:**
   - Clique em "Enviar Notificação"
   - Escolha o tipo:
     - 📢 Anúncio Geral
     - ⏰ Lembrete de Treino
     - 🏆 Novo Desafio
     - 🏅 Atualização de Ranking
   - Preencha título e mensagem
   - Clique em "Enviar para Todos"

3. **Notificações Push:**
   - As notificações são salvas no banco
   - Aparecem no sino 🔔 da Navbar
   - Para push real, precisa configurar Web Push API (veja abaixo)

---

## 📱 Configurar Notificações Push (Web Push)

### Passo 1: Gerar VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Salve as chaves geradas.

### Passo 2: Adicionar ao Supabase

No Supabase Dashboard:
1. Vá em **Settings** → **API**
2. Role até **Web Push**
3. Adicione as VAPID keys

### Passo 3: Criar Service Worker para Push

Crie `public/push-sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.data,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data?.post_id) {
    event.waitUntil(
      clients.openWindow(`/grupo/${event.notification.data.group_id}`)
    );
  }
});
```

### Passo 4: Solicitar Permissão e Registrar

Adicione no `src/App.tsx` ou componente de inicialização:

```typescript
// Solicitar permissão de notificações
if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      // Registrar service worker de push
      navigator.serviceWorker.register('/push-sw.js');
    }
  });
}
```

---

## 🔒 Segurança

### Verificação no Backend (SQL)

A função `send_notification_to_all` verifica se o usuário é admin antes de permitir o envio.

**IMPORTANTE:** A verificação está no SQL, então mesmo que alguém tente chamar a função diretamente, será bloqueado se não for admin.

### Verificação no Frontend

O componente `AdminNotificationPanel` só renderiza se o usuário for admin, mas isso é apenas UI. A segurança real está no backend (SQL).

---

## 🐛 Troubleshooting

### Painel não aparece:
1. Verifique se seu email está na lista de admins
2. Verifique o console do navegador
3. Faça logout e login novamente

### Erro ao enviar notificação:
1. Verifique se executou o SQL `CRIAR_SISTEMA_NOTIFICACOES.sql`
2. Verifique se a função `send_notification_to_all` existe
3. Verifique se você está na lista de admins no SQL

### Notificações não aparecem:
1. Verifique se os triggers estão ativos
2. Verifique RLS policies
3. Verifique o console do navegador

---

## 📝 Exemplo de Uso

### Enviar Anúncio Geral:
```
Tipo: 📢 Anúncio Geral
Título: Novo Desafio Semanal!
Mensagem: Participe do desafio desta semana e ganhe pontos extras! 🏆
```

### Enviar Lembrete:
```
Tipo: ⏰ Lembrete de Treino
Título: Hora de Treinar! 💪
Mensagem: Não esqueça de registrar seu treino de hoje!
```

---

**O painel admin está no Dashboard, no topo da página! 🔔**

