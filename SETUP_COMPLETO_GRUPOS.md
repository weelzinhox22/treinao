# 🎯 Setup Completo: Grupos, Feed e Ranking

## 🚨 Problema Atual

```
❌ infinite recursion detected in policy for relation "group_members"
```

As políticas RLS têm **recursão infinita** porque consultam a própria tabela.

---

## ✅ Solução (3 Passos)

### 1️⃣ Executar SQL no Supabase

Abra **SQL Editor** do Supabase e execute **NA ORDEM**:

#### A) Criar Tabelas (se não existirem)
```sql
-- Execute TABELAS_GRUPOS_DESAFIOS.sql PRIMEIRO
```

#### B) Corrigir Políticas (IMPORTANTE!)
```sql
-- Execute CORRIGIR_GROUPS_POLICIES.sql
```

### 2️⃣ Reiniciar App

Limpe o cache e recarregue:
```javascript
localStorage.clear();
location.reload();
```

### 3️⃣ Testar Criar Grupo

Deve funcionar sem erro agora! ✅

---

## 📊 Features Implementadas

### ✅ O que JÁ funciona:

1. **Fotos de Progresso**
   - Upload para Storage
   - Metadados na tabela
   - Sincronização entre dispositivos

2. **Treinos**
   - Registro de treinos
   - Histórico
   - Estatísticas

3. **Metas**
   - Criação de metas
   - Acompanhamento
   - Conquistas

### ⚠️ O que PRECISA das tabelas:

1. **Feed Público**
   - Ver todos os treinos
   - Ranking global
   - Check-ins do mês

2. **Grupos Privados**
   - Criar grupo
   - Código de convite
   - Ranking do grupo

3. **Desafios**
   - Criar desafio no grupo
   - Participantes
   - Pontuação

---

## 🎨 Design do Sistema

### Feed Público (Todos Vêem)

```
┌─────────────────────────────────────┐
│  🏆 RANKING GLOBAL                  │
├─────────────────────────────────────┤
│  1. João Silva        1.250 pts    │
│  2. Maria Santos      1.100 pts    │
│  3. Você (weelzinho)    980 pts    │
│  4. Pedro Oliveira      850 pts    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📅 CHECK-INS NOVEMBRO              │
├─────────────────────────────────────┤
│  S  M  T  W  T  F  S                │
│  ✅ ✅ ✅ ⬜ ✅ ✅ ⬜               │
│  ✅ ⬜ ✅ ✅ ✅ ✅ ✅               │
│  ✅ ✅ ✅ ⬜ ⬜ ⬜ ⬜               │
│                                     │
│  18 dias de treino este mês! 🔥    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📰 ÚLTIMAS ATIVIDADES              │
├─────────────────────────────────────┤
│  João Silva • 2h atrás              │
│  🏋️ Treino de Peito                │
│  45 min • 150 pts                   │
│  ❤️ 12  💬 3                        │
├─────────────────────────────────────┤
│  Maria Santos • 5h atrás            │
│  🏃 Corrida                          │
│  30 min • 100 pts                   │
│  ❤️ 8   💬 1                        │
└─────────────────────────────────────┘
```

### Grupos Privados (Apenas Membros)

```
┌─────────────────────────────────────┐
│  👥 MEUS GRUPOS                     │
├─────────────────────────────────────┤
│  💪 Academia Máxima (15 membros)    │
│  🏃 Corredores BR (8 membros)       │
│  🔥 Desafio 30 Dias (23 membros)    │
├─────────────────────────────────────┤
│  ➕ Criar Grupo                     │
│  🔗 Entrar com Código               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💪 ACADEMIA MÁXIMA                 │
│  Código: ABC123                     │
├─────────────────────────────────────┤
│  🏆 RANKING DO GRUPO                │
│  1. Você (weelzinho)  850 pts 🥇   │
│  2. João Silva        720 pts 🥈   │
│  3. Maria Santos      680 pts 🥉   │
│  ...12 mais                         │
├─────────────────────────────────────┤
│  🎯 DESAFIOS ATIVOS                 │
│  • Treinar 5x esta semana (3/5)    │
│  • 100km corrida em Nov (78/100)   │
└─────────────────────────────────────┘
```

---

## 🔧 Estrutura de Pontos

### Como Funciona:

```typescript
// Cada treino gera pontos:
const pontos = duracaoMinutos * multiplicador

// Multiplicadores:
- 🏋️ Musculação: 3.0 pts/min
- 🏃 Cardio:      2.0 pts/min  
- 🧘 Yoga:        1.5 pts/min
- ⚽ Esporte:     2.5 pts/min
```

### Exemplo:
```
Treino de Peito: 45 min
Pontos = 45 × 3.0 = 135 pts ✅

Corrida: 30 min
Pontos = 30 × 2.0 = 60 pts ✅
```

---

## 📅 Check-ins (Calendário GymRats)

Visual de check-ins do mês:

```
NOVEMBRO 2024
D   S   T   Q   Q   S   S
                1   2   3
4   5   6   7   8   9   10
✅  ✅  ⬜  ✅  ✅  ✅  ⬜

11  12  13  14  15  16  17
✅  ⬜  ✅  ✅  ✅  ✅  ✅

18  19  20  21  22  23  24
✅  ✅  ✅  ⬜  ⬜  ⬜  ⬜

25  26  27  28  29  30
⬜  ⬜  ⬜  ⬜  ⬜  ⬜

18 dias de treino 🔥
Sequência atual: 3 dias 💪
```

---

## 🎯 Fluxo de Uso

### 1. Feed Público (Motivação)
- Ver treinos de todo mundo
- Ranking global
- Like e comentários
- **PÚBLICO** - todos vêem

### 2. Grupos Privados (Competição com Amigos)
- Criar grupo ou entrar com código
- Ranking apenas do grupo
- Desafios exclusivos do grupo
- **PRIVADO** - só membros vêem

### 3. Check-ins (Consistência)
- Calendário mensal
- Sequência de dias
- Badges por consistência

---

## ✅ Próximos Passos

1. **Executar SQLs** (na ordem!)
   - `TABELAS_GRUPOS_DESAFIOS.sql`
   - `CORRIGIR_GROUPS_POLICIES.sql`

2. **Limpar cache**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

3. **Testar**
   - Criar grupo
   - Gerar código
   - Convidar amigo
   - Registrar treino
   - Ver pontos no ranking

---

## 🎉 Resultado Final

Com tudo configurado, você terá:

- ✅ Feed público com ranking global
- ✅ Grupos privados com código de convite
- ✅ Check-ins mensais (calendário)
- ✅ Desafios em grupo
- ✅ Sistema de pontuação
- ✅ Ranking dinâmico

**Um GymRats + Strava completo!** 🚀💪

