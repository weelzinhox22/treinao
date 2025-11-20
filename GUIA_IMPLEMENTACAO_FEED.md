# 🎨 Guia de Implementação do Feed de Grupos

## 📋 Checklist de Implementação

### 1️⃣ Backend (Supabase) ✅

- [x] Execute `CRIAR_FEED_GRUPOS_COMPLETO.sql`
- [x] Criado `groupPostsService.ts`

### 2️⃣ Componentes a Criar

Agora preciso criar os componentes React. Vou listar o que precisa:

#### Página Principal
- [ ] `src/pages/GroupFeed.tsx` - Página do feed do grupo

#### Componentes
- [ ] `src/components/GroupPost.tsx` - Card do post individual
- [ ] `src/components/CreatePostDialog.tsx` - Dialog para criar post
- [ ] `src/components/CommentSection.tsx` - Seção de comentários
- [ ] `src/components/EmojiPicker.tsx` - Seletor de emoji do dia
- [ ] `src/components/ReactionButton.tsx` - Botões de reação

---

## 🎨 Design do Feed

### Visual do Post

```
┌────────────────────────────────────────┐
│  👤 João Silva  • 2h atrás      [...]  │
│                                         │
│  🔥 Treino Matinal de Peito            │
│  "Hoje foi pesado! 💪"                 │
│                                         │
│  📷 [FOTO DO TREINO]                   │
│                                         │
│  ⏱️ 45 min  •  🏋️ Musculação  •  150pts│
│                                         │
│  ❤️ 12    💬 5    🔥 8    💪 3          │
│                                         │
│  💬 Ver todos os 5 comentários          │
│                                         │
│  [❤️ Curtir] [💭 Comentar] [📤 Compart│
└────────────────────────────────────────┘
```

### Emojis do Dia
```
Como você se sente hoje?
😎 Confiante
💪 Forte  
🔥 Motivado
😴 Cansado
🤒 Doente
😤 Determinado
```

### Tipos de Treino
```
🏋️ Musculação
🏃 Cardio
🧘 Yoga/Pilates
⚽ Esporte
🏊 Natação
🚴 Ciclismo
```

### Reações Disponíveis
```
❤️ Curtir (Like)
🔥 Incrível
💪 Forte
👏 Parabéns
😍 Amei
💯 Perfeito
```

---

## 📊 Fluxo de Uso

### 1. Criar Post

```
Usuário clica em "➕ Novo Post"
↓
Dialog abre com formulário:
- Título (obrigatório)
- Descrição (opcional)
- Tipo de treino
- Duração
- Emoji do dia
- Foto (opcional)
↓
Clica em "Publicar"
↓
Post aparece no feed do grupo
```

### 2. Interagir com Post

```
Ver post no feed
↓
Pode:
- ❤️ Curtir (toggle on/off)
- 🔥 Reagir com emoji (múltiplos)
- 💬 Comentar
- 📤 Compartilhar
- [...] Deletar (se for autor)
```

### 3. Comentários

```
Clica em "Comentar" ou "Ver comentários"
↓
Seção expande mostrando:
- Comentários anteriores
- Campo para novo comentário
↓
Digita e envia
↓
Aparece na lista
```

---

## 🗂️ Estrutura de Arquivos

```
src/
├── pages/
│   └── GroupFeed.tsx          # Página principal do feed
├── components/
│   ├── GroupPost.tsx          # Card individual do post
│   ├── CreatePostDialog.tsx   # Dialog criar post
│   ├── CommentSection.tsx     # Seção de comentários
│   ├── EmojiPicker.tsx        # Picker de emoji
│   └── ReactionButton.tsx     # Botão de reação
└── services/
    └── groupPostsService.ts   # ✅ Já criado
```

---

## 🎯 Funcionalidades

### Post
- [x] Título obrigatório
- [x] Descrição opcional
- [x] Tipo de treino
- [x] Duração
- [x] Emoji do dia
- [x] Foto opcional
- [x] Pontos calculados
- [x] Contadores (likes, comentários)

### Interações
- [x] Curtir/Descurtir
- [x] Reagir com emoji
- [x] Comentar
- [x] Deletar próprio post
- [x] Deletar próprio comentário

### Feed
- [x] Ordenado por mais recente
- [x] Scroll infinito (futuro)
- [x] Filtrar por tipo (futuro)
- [x] Buscar (futuro)

---

## 🔧 Próximos Passos

1. **Execute o SQL**
   ```sql
   -- No Supabase SQL Editor
   CRIAR_FEED_GRUPOS_COMPLETO.sql
   ```

2. **Vou criar os componentes React**
   - GroupFeed.tsx
   - GroupPost.tsx
   - CreatePostDialog.tsx
   - CommentSection.tsx
   - EmojiPicker.tsx
   - ReactionButton.tsx

3. **Adicionar rota**
   - `/grupo/:groupId` → GroupFeed

4. **Testar**
   - Criar post
   - Curtir
   - Comentar
   - Reagir com emoji

---

## 💡 Features Futuras

- [ ] Notificações (alguém curtiu/comentou)
- [ ] Mentions (@usuario)
- [ ] Hashtags (#treino #forca)
- [ ] Compartilhar em outros grupos
- [ ] Stories (24h)
- [ ] Lives de treino
- [ ] Desafios no post
- [ ] Comparar treinos
- [ ] Estatísticas do grupo

---

Quer que eu crie os componentes React agora? 🚀

