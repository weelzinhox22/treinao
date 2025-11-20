# 🏆 Sistema de Pontuação e Gamificação dos Grupos

## 🎯 O que foi implementado

### ✅ Sistema Completo de Pontuação

1. **Pontuação Automática**
   - Posts de treino: Pontos baseados em duração e tipo
   - Receber curtidas: +1 ponto por curtida
   - Receber reações: +1 ponto por reação
   - Fazer comentários: Contabilizado (engajamento)

2. **Badges de Gamificação**
   - 🥇 **Top Contributor**: Maior pontuação do grupo
   - 🎯 **Most Consistent**: Mais posts compartilhados
   - 🔥 **Motivation Master**: Mais comentários feitos

3. **Ranking do Grupo**
   - Top 3 visível no feed
   - Posição individual exibida
   - Atualização automática em tempo real

4. **Estatísticas Individuais**
   - Total de pontos
   - Número de posts
   - Curtidas recebidas
   - Comentários feitos
   - Tempo total de treino

## 🗄️ Estrutura do Banco de Dados

### Nova Tabela: `group_member_stats`

```sql
- id: UUID (PK)
- group_id: TEXT (FK → groups)
- user_id: TEXT (FK → usuário)
- user_name: TEXT
- user_avatar_url: TEXT

-- Estatísticas
- total_points: INTEGER
- posts_count: INTEGER
- likes_received: INTEGER
- comments_made: INTEGER
- reactions_received: INTEGER
- total_workout_minutes: INTEGER

-- Badges
- is_top_contributor: BOOLEAN
- is_most_consistent: BOOLEAN
- is_motivation_master: BOOLEAN
```

### Triggers Automáticos

1. **Quando um post é criado:**
   - Adiciona pontos do treino
   - Incrementa contador de posts
   - Soma minutos de treino

2. **Quando alguém curte:**
   - +1 ponto para quem postou
   - Incrementa curtidas recebidas

3. **Quando alguém comenta:**
   - Incrementa comentários feitos
   - (Pode adicionar pontos depois)

4. **Quando alguém reage:**
   - +1 ponto para quem postou
   - Incrementa reações recebidas

## 📊 Sistema de Pontos

### Cálculo de Pontos por Treino

```typescript
const multipliers = {
  musculacao: 3.0,  // 30 min = 90 pts
  cardio: 2.0,      // 30 min = 60 pts
  yoga: 1.5,        // 30 min = 45 pts
  outro: 2.0,       // 30 min = 60 pts
};

pontos = duração_minutos * multiplicador
```

### Exemplos de Pontuação

| Treino | Duração | Multiplicador | Pontos |
|--------|---------|---------------|---------|
| Musculação | 60 min | 3.0x | **180 pts** |
| Cardio | 30 min | 2.0x | **60 pts** |
| Yoga | 45 min | 1.5x | **68 pts** |
| Receber curtida | - | - | **+1 pt** |
| Receber reação | - | - | **+1 pt** |

## 🎮 Sistema de Níveis (Implementável)

```typescript
// Progressão de níveis
Nível 1: 0-100 pts
Nível 2: 101-300 pts
Nível 3: 301-600 pts
Nível 4: 601-1000 pts
Nível 5: 1001-1500 pts
// E assim por diante...
```

## 🏅 Badges de Gamificação

### 1. Top Contributor 🥇
**Critério:** Maior pontuação do grupo
**Descrição:** O membro mais ativo e que mais contribui
**Visual:** Badge dourado com coroa

### 2. Most Consistent 🎯
**Critério:** Maior número de posts
**Descrição:** Treina regularmente e compartilha
**Visual:** Badge com ícone de alvo

### 3. Motivation Master 🔥
**Critério:** Mais comentários feitos
**Descrição:** Motiva e apoia outros membros
**Visual:** Badge com chama

## 🚀 Como Usar

### 1. Executar o SQL no Supabase

```bash
# Abra o SQL Editor no Supabase
# Execute: CRIAR_SISTEMA_PONTUACAO_GRUPOS.sql
```

### 2. Criar um Post

1. Entre no feed do grupo
2. Clique em "Novo Post"
3. Preencha os dados do treino
4. Publique!

**Resultado:** Pontos são automaticamente calculados e salvos

### 3. Ver Seu Progresso

No feed do grupo, você verá um card com:
- Sua posição no ranking
- Seus badges conquistados
- Suas estatísticas individuais

### 4. Ver o Ranking

O Top 3 é exibido logo abaixo do seu progresso:
- 🥇 1º lugar
- 🥈 2º lugar
- 🥉 3º lugar

## 📱 Interface Visual

### Seu Progresso
```
┌─────────────────────────────────────┐
│ Seu Progresso          🥇 Top       │
│ 2º lugar no ranking                 │
│                                     │
│  180    5      12     8             │
│ Pontos Posts Curtidas Comentários   │
└─────────────────────────────────────┘
```

### Top 3 do Grupo
```
┌─────────────────────────────────────┐
│ 🏆 Top 3 do Grupo                   │
│                                     │
│ 🥇  [Avatar] João Silva      280 pts│
│     5 posts • 150 min               │
│                                     │
│ 🥈  [Avatar] Maria Santos    180 pts│
│     3 posts • 90 min                │
│                                     │
│ 🥉  [Avatar] Pedro Costa     120 pts│
│     2 posts • 60 min                │
└─────────────────────────────────────┘
```

## 🔧 Funções SQL Disponíveis

### 1. Atualizar Badges Manualmente
```sql
SELECT update_group_badges();
```

### 2. Ver Ranking de um Grupo
```sql
SELECT * FROM group_rankings WHERE group_id = 'SEU_GROUP_ID';
```

### 3. Ver Stats de um Membro
```sql
SELECT * FROM group_member_stats 
WHERE group_id = 'SEU_GROUP_ID' 
  AND user_id = 'SEU_USER_ID';
```

### 4. Contagem de Membros
```sql
SELECT get_group_member_count('SEU_GROUP_ID');
```

## 🎯 Estratégias para Ganhar Pontos

### Alta Pontuação
1. **Treinos Longos de Musculação**: Máximo multiplicador
2. **Consistência**: Poste todo dia
3. **Engajamento**: Interaja com outros posts

### Badges
1. **Top Contributor**: Faça treinos longos e frequentes
2. **Most Consistent**: Poste regularmente (pelo menos 1x por dia)
3. **Motivation Master**: Comente e apoie outros membros

## 🐛 Troubleshooting

### Pontos não estão aparecendo
1. Verifique se executou o SQL completo
2. Confirme que os triggers foram criados
3. Veja o console para erros

### Ranking não atualiza
1. Recarregue a página
2. Execute `SELECT update_group_badges();`
3. Verifique RLS policies

### Badges não aparecem
1. Execute `SELECT update_group_badges();` manualmente
2. Confira se você realmente tem os requisitos
3. Recarregue a página

## 📊 Queries Úteis

### Ver todos os stats de um grupo
```sql
SELECT 
  user_name,
  total_points,
  posts_count,
  likes_received,
  comments_made,
  total_workout_minutes,
  is_top_contributor,
  is_most_consistent,
  is_motivation_master
FROM group_member_stats
WHERE group_id = 'SEU_GROUP_ID'
ORDER BY total_points DESC;
```

### Ver total de pontos do grupo
```sql
SELECT 
  g.name as group_name,
  COUNT(DISTINCT gms.user_id) as total_members,
  SUM(gms.total_points) as total_points,
  SUM(gms.posts_count) as total_posts,
  SUM(gms.total_workout_minutes) as total_minutes
FROM groups g
LEFT JOIN group_member_stats gms ON gms.group_id = g.id
WHERE g.id = 'SEU_GROUP_ID'
GROUP BY g.id, g.name;
```

## 🎉 Próximas Melhorias Sugeridas

1. **Sistema de Níveis Visual**
   - Barra de progresso para próximo nível
   - Recompensas por nível alcançado

2. **Desafios Semanais**
   - "Treine 5x esta semana" (+50 pts)
   - "Faça um treino de 60 min" (+30 pts)

3. **Conquistas Especiais**
   - "100 posts no grupo" 🎖️
   - "1000 pontos acumulados" 💯
   - "10 dias seguidos postando" 🔥

4. **Leaderboard Global**
   - Ranking entre todos os grupos
   - Comparação de grupos

5. **Streaks (Sequências)**
   - Dias consecutivos treinando
   - Bônus de pontos por streaks

6. **Multiplicadores Temporários**
   - "Happy Hour": 2x pontos às sextas
   - "Desafio do Fim de Semana": 1.5x pontos

## ✅ Checklist de Implementação

- [x] Criar tabela `group_member_stats`
- [x] Criar triggers automáticos
- [x] Criar funções SQL auxiliares
- [x] Criar service TypeScript
- [x] Atualizar interface do GroupFeed
- [x] Exibir progresso individual
- [x] Exibir Top 3 ranking
- [x] Exibir badges conquistados
- [x] Contagem correta de membros
- [x] RLS policies
- [ ] Executar SQL no Supabase
- [ ] Testar criação de posts
- [ ] Testar contabilização de pontos
- [ ] Testar atualização de badges

## 🎊 Resultado Final

Agora seu app tem um sistema completo de gamificação que:
- ✅ Incentiva treinos regulares
- ✅ Promove engajamento social
- ✅ Cria competição saudável
- ✅ Reconhece diferentes tipos de contribuição
- ✅ Mantém membros motivados

**Bora treinar e subir no ranking! 🏋️💪🔥**

