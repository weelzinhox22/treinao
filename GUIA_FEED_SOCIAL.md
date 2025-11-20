# 🎉 Guia Completo do Feed Social dos Grupos

## 📋 O que foi implementado

### ✅ Funcionalidades Completas

1. **Feed de Grupos**
   - Página dedicada para cada grupo (`/grupo/:groupId`)
   - Visualização de posts dos membros
   - Estatísticas do grupo (posts, curtidas, comentários)
   - Interface moderna e responsiva

2. **Criar Posts**
   - Título e descrição personalizados
   - Seleção de emoji do dia (mood)
   - Upload de foto do treino
   - Tipos de treino (Musculação, Cardio, Yoga, Outro)
   - Duração em minutos
   - Sistema de pontos automático

3. **Interações Sociais**
   - ❤️ Curtir posts
   - 💬 Comentar em posts
   - 😊 Reagir com emojis (🔥💪👏😍💯🎉)
   - Deletar próprios posts e comentários

4. **Sistema de Pontos**
   - Musculação: 3.0 pts por minuto
   - Cardio: 2.0 pts por minuto
   - Yoga/Pilates: 1.5 pts por minuto
   - Outro: 2.0 pts por minuto

## 🗄️ Banco de Dados

### Passo 1: Execute o SQL

Abra o Supabase SQL Editor e execute:

```sql
-- Copie todo o conteúdo de CRIAR_FEED_GRUPOS_COMPLETO.sql
```

Este script cria:
- Tabela `group_posts` (posts dos grupos)
- Tabela `post_comments` (comentários)
- Tabela `post_likes` (curtidas)
- Tabela `post_reactions` (reações com emoji)
- Storage bucket `workout-photos` (já existe)
- RLS policies para segurança

## 🎨 Componentes Criados

### 1. **GroupFeed.tsx** (Página Principal)
```
src/pages/GroupFeed.tsx
```
- Feed do grupo com todos os posts
- Estatísticas em tempo real
- Botão para criar novo post
- Navegação de volta ao feed geral

### 2. **GroupPostCard.tsx** (Card do Post)
```
src/components/GroupPostCard.tsx
```
- Exibe post individual
- Botões de curtir, comentar, reagir
- Delete para posts próprios
- Foto do treino (se houver)

### 3. **CreatePostDialog.tsx** (Dialog de Criar Post)
```
src/components/CreatePostDialog.tsx
```
- Formulário completo
- Upload de foto
- Seletor de emoji
- Preview de pontos

### 4. **CommentSection.tsx** (Seção de Comentários)
```
src/components/CommentSection.tsx
```
- Lista de comentários
- Adicionar novo comentário
- Deletar próprios comentários
- Tempo relativo (ex: "há 5 minutos")

### 5. **ReactionButton.tsx** (Botão de Reações)
```
src/components/ReactionButton.tsx
```
- Popover com emojis
- Reações rápidas

### 6. **EmojiPicker.tsx** (Seletor de Emoji do Dia)
```
src/components/EmojiPicker.tsx
```
- 8 emojis de humor
- Visual limpo

## 🚀 Como Usar

### 1. Acessar o Feed do Grupo

Na página Feed (`/feed`), você verá:
- Dropdown **"Meus Grupos"**: Clique para navegar ao feed do grupo
- Botão **"Gerenciar"**: Para criar/gerenciar grupos

### 2. Criar um Post

No feed do grupo:
1. Clique em **"Novo Post"**
2. Selecione o emoji do dia (opcional)
3. Digite o título do treino (obrigatório)
4. Adicione uma descrição (opcional)
5. Escolha o tipo de treino
6. Informe a duração em minutos
7. Adicione uma foto (opcional, max 10MB)
8. Veja os pontos calculados automaticamente
9. Clique em **"Publicar"**

### 3. Interagir com Posts

- **Curtir**: Clique no botão ❤️
- **Comentar**: Clique em 💬 e escreva
- **Reagir**: Clique em 😊 e escolha um emoji
- **Deletar**: Menu ⋮ (apenas seus posts)

## 🔒 Segurança (RLS)

Todas as tabelas possuem Row Level Security:

- **Posts**: 
  - Ver: Membros do grupo
  - Criar: Membros autenticados
  - Deletar: Apenas o autor

- **Comentários**:
  - Ver: Membros do grupo
  - Criar: Membros autenticados
  - Deletar: Apenas o autor

- **Curtidas/Reações**:
  - Ver: Membros do grupo
  - Criar/Deletar: Usuário autenticado

## 📱 Navegação

### Rotas Adicionadas

```
/grupo/:groupId → Feed do grupo específico
```

### Estrutura de Navegação

```
Feed (/feed)
  └─ Meus Grupos (dropdown)
      └─ Grupo X → /grupo/:groupId
          ├─ Ver Posts
          ├─ Criar Post
          ├─ Comentar
          ├─ Curtir
          └─ Reagir
```

## 🎯 Funcionalidades Especiais

### Emoji do Dia
Escolha como você se sente:
- 😎 Confiante
- 💪 Forte
- 🔥 Motivado
- 😤 Determinado
- 😊 Feliz
- 😴 Cansado
- 🤒 Doente
- 😐 Normal

### Sistema de Pontos
Incentiva treinos mais longos e intensos:
- 30 min de musculação = 90 pts
- 30 min de cardio = 60 pts
- 30 min de yoga = 45 pts

### Timestamps Inteligentes
- "há 5 minutos"
- "há 2 horas"
- "há 3 dias"
(usando date-fns/locale/ptBR)

## 🐛 Troubleshooting

### Erro: Posts não aparecem
1. Verifique se você é membro do grupo
2. Confirme que executou o SQL completo
3. Veja o console para erros de RLS

### Erro: Não consigo curtir/comentar
1. Verifique se está autenticado
2. Confirme que é membro do grupo
3. Verifique RLS policies

### Erro: Upload de foto falha
1. Máximo 10MB por foto
2. Verifique bucket `workout-photos` existe
3. Confirme RLS do storage

## 📊 Estatísticas do Grupo

No topo do feed do grupo, você vê:
- **Total de Posts**: Quantos treinos foram compartilhados
- **Total de Curtidas**: Engajamento do grupo
- **Total de Comentários**: Interações

## 🎨 Design

- **Tema Dark**: Seguindo o design do app
- **Gradientes**: Cards com efeito gradient
- **Responsivo**: Funciona em mobile e desktop
- **Smooth**: Transições suaves
- **Acessível**: Botões grandes, contraste adequado

## 🔄 Próximos Passos Sugeridos

1. **Notificações**: Avisar quando alguém curtir/comentar
2. **Menções**: @usuario nos comentários
3. **Hashtags**: #treino para categorizar
4. **Filtros**: Por tipo de treino, data, etc.
5. **Galeria**: Ver todas as fotos do grupo
6. **Badges**: Conquistas por engajamento
7. **Stories**: Posts que somem em 24h
8. **Challenges**: Desafios dentro do grupo

## ✅ Checklist de Implementação

- [x] Criar tabelas no Supabase
- [x] Criar componentes React
- [x] Adicionar rotas
- [x] Implementar upload de fotos
- [x] Sistema de curtidas
- [x] Sistema de comentários
- [x] Reações com emoji
- [x] Emoji do dia
- [x] Sistema de pontos
- [x] Navegação entre grupos
- [x] RLS policies
- [x] UI responsiva
- [x] Formatação de datas

## 🎉 Pronto!

Seu feed social está completo e funcionando! Os usuários agora podem:
- Compartilhar treinos com fotos
- Expressar sentimentos com emojis
- Interagir com curtidas e comentários
- Competir com o sistema de pontos
- Criar comunidades fortes nos grupos

**Bora treinar! 💪🔥**

