# 🔧 Correção do Erro: Could not find 'userId' column

## ❌ Erro Identificado

```
❌ Erro ao salvar fotos: "Could not find the 'userId' column of 'fotos' in the schema cache"
```

## 🎯 Causa

- **Tabela Supabase:** usa `user_id` (snake_case)
- **Código:** tentava enviar `userId` (camelCase)
- **Resultado:** Supabase rejeita porque coluna não existe

## ✅ Correção Aplicada

Modificado `supabaseService.ts` para remover campos camelCase antes de enviar:

```typescript
// Remover campos camelCase que não existem na tabela
delete cleaned.userId;      // ❌ não existe, só user_id
delete cleaned.badgeId;     // ❌ não existe, só badge_id
delete cleaned.unlockedAt;  // ❌ não existe, só unlocked_at
delete cleaned.createdAt;   // ❌ não existe, só created_at
delete cleaned.updatedAt;   // ❌ não existe, só updated_at
```

---

## 🧪 Teste Agora

1. **Limpe localStorage** (F12 Console):
```javascript
localStorage.clear();
location.reload();
```

2. **Faça login**

3. **Faça upload de uma foto**

4. **Veja os logs** (deve aparecer):
```
🔄 Salvando foto no Supabase...
💾 Salvando em fotos: [...]
📤 Enviando para Supabase: [...]
✅ Foto salva no Supabase: [...]
✅ Dados de fotos obtidos: 1 registros
```

5. **Abra em outro navegador** - a foto deve aparecer! 🎉

---

## 📊 Estrutura Correta de Dados

### ✅ O que é enviado agora:
```json
{
  "id": "1763646370388",
  "user_id": "87c807cc-7024-4107-b5b4-6b80cdfae0da",
  "url": "https://...supabase.co/storage/v1/object/public/workout-photos/...",
  "date": "2024-01-15T10:30:00Z",
  "description": "Treino de hoje"
}
```

### ❌ O que estava sendo enviado antes (ERRADO):
```json
{
  "id": "1763646370388",
  "user_id": "87c807cc-7024-4107-b5b4-6b80cdfae0da",
  "userId": "87c807cc-7024-4107-b5b4-6b80cdfae0da",  // ❌ coluna não existe!
  "url": "...",
  "date": "...",
  "description": "..."
}
```

---

## 🔍 Verificar no Supabase

### 1. Ver a tabela
Vá em **Table Editor** > **fotos**

Deve ter suas fotos lá!

### 2. Query SQL
```sql
SELECT * FROM fotos WHERE user_id = auth.uid();
```

---

## ✅ Arquivos Modificados

1. **`src/services/supabaseService.ts`**
   - Remove campos camelCase antes de enviar
   
2. **`src/pages/Fotos.tsx`**
   - Remove `userId` duplicado do objeto

3. **`CRIAR_TABELA_FOTOS.sql`**
   - Corrigido para evitar erro de policy já existir

---

## 🎉 Agora Deve Funcionar!

- ✅ Foto vai para o **Storage** (arquivo)
- ✅ Metadados vão para a **tabela fotos**
- ✅ Aparece em outros dispositivos
- ✅ Sincroniza entre navegadores

Teste e me avise! 🚀

