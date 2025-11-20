# 🔍 Verificação do Arquivo .env

## Problema
O Vite não está carregando as variáveis de ambiente do arquivo `.env`.

## Solução

### 1. Verificar se o arquivo .env existe na raiz do projeto
```bash
# No PowerShell
Test-Path .env
# Deve retornar: True
```

### 2. Verificar o conteúdo do arquivo
```bash
Get-Content .env
```

Deve mostrar:
```
VITE_SUPABASE_URL=https://hvpbouaonwolixgedjaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. IMPORTANTE: Reiniciar o servidor completamente

**O Vite só carrega variáveis de ambiente quando o servidor é iniciado!**

1. Pare o servidor completamente (Ctrl+C no terminal)
2. Feche todos os terminais que estão rodando o servidor
3. Abra um novo terminal
4. Execute:
```bash
npm run dev
```

### 4. Verificar no console do navegador

Após reiniciar, você deve ver no console:
```
🔍 Debug Supabase Config: {hasUrl: true, hasKey: true, ...}
```

Se ainda mostrar `hasUrl: false`, verifique:
- O arquivo `.env` está na raiz do projeto (mesmo nível que `package.json`)
- Não há espaços antes ou depois do `=` no arquivo `.env`
- Não há aspas ao redor dos valores
- O arquivo está salvo como UTF-8

### 5. Formato correto do .env

```env
VITE_SUPABASE_URL=https://hvpbouaonwolixgedjaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cGJvdWFvbndvbGl4Z2VkamFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTkzNDIsImV4cCI6MjA3OTE3NTM0Mn0.RlMMMVdj4CJH916sUu4d_gCgVZ3sEeriZ627ybanEsw
```

**IMPORTANTE:**
- Sem espaços antes ou depois do `=`
- Sem aspas ao redor dos valores
- Sem linhas em branco extras
- Cada variável em uma linha separada

