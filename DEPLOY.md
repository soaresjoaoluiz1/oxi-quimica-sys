# Deploy — Oxi Pedidos

**Servidor:** VPS Oxiquímica (mesma da LP `revendedor.oxiquimicavarginha.com.br`)
**Domínio:** `pedidos.oxiquimicavarginha.com.br`
**Stack:** Node 16 (constraint CentOS 7 / glibc 2.17) · Express 4 · better-sqlite3 10 · React + Vite 4
**Caminho na VPS:** `/root/oxi-pedidos`
**PM2 process:** `dros-oxi-pedidos` na porta `3005`

---

## Pré-requisitos na VPS (1ª vez)

### 1. Node 18 via nvm (não afeta outros sistemas que rodam Node 16)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm alias default 18
node -v   # deve mostrar v18.x
```

> Se já tem `nvm` instalado, pula direto pro `nvm install 18`.

### 2. PM2 e SQLite CLI

```bash
npm install -g pm2
yum install -y sqlite   # se ainda não tiver
```

### 3. Apache reverse proxy

Abre o cPanel → **Apache HTTP Server → Edit Configuration** OU edita direto:

```bash
# Cria arquivo de virtual host
cat > /etc/httpd/conf.d/oxi-pedidos.conf <<'EOF'
<VirtualHost *:80>
  ServerName pedidos.oxiquimicavarginha.com.br
  ProxyPreserveHost On
  ProxyPass / http://localhost:3005/
  ProxyPassReverse / http://localhost:3005/
  ErrorLog /var/log/httpd/oxi-pedidos-error.log
  CustomLog /var/log/httpd/oxi-pedidos-access.log combined
</VirtualHost>
EOF

systemctl reload httpd
```

### 4. SSL (Let's Encrypt)

No cPanel: **SSL/TLS Status** → seleciona `pedidos.oxiquimicavarginha.com.br` → "Run AutoSSL". Renova automaticamente.

### 5. DNS

No painel do registrar do domínio, adiciona um registro **A**:

```
pedidos.oxiquimicavarginha.com.br   A   <IP da VPS>
```

---

## Deploy (1ª vez)

```bash
cd /root
git clone https://github.com/<user>/oxi-pedidos.git
cd oxi-pedidos

# Cria .env com configurações de produção (copia .env.example e ajusta)
cp .env.example .env
nano .env

# Instala deps backend (Node 18 vai pegar prebuild de better-sqlite3 v12)
npm install --omit=dev

# Popular banco com catálogo
npm run seed

# Cria pasta de logs e backups
mkdir -p logs backups

# Sobe com PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # gera comando, copia e roda como sugerido (uma vez só)

# Backup diário (cron)
chmod +x scripts/backup.sh
( crontab -l 2>/dev/null; echo "0 3 * * * /root/oxi-pedidos/scripts/backup.sh >> /root/oxi-pedidos/logs/backup.log 2>&1" ) | crontab -
```

Testa: `curl http://localhost:3005/api/health` deve retornar JSON com `"ok":true`.

---

## Deploy de updates (rotina)

**Workflow:** mudança local → commit → push → pull na VPS → restart.

### Fluxo completo (frontend + backend)

**Local:**
```bash
cd "Open Squad/oxi-pedidos"
npm run build              # builda frontend → dist/ (commitada no git)
git add -A
git commit -m "feat: ..."
git push origin main
```

**VPS:**
```bash
cd /root/oxi-pedidos
git pull
pm2 restart dros-oxi-pedidos
```

### Só backend (rotas, server/)

```bash
cd /root/oxi-pedidos
git pull
pm2 restart dros-oxi-pedidos
```

### Backend + nova dependência npm

```bash
cd /root/oxi-pedidos
git pull
npm install --omit=dev
pm2 restart dros-oxi-pedidos
```

### Reset completo (quando der pau no lock ou trocar versão de pacote)

```bash
cd /root/oxi-pedidos
rm -f package-lock.json
rm -rf node_modules
git pull
npm install --omit=dev
pm2 restart dros-oxi-pedidos
```

---

## Variáveis de ambiente (`.env` na VPS)

```env
NODE_ENV=production
PORT=3005
JWT_SECRET=<string-aleatoria-longa-de-no-minimo-32-chars>
APP_URL=https://pedidos.oxiquimicavarginha.com.br

# Email (se vazio, app funciona mas não envia emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<email>
SMTP_PASS=<senha-de-app>
MAIL_FROM=Oxi Pedidos <pedidos@oxiquimicavarginha.com.br>
ADMIN_NOTIFY_EMAIL=admin@oxiquimicavarginha.com.br
```

Pra gerar `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Comandos úteis

```bash
pm2 logs dros-oxi-pedidos          # acompanhar logs em tempo real
pm2 monit                          # dashboard de processos
pm2 restart dros-oxi-pedidos       # restart
pm2 stop dros-oxi-pedidos          # parar
pm2 delete dros-oxi-pedidos        # remover de vez

# Healthcheck
curl https://pedidos.oxiquimicavarginha.com.br/api/health

# Listar backups
ls -lh /root/oxi-pedidos/backups/

# Restaurar backup
gunzip -c /root/oxi-pedidos/backups/oxi-pedidos_2026-XX-XX.db.gz > /root/oxi-pedidos/server/data/oxi-pedidos.db
pm2 restart dros-oxi-pedidos
```

---

## Troubleshooting

**`Error: listen EADDRINUSE :::3005`** → outro processo já usa a porta. `lsof -i :3005` pra ver qual e mata.

**`better-sqlite3` falha no `npm install`** → confirma que está usando Node 18: `node -v`. Se vier `v16.x`, roda `nvm use 18`.

**Frontend serve 404 em rotas tipo `/admin/products`** → o `server/index.js` já tem fallback pro `index.html`. Confirma que `dist/` foi gerado e commitado: `ls -la /root/oxi-pedidos/dist/`.

**Email não dispara em produção** → verifica logs (`pm2 logs dros-oxi-pedidos`). Procura por `[mailer]`. Se aparecer `[mailer:DRY-RUN]`, é porque `SMTP_HOST` não está no `.env`.
