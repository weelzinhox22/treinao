# 🔧 Troubleshooting: Vercel não atualiza após Git Push

## 🔍 Diagnóstico Rápido

### 1. Verificar se o Push foi feito corretamente

```bash
# Verificar status do Git
git status

# Verificar último commit
git log -1

# Verificar se está no branch correto
git branch

# Verificar se o push foi feito
git log origin/main -1
```

### 2. Verificar no Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Deployments**
4. Verifique se aparece um novo deploy após o push

**Se não aparecer → Problema de integração Git/Vercel**
**Se aparecer mas falhar → Problema de build**

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: Vercel não detecta o push

**Sintomas:**
- Push feito, mas nenhum deploy aparece no Vercel
- Dashboard mostra "Last deployed: X hours ago"

**Soluções:**

#### A) Verificar Integração Git

1. Vercel Dashboard → **Settings** → **Git**
2. Verifique se o repositório está conectado
3. Verifique se o branch está correto (geralmente `main` ou `master`)
4. Se não estiver conectado, clique em **Connect Git Repository**

#### B) Verificar Webhooks

1. Vercel Dashboard → **Settings** → **Git**
2. Verifique se os webhooks estão ativos
3. Se não estiverem, reconecte o repositório

#### C) Fazer Deploy Manual

1. Vercel Dashboard → **Deployments**
2. Clique em **"Add New..."** → **"Deploy"**
3. Selecione o branch `main`
4. Clique em **"Deploy"**

---

### Problema 2: Deploy aparece mas falha

**Sintomas:**
- Deploy aparece no dashboard
- Status: ❌ Failed ou ⚠️ Error

**Soluções:**

#### A) Verificar Build Logs

1. Vercel Dashboard → **Deployments**
2. Clique no deploy que falhou
3. Veja a aba **"Build Logs"**
4. Procure por erros (geralmente em vermelho)

**Erros comuns:**
- `Module not found` → Dependência faltando
- `Build failed` → Erro de TypeScript/ESLint
- `Environment variables missing` → Variáveis de ambiente não configuradas

#### B) Verificar Variáveis de Ambiente

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Verifique se todas as variáveis estão configuradas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Se faltar alguma, adicione e faça **Redeploy**

#### C) Testar Build Local

```bash
# Testar se o build funciona localmente
npm run build

# Se der erro, corrija antes de fazer push
```

---

### Problema 3: Deploy funciona mas mudanças não aparecem

**Sintomas:**
- Deploy concluído com sucesso ✅
- Mas o site ainda mostra versão antiga

**Soluções:**

#### A) Limpar Cache do Vercel

1. Vercel Dashboard → **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **"Redeploy"**
4. **IMPORTANTE:** Desmarque ☐ **"Use existing Build Cache"**
5. Clique em **"Redeploy"**

#### B) Limpar Cache do Navegador

No navegador (F12 → Console):

```javascript
// Limpar tudo
localStorage.clear();
sessionStorage.clear();

// Remover Service Workers
navigator.serviceWorker.getRegistrations().then(r => {
  r.forEach(reg => reg.unregister());
  console.log("✅ Service Workers removidos!");
});

// Recarregar forçando cache
location.reload(true);
```

Ou use **Ctrl + Shift + R** (Windows) / **Cmd + Shift + R** (Mac)

#### C) Verificar Service Worker

O service worker pode estar cacheando versões antigas:

1. F12 → **Application** → **Service Workers**
2. Clique em **"Unregister"** em todos
3. Recarregue a página

---

## ✅ Checklist de Verificação

Antes de fazer push:

- [ ] Código testado localmente (`npm run dev`)
- [ ] Build funciona (`npm run build`)
- [ ] Sem erros de lint (`npm run lint`)
- [ ] Todas as mudanças commitadas (`git status` limpo)
- [ ] Push feito para o branch correto (`git push origin main`)

Após o push:

- [ ] Verificar se deploy aparece no Vercel (aguardar ~30 segundos)
- [ ] Verificar status do deploy (sucesso/falha)
- [ ] Se falhar, verificar Build Logs
- [ ] Se sucesso, limpar cache do navegador
- [ ] Testar no site em produção

---

## 🚀 Solução Rápida (Passo a Passo)

### Se o Vercel não está detectando pushes:

1. **Reconectar Git Repository:**
   ```
   Vercel Dashboard → Settings → Git → Disconnect → Connect Again
   ```

2. **Fazer Deploy Manual:**
   ```
   Vercel Dashboard → Deployments → Add New → Deploy
   ```

3. **Verificar Branch:**
   ```
   Vercel Dashboard → Settings → Git → Production Branch
   Deve ser: main (ou master)
   ```

### Se o deploy falha:

1. **Ver Build Logs:**
   ```
   Vercel Dashboard → Deployments → [Deploy Falhado] → Build Logs
   ```

2. **Corrigir erros encontrados**

3. **Fazer novo push:**
   ```bash
   git add .
   git commit -m "fix: corrige erro de build"
   git push
   ```

### Se deploy funciona mas não atualiza:

1. **Redeploy sem cache:**
   ```
   Vercel Dashboard → Deployments → [3 pontos] → Redeploy
   ☐ Desmarcar "Use existing Build Cache"
   ```

2. **Limpar cache do navegador:**
   ```
   Ctrl + Shift + R (ou Cmd + Shift + R)
   ```

3. **Limpar Service Worker:**
   ```
   F12 → Application → Service Workers → Unregister
   ```

---

## 🔗 Links Úteis

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs
- **Status do Vercel:** https://www.vercel-status.com

---

## 💡 Dica Pro

Para garantir que o Vercel sempre detecte mudanças:

1. **Sempre faça commit antes de push:**
   ```bash
   git add .
   git commit -m "feat: descrição clara"
   git push
   ```

2. **Use mensagens de commit descritivas**

3. **Verifique o deploy logo após o push** (aguarde ~1 minuto)

4. **Se não aparecer, faça deploy manual**

---

## 🆘 Se Nada Funcionar

1. **Verificar se o repositório está público/privado:**
   - Repositórios privados precisam de permissão específica no Vercel

2. **Verificar limites do plano Vercel:**
   - Planos gratuitos têm limites de deploys

3. **Contatar suporte Vercel:**
   - Vercel Dashboard → Help → Contact Support

4. **Verificar se há problemas no Vercel:**
   - https://www.vercel-status.com

