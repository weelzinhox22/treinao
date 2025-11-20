# 💪 TREINÃO DOS CARAS

A plataforma completa para acompanhar seus treinos, registrar sua evolução e alcançar seus objetivos fitness junto com uma comunidade de atletas.

## 🚀 Funcionalidades

- ✅ **Registro de Treinos** - Anote exercícios, séries, repetições e cargas
- ✅ **Progressão Visual** - Gráficos de evolução e recordes pessoais
- ✅ **Fotos de Progresso** - Registre sua transformação física
- ✅ **Sistema de Conquistas** - 80+ badges para desbloquear
- ✅ **Metas e Objetivos** - Defina e acompanhe suas metas
- ✅ **Feed Social** - Compartilhe treinos e inspire outros atletas
- ✅ **Grupos e Desafios** - Crie grupos, participe de desafios e ganhe pontos
- ✅ **Treinos Rápidos** - Registre treinos do dia com pontuação automática
- ✅ **Templates de Treino** - Exercícios pré-cadastrados e templates
- ✅ **Sincronização em Nuvem** - Tudo salvo no Supabase
- ✅ **PWA** - Instale no seu dispositivo
- ✅ **Modo Offline** - Funciona mesmo sem internet

## 🛠️ Tecnologias

- **React** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn-ui** - Componentes UI
- **Supabase** - Backend e banco de dados
- **Recharts** - Gráficos
- **React Router** - Navegação

## 📦 Instalação

```bash
npm install
```

## 🚀 Desenvolvimento

```bash
npm run dev
```

## 📱 Build para Produção

```bash
npm run build
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL na ordem:
   - `TABELAS_GRUPOS_DESAFIOS.sql`
   - `POLITICAS_RLS_CORRETAS.sql`
   - `ATUALIZAR_TABELA_USERS.sql` (se necessário)
3. Configure as variáveis de ambiente:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```
4. Configure o Storage para fotos de perfil (veja `CONFIGURACAO_STORAGE.md`)

## 📚 Documentação

- `README_SUPABASE.md` - Guia completo de integração com Supabase
- `CONFIGURACAO_STORAGE.md` - Configuração do Storage para fotos
- `SECURITY.md` - Guia de segurança
- `FUNCIONALIDADES_GYMRATS.md` - Sugestões de funcionalidades

## 📄 Licença

© 2025 TREINÃO DOS CARAS. Todos os direitos reservados.
