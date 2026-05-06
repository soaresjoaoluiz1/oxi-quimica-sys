import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check, TrendingDown } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { fmtBRL } from '@/lib/format'
import { cn } from '@/lib/cn'

export interface ProductCardData {
  id: number
  sku?: string
  name: string
  short_use?: string
  description?: string
  unit?: string
  image_url?: string
  market_price?: number
  peso_kg?: number
  volume_m3?: number
  tags?: string[]
  price: number
  category_name?: string
}

export default function ProductCard({ product, showDetails }: { product: ProductCardData; showDetails?: () => void }) {
  const { getQty, addItem, updateQty } = useCart()
  const inCart = getQty(product.id)
  const [pulse, setPulse] = useState(false)

  function add() {
    addItem({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      price: product.price,
      peso_kg: product.peso_kg,
      volume_m3: product.volume_m3,
      image_url: product.image_url,
      category_name: product.category_name
    }, 1)
    setPulse(true)
    setTimeout(() => setPulse(false), 300)
  }

  const economyPct = product.market_price && product.market_price > product.price
    ? Math.round((1 - product.price / product.market_price) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden flex flex-col">
      {/* Image area */}
      <button
        onClick={showDetails}
        className="relative aspect-square bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center overflow-hidden group"
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-20 h-28 bg-gradient-to-br from-navy-700 to-brand-blue rounded-lg flex items-center justify-center text-white shadow-lg">
            <span className="font-display font-extrabold text-xs">{product.sku?.replace(/[a-z]/g, '') || '?'}</span>
          </div>
        )}
        {economyPct > 0 && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> {economyPct}%
          </div>
        )}
        {inCart > 0 && (
          <div className="absolute top-2 right-2 bg-brand-cyan text-white text-xs font-bold w-6 h-6 rounded-full shadow flex items-center justify-center">
            {inCart}
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1 min-h-0">
          <button onClick={showDetails} className="text-left w-full">
            <div className="font-semibold text-sm text-navy-800 line-clamp-2 leading-snug mb-1">{product.name}</div>
            <div className="text-xs text-slate-400 mb-2">SKU {product.sku || '—'}</div>
            {product.short_use && (
              <div className="text-xs text-slate-500 line-clamp-2 mb-3">{product.short_use}</div>
            )}
          </button>
        </div>

        {/* Price + market */}
        <div className="mb-3">
          <div className={cn('font-display font-extrabold text-xl text-emerald-600 leading-none', pulse && 'animate-pulse')}>
            {fmtBRL(product.price)}
          </div>
          {product.market_price && product.market_price > product.price && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              Mercado: <span className="line-through">{fmtBRL(product.market_price)}</span>
            </div>
          )}
        </div>

        {/* Buy controls */}
        {inCart === 0 ? (
          <button
            onClick={add}
            className="w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-bold text-sm py-2.5 rounded-lg transition active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" /> COMPRAR
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-500 rounded-lg p-1">
            <button
              onClick={() => updateQty(product.id, inCart - 1)}
              className="w-8 h-8 rounded-md hover:bg-emerald-100 flex items-center justify-center text-emerald-700"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={inCart}
              onChange={e => updateQty(product.id, parseInt(e.target.value || '0', 10))}
              className="flex-1 text-center font-bold text-emerald-700 bg-transparent outline-none text-sm"
            />
            <button
              onClick={add}
              className="w-8 h-8 rounded-md hover:bg-emerald-100 flex items-center justify-center text-emerald-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
