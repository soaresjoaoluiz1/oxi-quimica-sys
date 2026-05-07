# Integração com ERP ProManager Proxsis — Plano

> Status: **arquivado pra retomada futura**. Não iniciado.
> Aguardando autorização do cliente + credenciais de API.

---

## Contexto

A Oxiquímica Varginha usa o **ProManager Proxsis** como ERP interno. A doc da
API está em https://proxsis.com.br/apidoc.html e o spec OpenAPI completo em
https://proxsis.com.br/apidoc.yaml

A integração elimina a digitação manual: pedidos do `oxi-pedidos` viram
documentos automaticamente no ERP, e o status de faturamento volta pra cá.

## Características técnicas da API

- **Auth:** HTTP Basic (usuário + senha do ProManager)
- **Header obrigatório:** `x-promanager-filial` (ID da filial)
- **Paginação:** headers `X-ProManager-Pagina-Inicio` + `X-ProManager-Pagina-Quant`
- **Filtros:** headers `X-Promanager-Busca-Filtro` + `X-Promanager-Busca-Parametro`
- **Sem webhooks** — integração é pull (a gente puxa) + push (a gente envia)
- **Servers:**
  - On-premise: `http://localhost:8081/datasnap/rest/TSMApi` (cada cliente)
  - Demo: `http://app.proxsis.com.br:8077/datasnap/rest/TSMApi`

## Endpoints relevantes

### Pull (a gente puxa)

| Endpoint | Uso |
|---|---|
| `GET /ObterTabelasPreco` | ★ Tabelas COM itens e preços inline (1 call só) |
| `GET /ObterItens` | Catálogo (peso, NCM, GTIN, família, custo) |
| `GET /ObterFamilias` | Categorias |
| `GET /ObterParticipantes` | Clientes |
| `GET /ObterParticipante/{ID}` | Cliente por ID |
| `GET /ObterCondicaoPagamento` | Prazos de pagamento |
| `GET /ObterFormasPagamento` | Boleto/PIX/etc |
| `GET /ObterDepositos` | Depósitos |
| `GET /ObterPedidosFaturados/{ini}/{fim}` | Match por `numero_web` → atualiza status |

### Push (a gente envia)

| Endpoint | Uso | Chave de idempotência |
|---|---|---|
| `POST /"SalvarParticipante"` | Cria/atualiza cliente | `pes_cpf_cnpj` |
| `POST /"SalvarItem"` | Cria/atualiza item | `ite_numero` |
| `POST /"SalvarPedidoVenda"` | ★ Manda pedido pro ERP | `doc_ped_web` (= nosso `order_number`) |
| `GET /"AlterarSituacaoPedido"/{DocId}/{Situacao}` | Cancelar/separar |

### Statuses do `AlterarSituacaoPedido`
- 1 = Aberto
- 2 = Faturamento Parcial
- 3 = Faturado
- 4 = Cancelado
- 17 = Em separação
- 18 = Separado

## Pontos críticos

1. **`SalvarPedidoVenda` requer:** `oin_id`, `tpr_id`, `cpa_id`, `tti_id`,
   `pes_id_cli`, `doc_dt_emissao`, `pes_id_ven`, `doc_ped_web`, `doc_tipo`
2. **`PedidoVendaItem` requer:** `ite_id`, `dit_quantidade`, `dit_vlr_unitario`,
   `lotes` (também required! usar `[{ lot_id: 1, dil_qtd: qty }]`)
3. **`pes_cpf_cnpj`** = chave única do participante (sync sem duplicar)
4. **`ite_numero`** = chave única do item — bate direto com nosso `sku`
5. **`EquivalenciaOperacao`** permite usar `oin_id=0` e mandar a operação por
   DE-PARA — útil pra evitar hardcodar IDs do cliente

## Plano em fases (~7 dias)

### Fase A — Setup & cliente HTTP (1 dia)

**Schema novo:**
```sql
CREATE TABLE erp_config (
  id INTEGER PRIMARY KEY,
  base_url TEXT,
  username TEXT,
  password TEXT,        -- encrypted
  filial_id INTEGER,
  vendor_pes_id INTEGER,
  operation_oin_id INTEGER,
  deposit_dep_id INTEGER,
  is_active INTEGER DEFAULT 0,
  last_sync_at TEXT
);
```

**Colunas idempotentes:**
- `products.erp_ite_id` INT
- `categories.erp_fam_id` INT
- `price_tables.erp_tpr_id` INT
- `customers.erp_pes_id` INT
- `payment_terms.erp_cpa_id` INT, `erp_tti_id` INT
- `orders.erp_doc_id` INT, `erp_synced_at` TEXT, `erp_error` TEXT

**Frontend:** Admin → Configurações → Integração ERP
- URL, usuário, senha (encrypted), filial
- Botão "Testar conexão" → `GET /ObterTabelasPreco`
- Selectors carregados do ERP: vendedor, operação interna, depósito

**Backend:** `server/lib/proxsis-client.js`
- `proxsisRequest(method, path, opts)` injetando auth + headers
- Cache de config
- Tratamento de erros + log estruturado

### Fase B — Sync de catálogo (2 dias)

`POST /api/admin/erp/sync/catalog`:
1. `GET /ObterFamilias` → upsert em `categories` (match por `fam_id`)
2. `GET /ObterTabelasPreco` → upsert em `price_tables` + `price_table_items`
3. `GET /ObterItens` → upsert em `products` (match por `sku == ite_numero`)

Cron diário opcional 6h da manhã.

### Fase C — Sync de clientes (1 dia)

- Auto-push: ao salvar cliente com `document` → `POST /"SalvarParticipante"`
- Pull noturno: cron 2h chama `ObterParticipantes` e atualiza por document

### Fase D — Push pedido pro ERP (2 dias) ★

Botão "Enviar pro ERP" + auto-trigger ao mudar status pra `confirmado`.

```js
// Payload
{
  doc_tipo: 2,
  doc_ped_web: order.order_number,
  pes_id_cli: customer.erp_pes_id,
  pes_id_ven: config.vendor_pes_id,
  oin_id: config.operation_oin_id,
  tpr_id: price_table.erp_tpr_id,
  cpa_id: payment_term.erp_cpa_id,
  tti_id: payment_term.erp_tti_id,
  doc_dt_emissao: order.created_at,
  doc_outras_obs: order.notes,
  doc_tot_liquido: order.total_value,
  DocumentoItens: order_items.map(i => ({
    ite_id: i.product.erp_ite_id,
    dit_quantidade: i.quantity,
    dit_vlr_unitario: i.unit_price_snapshot,
    dep_id: config.deposit_dep_id,
    lotes: [{ lot_id: 1, dil_qtd: i.quantity }]
  }))
}
```

Salvar `doc_id` retornado em `orders.erp_doc_id`.
Status visual no admin: ✓ ERP / ↻ pendente / ⚠ erro.

### Fase E — Pull faturamento (1 dia)

Cron 7h chama `GET /ObterPedidosFaturados/{ontem}/{hoje}`:
- Match por `numero_web` (= nosso `order_number`)
- Marca como `entregue`
- Cria entrada em `order_status_history` com nota "Faturado no ERP — NF X"

## Pré-requisitos pra começar

### 1. Credenciais de API
- URL da API (ex: `http://erp-oxi.com.br:8081/datasnap/rest/TSMApi`)
- Usuário + senha (criados no ProManager → Permissões → Integração API)
- ID da filial Varginha

### 2. Acesso de rede
- Liberar IP da VPS `162.214.146.220` no firewall
- Porta do ProManager (geralmente 8081)
- HTTPS preferível

### 3. Mapeamentos iniciais
- Vendedor "do site" (`pes_id_ven`) — criar participante "VENDA WEB"
- Operação Interna (`oin_id`) — escolher entre as cadastradas
- Depósito padrão (`dep_id`)
- Mapear nossos `payment_terms` ↔ `cpa_id` + `tti_id` deles

### Decisões estratégicas
- ERP é fonte da verdade do catálogo? (recomendado: SIM)
- Sync manual ou cron automático? (recomendado: manual primeiro, cron depois)

## Modelo de mensagem pra solicitar acesso

> Olá! Pra integrar o sistema de pedidos online
> (`pedidos.oxiquimicavarginha.com.br`) com o ProManager Proxsis,
> preciso que vocês peçam ao TI/Proxsis:
>
> **1. Liberar acesso à API REST do ProManager**
>    - Criar usuário dedicado (ex: "INTEGRACAO_WEB") com permissão
>      de Integração API
>    - Me passar URL da API, usuário + senha, ID da Filial Varginha
>
> **2. Liberar o IP da VPS no firewall**
>    - IP: `162.214.146.220`
>    - Porta: a mesma onde o ProManager escuta (geralmente 8081)
>
> **3. Confirmar/criar no ProManager:**
>    - Vendedor pra assinar os pedidos do site
>    - Operação Interna a usar
>    - Depósito padrão
>
> Doc oficial: https://proxsis.com.br/apidoc.html

## Quando retomar

1. Conferir status com o cliente Oxi
2. Se as credenciais chegaram, começar pela **Fase A**
3. Se não chegaram, mandar de novo o modelo de mensagem acima
