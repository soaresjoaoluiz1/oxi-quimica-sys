import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Package, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, Button, Input, Select, Modal, Badge, Textarea, EmptyState, toast } from '@/components/ui'
import { PageHeader } from '@/components/admin/AdminLayout'
import { fmtBRL } from '@/lib/format'

interface Product {
  id: number
  sku?: string
  name: string
  short_use?: string
  description?: string
  category_id?: number
  category_name?: string
  unit?: string
  market_price?: number
  peso_kg?: number
  volume_m3?: number
  tags?: string[]
  featured: number
  is_active: number
}

interface Category { id: number; name: string }

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryId) params.set('category_id', categoryId)
      const [p, c] = await Promise.all([
        api.get<{ products: Product[] }>(`/admin/products${params.toString() ? '?' + params : ''}`),
        api.get<{ categories: Category[] }>('/admin/categories')
      ])
      setProducts(p.products)
      setCategories(c.categories)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, categoryId])

  async function handleDelete(p: Product) {
    if (!confirm(`Deletar/desativar "${p.name}"?`)) return
    try {
      const res = await api.delete<{ ok: boolean; soft: boolean }>(`/admin/products/${p.id}`)
      toast.success(res.soft ? 'Produto desativado (havia pedidos vinculados)' : 'Produto deletado')
      load()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produto${products.length !== 1 ? 's' : ''}`}
        action={<Button onClick={() => setEditing('new')}><Plus className="w-4 h-4" />Novo produto</Button>}
      />

      <Card className="p-3 mb-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, SKU ou uso…"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy-500 focus:bg-white"
          />
        </div>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy-500 focus:bg-white"
        >
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Card>

      {loading ? (
        <div className="text-sm text-slate-500">Carregando…</div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState icon={<Package className="w-7 h-7" />} title="Nenhum produto" description="Cadastre seu primeiro produto." action={<Button onClick={() => setEditing('new')}>Novo produto</Button>} />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Mercado</th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy-800">{p.name}</div>
                      <div className="text-xs text-slate-500">SKU {p.sku || '—'} · {p.short_use || '—'}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-right font-semibold text-slate-700">{fmtBRL(p.market_price)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      {p.is_active
                        ? p.featured ? <Badge className="bg-amber-100 text-amber-700">Destaque</Badge> : <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                        : <Badge className="bg-slate-100 text-slate-500">Inativo</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </>
  )
}

function ProductModal({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    short_use: product?.short_use || '',
    description: product?.description || '',
    category_id: product?.category_id?.toString() || '',
    unit: product?.unit || 'un',
    market_price: product?.market_price?.toString() || '',
    peso_kg: product?.peso_kg?.toString() || '',
    volume_m3: product?.volume_m3?.toString() || '',
    tags: (product?.tags || []).join(', '),
    featured: product?.featured === 1,
    is_active: product?.is_active !== 0
  })
  const [saving, setSaving] = useState(false)

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return }
    const payload = {
      sku: form.sku || null,
      name: form.name,
      short_use: form.short_use || null,
      description: form.description || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      unit: form.unit || 'un',
      market_price: form.market_price ? Number(form.market_price) : null,
      peso_kg: Number(form.peso_kg) || 0,
      volume_m3: Number(form.volume_m3) || 0,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      featured: form.featured,
      is_active: form.is_active
    }
    setSaving(true)
    try {
      if (product) {
        await api.put(`/admin/products/${product.id}`, payload)
        toast.success('Produto atualizado')
      } else {
        await api.post('/admin/products', payload)
        toast.success('Produto criado')
      }
      onSaved()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={product ? 'Editar produto' : 'Novo produto'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="SKU / Código" value={form.sku} onChange={e => update('sku', e.target.value)} placeholder="Ex: 4147" />
          <Input label="Unidade" value={form.unit} onChange={e => update('unit', e.target.value)} placeholder="un, L, kg" />
        </div>
        <Input label="Nome *" value={form.name} onChange={e => update('name', e.target.value)} placeholder="OXI Detergente Neutro 5L" />
        <Input label="Uso curto" value={form.short_use} onChange={e => update('short_use', e.target.value)} placeholder="Lavar carros sem danificar a pintura" />
        <Textarea label="Descrição" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Categoria" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Preço médio mercado (R$)" type="number" step="0.01" value={form.market_price} onChange={e => update('market_price', e.target.value)} placeholder="0.00" hint="Referência exibida no catálogo" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Peso (kg)" type="number" step="0.01" value={form.peso_kg} onChange={e => update('peso_kg', e.target.value)} hint="Pra resumo de transporte" />
          <Input label="Volume (m³)" type="number" step="0.0001" value={form.volume_m3} onChange={e => update('volume_m3', e.target.value)} />
        </div>

        <Input label="Tags (separadas por vírgula)" value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="Lava-Jato, Premium, 2 em 1" />

        <div className="flex gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-700">Destaque (aparece no banner)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-700">Ativo</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>{product ? 'Salvar' : 'Criar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
