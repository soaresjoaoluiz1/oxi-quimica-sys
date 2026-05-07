/**
 * Atualiza o `suggested_sale_price` dos produtos existentes baseado em SKU.
 * NÃO destrói dados — só faz UPDATE nos produtos com SKU correspondente
 * no dataset do catálogo. Produtos custom criados pelo admin não são tocados.
 *
 * Uso:
 *   npm run seed:prices
 */
import db from './db.js'
import { PRODUCTS } from './data/products-catalog.js'

const update = db.prepare(`
  UPDATE products
  SET suggested_sale_price = ?, updated_at = datetime('now')
  WHERE sku = ? AND (suggested_sale_price IS NULL OR suggested_sale_price = 0)
`)

const updateForce = db.prepare(`
  UPDATE products
  SET suggested_sale_price = ?, updated_at = datetime('now')
  WHERE sku = ?
`)

const FORCE = process.argv.includes('--force')
const stmt = FORCE ? updateForce : update

let touched = 0, skipped = 0
const tx = db.transaction(() => {
  for (const p of PRODUCTS) {
    const r = stmt.run(p.suggested_sale_price, p.sku)
    if (r.changes > 0) touched++
    else skipped++
  }
})
tx()

console.log(`[seed:prices] ${touched} produto(s) atualizado(s), ${skipped} pulado(s).`)
console.log(FORCE
  ? '  Modo --force: sobrescreveu mesmo se já tinha valor.'
  : '  Modo padrão: só atualizou produtos sem suggested_sale_price. Use --force pra sobrescrever todos.')
process.exit(0)
