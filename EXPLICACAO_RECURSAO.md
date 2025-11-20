# 🔄 Problema: Recursão Infinita nas Policies

## ❌ Por que estava dando erro?

```
❌ infinite recursion detected in policy for relation "group_members"
```

### O Problema Original:

```sql
-- ESTA POLICY CAUSA RECURSÃO! ❌
CREATE POLICY "Members can view group members"
ON group_members FOR SELECT
USING (
  -- Consulta group_members dentro de group_members!
  group_id IN (
    SELECT gm.group_id FROM group_members gm  -- ← RECURSÃO!
    WHERE gm.user_id = auth.uid()::text
  )
);
```

**Por que é recursão?**

1. Usuário tenta fazer: `SELECT * FROM group_members`
2. Policy executa: `SELECT group_id FROM group_members WHERE...`
3. Essa segunda query precisa checar a policy novamente!
4. Que executa outra query em `group_members`...
5. **Loop infinito!** 💥

---

## ✅ Solução: Policies Simples

### Opção 1: Sem Subqueries (Implementada)

```sql
-- SEM RECURSÃO ✅
CREATE POLICY "Anyone can view all members"
ON group_members FOR SELECT
TO authenticated
USING (true);  -- ← Sem subquery!
```

**Vantagens:**
- ✅ Zero recursão
- ✅ Funciona sempre
- ✅ Simples de entender
- ✅ Rápido

**Desvantagens:**
- ⚠️ Todos veem todos os membros (mas isso é OK para app social)

---

### Opção 2: Com Cache (Alternativa Futura)

Se precisar de mais privacidade depois:

```sql
-- Criar função que usa cache
CREATE OR REPLACE FUNCTION user_groups(user_uuid uuid)
RETURNS TABLE(group_id text)
LANGUAGE sql
STABLE  -- ← Importante! Evita recalcular
AS $$
  SELECT group_id 
  FROM group_members 
  WHERE user_id = user_uuid::text;
$$;

-- Policy usando função
CREATE POLICY "Members can view group members"
ON group_members FOR SELECT
USING (
  group_id IN (SELECT user_groups(auth.uid()))  -- ← Função cached
);
```

---

## 🎯 Por que a Solução Simples é OK?

### Para um App de Fitness Social:

1. **Grupos são semi-públicos**
   - Qualquer um pode ver os membros
   - Incentiva competição saudável
   - Similar ao Strava, GymRats, etc

2. **Privacidade onde importa**
   - ✅ Só você vê seus treinos detalhados
   - ✅ Só você edita seus dados
   - ✅ Só owner remove membros

3. **Performance**
   - Queries rápidas
   - Sem recursão = sem travamentos

---

## 📊 O que cada Policy faz:

### GROUPS

| Policy | O que permite |
|--------|---------------|
| `Anyone can view all groups` | Ver todos os grupos (buscar por código) |
| `Anyone can create groups` | Criar grupo novo |
| `Owners can update groups` | Só owner edita nome/descrição |
| `Owners can delete groups` | Só owner deleta grupo |

### GROUP_MEMBERS

| Policy | O que permite |
|--------|---------------|
| `Anyone can view all members` | Ver membros de qualquer grupo |
| `Users can join groups` | Entrar em grupo com código |
| `Users can update own membership` | Atualizar próprios pontos |
| `Users can leave groups` | Sair do grupo |

---

## 🔒 Onde a Segurança REALMENTE importa:

✅ **Protegido:**
- Deletar grupo: só owner
- Remover membros: implementar via função, não policy
- Editar grupo: só owner
- Criar treinos: só você

⚠️ **Público (proposital):**
- Ver grupos: todos (para buscar por código)
- Ver membros: todos (para ranking e feed)

---

## 🚀 Próximo Passo

Execute **`CORRIGIR_GROUPS_SIMPLES.sql`** e vai funcionar! ✅

Depois, se precisar de mais privacidade, implementamos a Opção 2 com cache.

