# 🔔 Guia Completo do Sistema de Notificações

## ✅ O que foi implementado

### 1. **Sistema Completo de Notificações**
- Tabela `notifications` no Supabase
- Triggers automáticos para criar notificações
- Service para gerenciar notificações
- Componente de notificações (NotificationBell)
- Painel admin para enviar notificações para todos

### 2. **Histórico Detalhado por Exercício Melhorado**
- Estatísticas avançadas (média, melhor, pior)
- Progresso recente (% de melhoria)
- Gráfico comparativo (peso + reps)
- Gráfico de volume em barras
- Comparação entre períodos

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Execute o SQL no Supabase

Abra o Supabase SQL Editor e execute:

```sql
-- Copie todo o conteúdo de CRIAR_SISTEMA_NOTIFICACOES.sql
```

Este script cria:
- Tabela `notifications`
- Função `create_notification()` - Criar notificação individual
- Função `send_notification_to_all()` - Admin enviar para todos
- Função `mark_notification_read()` - Marcar como lida
- Função `mark_all_notifications_read()` - Marcar todas como lidas
- Triggers automáticos para:
  - Quando alguém curte seu post
  - Quando alguém comenta seu post
  - Quando alguém reage ao seu post
- RLS policies para segurança

---

## 🎨 Componentes Criados

### 1. **NotificationBell.tsx**
**Localização:** `src/components/NotificationBell.tsx`

**Funcionalidades:**
- Badge com contador de não lidas
- Popover com lista de notificações
- Marcar como lida ao clicar
- Marcar todas como lidas
- Atualização automática a cada 30 segundos
- Navegação para conteúdo relacionado

**Onde aparece:**
- Navbar (ao lado do botão de sync)

### 2. **AdminNotificationPanel.tsx**
**Localização:** `src/components/AdminNotificationPanel.tsx`

**Funcionalidades:**
- Dialog para criar notificação
- Seleção de tipo (Anúncio, Lembrete, Desafio, Ranking)
- Título e mensagem
- Enviar para todos os usuários
- Validação de campos

**Onde aparece:**
- Dashboard (apenas para admins)

---

## 📊 Página de Exercício Melhorada

### **ExercicioDetalhes.tsx**
**Localização:** `src/pages/ExercicioDetalhes.tsx`

**Novas funcionalidades:**
- ✅ Estatísticas avançadas:
  - Peso médio
  - Volume médio
  - Reps médias
  - Peso mínimo
  - Progresso recente (%)
- ✅ Gráfico comparativo:
  - Peso e Reps no mesmo gráfico
  - Eixos Y separados
- ✅ Gráfico de volume em barras
- ✅ Cards de estatísticas expandidos

---

## 🔔 Tipos de Notificações

### Automáticas (via Triggers):
1. **like** - Quando alguém curte seu post
2. **comment** - Quando alguém comenta seu post
3. **reaction** - Quando alguém reage ao seu post

### Manuais (via código):
4. **follow** - Quando alguém te segue
5. **badge** - Quando desbloqueia um badge
6. **goal** - Quando meta está próxima
7. **workout_reminder** - Lembrete de treino
8. **challenge** - Novo desafio disponível
9. **ranking** - Atualização de ranking

### Admin:
10. **admin** - Notificação geral do admin

---

## 🎯 Como Usar

### Para Usuários:

1. **Ver Notificações:**
   - Clique no ícone de sino 🔔 na Navbar
   - Veja todas as notificações não lidas destacadas
   - Clique em uma notificação para marcar como lida

2. **Marcar Todas como Lidas:**
   - Abra o popover de notificações
   - Clique em "Marcar todas como lidas"

### Para Admin:

1. **Enviar Notificação para Todos:**
   - Acesse o Dashboard
   - Veja o card "Painel Administrativo"
   - Clique em "Enviar Notificação"
   - Preencha:
     - Tipo de notificação
     - Título
     - Mensagem
   - Clique em "Enviar para Todos"

2. **Tipos Disponíveis:**
   - 📢 Anúncio Geral
   - ⏰ Lembrete de Treino
   - 🏆 Novo Desafio
   - 🏅 Atualização de Ranking

---

## 🔧 Integração com Componentes

As notificações são criadas automaticamente via triggers do Supabase quando:
- Alguém curte um post (trigger: `trigger_notify_post_liked`)
- Alguém comenta um post (trigger: `trigger_notify_post_commented`)
- Alguém reage a um post (trigger: `trigger_notify_post_reacted`)

**Não é necessário modificar os componentes existentes!** Os triggers fazem tudo automaticamente.

---

## 📱 Service de Notificações

### **notificationService.ts**
**Localização:** `src/services/notificationService.ts`

**Métodos disponíveis:**

```typescript
// Buscar notificações
await notificationService.getNotifications(userId, limit);

// Contar não lidas
await notificationService.getUnreadCount(userId);

// Marcar como lida
await notificationService.markAsRead(notificationId, userId);

// Marcar todas como lidas
await notificationService.markAllAsRead(userId);

// Criar notificação (uso interno)
await notificationService.createNotification(
  userId,
  type,
  title,
  message,
  data
);

// Admin: Enviar para todos
await notificationService.sendToAll(
  type,
  title,
  message,
  data
);
```

---

## 🎨 Customização

### Adicionar Novo Tipo de Notificação:

1. **No SQL:**
   - Adicione o tipo no `CHECK` constraint da tabela `notifications`

2. **No código:**
   - Adicione o tipo na interface `Notification`
   - Adicione o emoji no `NotificationBell.tsx`

### Criar Notificação Manualmente:

```typescript
import { notificationService } from "@/services/notificationService";

await notificationService.createNotification(
  userId,
  'badge',
  'Badge Desbloqueado!',
  'Você desbloqueou o badge "Primeiro Treino"',
  { badge_id: 'first_workout' }
);
```

---

## 🚀 Próximos Passos

### Para Completar:

1. **Notificações Push (Web Push API)**
   - Solicitar permissão do usuário
   - Registrar service worker
   - Enviar notificações mesmo com app fechado

2. **Notificações de Badge**
   - Criar notificação quando badge é desbloqueado
   - Integrar com `gamificationService`

3. **Notificações de Meta**
   - Criar quando meta está 80% completa
   - Criar quando meta é alcançada

4. **Lembretes de Treino**
   - Configuração de horário preferido
   - Notificação diária configurável

---

## ✅ Checklist de Implementação

- [x] SQL criado e testado
- [x] Service de notificações
- [x] Componente NotificationBell
- [x] Integração na Navbar
- [x] Painel Admin
- [x] Triggers automáticos
- [x] Histórico de exercício melhorado
- [ ] Notificações push (opcional)
- [ ] Integração com badges
- [ ] Integração com metas

---

## 🐛 Troubleshooting

### Notificações não aparecem:
1. Verifique se executou o SQL no Supabase
2. Verifique se os triggers estão ativos
3. Verifique o console do navegador para erros
4. Verifique RLS policies

### Admin não consegue enviar:
1. Verifique se o email está na lista de admins
2. Verifique se a função `send_notification_to_all` existe
3. Verifique permissões no Supabase

---

**Sistema completo e funcional! 🎉**

