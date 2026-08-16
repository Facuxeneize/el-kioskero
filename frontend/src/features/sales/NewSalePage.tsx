import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiRequest } from '../../api/client'
import type { Paginated, Product, Sale } from '../../types/domain'
import { formatMoney } from '../../utils/format'

interface CartItem { product: Product; quantity: number }

export function NewSalePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scannerRef = useRef<HTMLInputElement>(null)
  const idempotencyKey = useRef(crypto.randomUUID())
  const [barcode, setBarcode] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [error, setError] = useState('')

  const products = useQuery({
    queryKey: ['products', 'sale', search],
    queryFn: () => apiRequest<Paginated<Product>>(`/products?active=true&search=${encodeURIComponent(search)}`),
  })

  const scanProduct = useMutation({
    mutationFn: (code: string) => apiRequest<Product>(`/products/barcode/${encodeURIComponent(code)}`),
    onSuccess: (product) => { addProduct(product); setBarcode(''); scannerRef.current?.focus() },
    onError: (scanError) => setError(scanError.message),
  })

  const confirmSale = useMutation({
    mutationFn: () => apiRequest<Sale>('/sales', {
      method: 'POST',
      headers: { 'idempotency-key': idempotencyKey.current },
      body: JSON.stringify({ items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })) }),
    }),
    onSuccess: async (sale) => {
      setCart([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      navigate(`/ventas/${sale.id}`, { state: { justCreated: true } })
    },
  })

  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0), [cart])
  const totalUnits = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  function addProduct(product: Product) {
    setError('')
    if (product.currentStock <= 0) { setError(`${product.name} no tiene stock disponible.`); return }
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.currentStock) { setError(`Solo hay ${product.currentStock} unidades de ${product.name}.`); return current }
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  function setQuantity(productId: string, quantity: number) {
    const item = cart.find((candidate) => candidate.product.id === productId)
    if (!item) return
    if (quantity <= 0) { setCart((current) => current.filter((candidate) => candidate.product.id !== productId)); return }
    if (quantity > item.product.currentStock) { setError(`Solo hay ${item.product.currentStock} unidades de ${item.product.name}.`); return }
    setError('')
    setCart((current) => current.map((candidate) => candidate.product.id === productId ? { ...candidate, quantity } : candidate))
  }

  function scan(event: FormEvent) {
    event.preventDefault()
    if (barcode.trim()) scanProduct.mutate(barcode.trim())
  }

  return (
    <div className="page sale-page">
      <header className="page-header"><div><p className="eyebrow">PUNTO DE VENTA</p><h1>Nueva venta</h1><p className="muted">Escaneá o buscá productos. El stock se valida al confirmar.</p></div><span className="keyboard-hint">Enter para agregar</span></header>
      <section className="sale-grid">
        <div className="sale-catalog">
          <form className="scanner" onSubmit={scan}><span>▥</span><input ref={scannerRef} autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Escanear código de barras…" /><button className="button primary" type="submit" disabled={scanProduct.isPending}>Agregar</button></form>
          {error && <div className="alert">{error}</div>}
          <article className="panel">
            <div className="toolbar"><input aria-label="Buscar para agregar" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto manualmente…" /><span>{products.data?.pagination.total ?? 0} resultados</span></div>
            <div className="product-picker">{products.data?.items.map((product) => <button disabled={product.currentStock === 0} key={product.id} onClick={() => addProduct(product)}><div><strong>{product.name}</strong><small>{product.barcode} · Stock {product.currentStock}</small></div><span>{formatMoney(product.salePrice)}</span><b>+</b></button>)}</div>
          </article>
        </div>
        <aside className="panel cart">
          <div className="panel-heading"><div><h2>Carrito</h2><small>{totalUnits} unidades</small></div>{cart.length > 0 && <button className="text-button" onClick={() => setCart([])}>Vaciar</button>}</div>
          <div className="cart-items">{cart.length ? cart.map((item) => <div className="cart-item" key={item.product.id}><div><strong>{item.product.name}</strong><small>{formatMoney(item.product.salePrice)} c/u</small></div><div className="quantity"><button onClick={() => setQuantity(item.product.id, item.quantity - 1)}>−</button><input aria-label={`Cantidad de ${item.product.name}`} min="1" max={item.product.currentStock} type="number" value={item.quantity} onChange={(event) => setQuantity(item.product.id, Number(event.target.value))} /><button onClick={() => setQuantity(item.product.id, item.quantity + 1)}>+</button></div><strong>{formatMoney(Number(item.product.salePrice) * item.quantity)}</strong></div>) : <div className="empty"><span className="empty-cart">▤</span><strong>El carrito está vacío</strong><p>Escaneá un código o elegí un producto.</p></div>}</div>
          <div className="cart-footer"><div><span>Total</span><strong>{formatMoney(total)}</strong></div>{confirmSale.isError && <div className="alert">{confirmSale.error.message}</div>}<button className="button primary confirm-button" disabled={!cart.length || confirmSale.isPending} onClick={() => confirmSale.mutate()}>{confirmSale.isPending ? 'Confirmando…' : 'Confirmar venta'}</button></div>
        </aside>
      </section>
    </div>
  )
}
