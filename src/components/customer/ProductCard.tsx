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
  const [localQty, setLocalQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  function increment() {
    setLocalQty(q => Math.min(q + 1, 999))
  }
  function decrement() {
    setLocalQty(q => Math.max(q - 1, 1))
  }
  function onQtyChange(v: string) {
    const n = parseInt(v.replace(/\D/g, ''), 10)
    if (Number.isFinite(n) && n > 0) setLocalQty(Math.min(n, 999))
    else if (v === '') setLocalQty(1)
  }

  function handleAdd() {
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
    }, localQty)
    setJustAdded(true)
    setLocalQty(1)
    setTimeout(() => setJustAdded(false), 1400)
  }

  const economyPct = product.market_price && product.market_price > product.price
    ? Math.round((1 - product.price / product.market_price) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden flex flex-col group">
      {/* Image area */}
      <button
        onClick={showDetails}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative aspect-square bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-20 h-28 bg-gradient-to-br from-navy-700 to-brand-blue rounded-lg flex items-center justify-center text-white shadow-lg">
            <span className="font-display font-extrabold text-xs">{product.sku?.replace(/[a-z]/g, '') || '?'}</span>
          </div>
        )}
        {economyPct > 0 && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            <TrendingDown className="w-3 h-3" aria-hidden /> {economyPct}%
          </div>
        )}
        {inCart > 0 && (
          <div className="absolute top-2 right-2 bg-brand-cyan text-white text-xs font-extrabold min-w-[24px] h-6 px-1.5 rounded-full shadow flex items-center justify-center" aria-label={`${inCart} no carrinho`}>
            {inCart}
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1 min-h-0 mb-3">
          <button onClick={showDetails} className="text-left w-full focus:outline-none">
            <div className="font-semibold text-sm text-navy-800 line-clamp-2 leading-snug mb-0.5">{product.name}</div>
            <div className="text-[11px] text-slate-400 mb-1.5">SKU {product.sku || '—'}</div>
            {product.short_use && (
              <div className="text-xs text-slate-500 line-clamp-2">{product.short_use}</div>
            )}
          </button>
        </div>

        {/* Price + market */}
        <div className="mb-3">
          <div className="font-display font-extrabold text-xl text-emerald-600 leading-none tabular-nums">
            {fmtBRL(product.price)}
          </div>
          {product.market_price && product.market_price > product.price && (
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Mercado: <span className="line-through">{fmtBRL(product.market_price)}</span>
            </div>
          )}
        </div>

        {/* Quantity stepper + Add button (sempre empilhados, mais limpo em todos breakpoints) */}
        <div className="flex flex-col gap-2">
          {/* Stepper */}
          <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden h-11 w-full">
            <button
              type="button"
              onClick={decrement}
              disabled={localQty <= 1}
              aria-label="Diminuir quantidade"
              className="w-10 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-inset"
            >
              <Minus className="w-4 h-4" aria-hidden />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localQty}
              onChange={e => onQtyChange(e.target.value)}
              aria-label="Quantidade"
              className="flex-1 h-full text-center text-sm font-bold text-navy-800 bg-transparent outline-none tabular-nums focus:bg-white min-w-0"
            />
            <button
              type="button"
              onClick={increment}
              aria-label="Aumentar quantidade"
              className="w-10 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-inset"
            >
              <Plus className="w-4 h-4" aria-hidden />
            </button>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Adicionar ${localQty} ${product.name} ao carrinho`}
            className={cn(
              'flex-1 h-11 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              justAdded
                ? 'bg-emerald-500 text-white focus-visible:ring-emerald-500'
                : 'bg-navy-800 text-white hover:bg-navy-700 focus-visible:ring-navy-500'
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" aria-hidden /> Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" aria-hidden /> Adicionar
              </>
            )}
          </button>
        </div>

        {/* Status quando já tem no carrinho */}
        {inCart > 0 && (
          <button
            type="button"
            onClick={() => updateQty(product.id, 0)}
            className="mt-2 text-[11px] text-slate-500 hover:text-red-500 underline transition focus:outline-none"
          >
            Remover do carrinho ({inCart})
          </button>
        )}
      </div>
    </div>
  )
}
