# Oxi Pedidos

Sistema de pedidos online para revendedores Oxiquímica Varginha.

**Stack:** Node 16 + Express 4 + better-sqlite3 + React 19 + Vite 4 + Tailwind 3
**Deploy alvo:** `pedidos.oxiquimicavarginha.com.br` (mesma VPS da LP)

## Como rodar local

```bash
# 1. Instalar dependências (na primeira vez)
npm install

# 2. Popular o banco com o catálogo Oxi (admin + 80 produtos + 3 tabelas)
npm run seed

# 3. Subir backend (3005) + frontend (5173) juntos
npm run dev
```

Abre `http://localhost:5173` — vai mostrar o dashboard de status da Fase 0.

## Acesso admin (após o seed)

```
Email:  admin@oxiquimicavarginha.com.br
Senha:  admin123    ⚠ TROCAR no primeiro login
```

## Estrutura

```
oxi-pedidos/
├── server/
│   ├── index.js         # Express bootstrap
│   ├── db.js            # Schema SQLite (10 tabelas)
│   ├── seed.js          # Importer one-shot do catálogo
│   ├── data/
│   │   └── products-catalog.js   # Dataset extraído do catalogo-oxi-mercado.html
│   ├── middleware/      # JWT auth (Fase 1)
│   └── routes/          # API REST (Fase 1)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   ├── components/
│   ├── context/
│   └── lib/
├── public/
├── package.json
├── vite.config.ts       # Proxy /api → :3005
└── tailwind.config.js
```

## Banco de dados (SQLite)

Caminho: `server/data/oxi-pedidos.db` (gitignorado).

10 tabelas:
- `users`, `customers` (admin + clientes/revendedores)
- `categories`, `products` (catálogo)
- `price_tables`, `price_table_items` (preços por tabela)
- `payment_terms` (prazos: 20/30/40/50/60/70 dias)
- `orders`, `order_items` (pedidos com snapshot de preço)
- `order_status_history` (histórico de mudanças)
- `banners` (slider promocional do catálogo)

## Comandos úteis

```bash
npm run dev          # backend + frontend juntos
npm run dev:server   # só backend
npm run dev:client   # só frontend
npm run seed         # popular banco (só se vazio)
npm run seed:reset   # apaga tudo e re-popula
npm run build        # build frontend pra dist/
```

## Status do projeto

- [x] Fase 0 — Setup + schema + importer
- [ ] Fase 1 — Backend API (auth, produtos, pedidos)
- [ ] Fase 2 — Painel admin (CRUD + bulk price editor + pedidos)
- [ ] Fase 3 — Catálogo do cliente + carrinho + checkout
- [ ] Fase 4 — Notificação WhatsApp + export CSV
- [ ] Fase 5 — Deploy `pedidos.oxiquimicavarginha.com.br`
