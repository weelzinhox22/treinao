# 🧹 Limpar localStorage Cheio

## Problema

O localStorage ficou cheio com fotos em base64 duplicadas, causando o erro:
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': Setting the value of 'supabase_fotos_...' exceeded the quota.
```

## Solução Rápida

Abra o **Console do Navegador** (F12) e execute:

```javascript
// Limpar TODOS os dados do localStorage (cuidado!)
localStorage.clear();
location.reload();
```

## Solução Seletiva (Manter outros dados)

Se quiser manter login e outras configurações, limpe apenas as fotos:

```javascript
// Listar todas as chaves
Object.keys(localStorage).forEach(key => {
  console.log(key, (localStorage.getItem(key)?.length || 0) + ' bytes');
});

// Limpar apenas fotos
Object.keys(localStorage).forEach(key => {
  if (key.includes('fotos') || key.includes('supabase_fotos')) {
    localStorage.removeItem(key);
    console.log('Removido:', key);
  }
});

location.reload();
```

## O que foi corrigido no código?

### 1. ✅ `supabaseService.ts` - Linha 93-99
**Antes:** Acumulava dados (duplicava fotos)
```typescript
const updated = [...existing, ...dataArray]; // ❌ Duplicava!
```

**Depois:** Substitui dados
```typescript
localStorage.setItem(`supabase_${table}_${userId}`, JSON.stringify(dataArray)); // ✅
```

### 2. ✅ `Fotos.tsx` - Upload
**Antes:** Sempre salvava base64 (muito pesado)
```typescript
const base64 = await fotoService.fileToBase64(selectedFile); // ❌ Strings gigantes
```

**Depois:** Upload para Supabase Storage (apenas URL é salva)
```typescript
photoUrl = await workoutPhotoService.uploadWorkoutPhoto(user.id, selectedFile); // ✅
```

## Próximos Passos

1. **Limpe o localStorage** usando um dos scripts acima
2. **Faça login novamente** no app
3. **Teste fazer upload de uma foto** - agora vai para o Supabase Storage
4. As fotos antigas (base64) foram perdidas, mas o localStorage não vai mais estourar

## Verificar Espaço Usado

Para ver quanto espaço está usando:

```javascript
// Ver tamanho total do localStorage
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}
console.log('Total:', (total / 1024 / 1024).toFixed(2), 'MB');
console.log('Limite típico: 5-10 MB');
```

