import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'

import { apiRequest } from '../../api/client'
import type { Paginated, Product, StockMovement } from '../../types/domain'
import { formatDateTime } from '../../utils/format'

const movementLabels = { IN: 'Ingreso', SALE: 'Venta', ADJUSTMENT: 'Ajuste', SALE_VOID: 'Anulación' } as const

export function StockPage() {
  const queryClient = useQueryClient()
  const [productId, setProductId] = useState('')
  const [mode, setMode] = useState<'in' | 'adjustment'>('in')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')

  const products = useQuery({
    queryKey: ['products', 'stock-selector'],
    queryFn: () => apiRequest<Paginated<Product>>('/products?active=true'),
  })
  const movements = useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => apiRequest<Paginated<StockMovement>>(`/stock/movements${productId ? `?productId=${productId}` : ''}`),
  })
  const selectedProduct = useMemo(() => products.data?.items.find((product) => product.id === productId), [productId, products.data])

  const updateStock = useMutation({
    mutationFn: () => apiRequest(`/products/${productId}/stock/${mode}`, {
      method: 'POST',
      body: JSON.stringify(mode === 'in' ? { quantity: Number(quantity), notes } : { actualStock: Number(quantity), notes }),
    }),
    onSuccess: async () => {
      setMessage(mode === 'in' ? 'Ingreso registrado correctamente.' : 'Stock ajustado correctamente.')
      setQuantity('')
      setNotes('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    updateStock.mutate()
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">INVENTARIO</p><h1>Stock</h1><p className="muted">Cada cambio queda registrado y puede auditarse.</p></div></header>
      {message && <div className="notice success-notice">{message}</div>}
      <section className="stock-grid">
        <article className="panel stock-operation">
          <div className="panel-heading"><h2>Registrar movimiento</h2></div>
          <form className="stack-form" onSubmit={submit}>
            <label>Producto<select required value={productId} onChange={(event) => { setProductId(event.target.value); setMessage('') }}><option value="">Seleccionar producto…</option>{products.data?.items.map((product) => <option value={product.id} key={product.id}>{product.name} · stock {product.currentStock}</option>)}</select></label>
            {selectedProduct && <div className="stock-preview"><span>Stock actual</span><strong>{selectedProduct.currentStock}</strong><small>Mínimo configurado: {selectedProduct.minimumStock}</small></div>}
            <div className="segmented"><button className={mode === 'in' ? 'active' : ''} type="button" onClick={() => { setMode('in'); setQuantity('') }}>Ingreso</button><button className={mode === 'adjustment' ? 'active' : ''} type="button" onClick={() => { setMode('adjustment'); setQuantity('') }}>Ajuste</button></div>
            <label>{mode === 'in' ? 'Cantidad ingresada' : 'Conteo físico real'}<input required min={mode === 'in' ? 1 : 0} step="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            {selectedProduct && quantity !== '' && <div className="calculation"><span>{mode === 'in' ? 'Nuevo stock' : 'Diferencia'}</span><strong>{mode === 'in' ? selectedProduct.currentStock + Number(quantity) : Number(quantity) - selectedProduct.currentStock}</strong></div>}
            <label>Observación {mode === 'adjustment' && <em>obligatoria</em>}<textarea required={mode === 'adjustment'} maxLength={500} rows={3} placeholder={mode === 'in' ? 'Ej. Reposición semanal' : 'Ej. Botellas dañadas'} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            {updateStock.isError && <div className="alert">{updateStock.error.message}</div>}
            <button className="button primary" disabled={!productId || updateStock.isPending} type="submit">{updateStock.isPending ? 'Registrando…' : 'Confirmar movimiento'}</button>
          </form>
        </article>
        <article className="panel movements-panel">
          <div className="panel-heading"><div><h2>Historial de movimientos</h2><small>{productId ? selectedProduct?.name : 'Todos los productos'}</small></div></div>
          {movements.isLoading ? <div className="empty">Cargando movimientos…</div> : movements.isError ? <div className="alert panel-alert">{movements.error.message}</div> : movements.data?.items.length ? <div className="movement-list">{movements.data.items.map((movement) => <div className="movement" key={movement.id}><span className={`movement-icon ${movement.quantityDelta > 0 ? 'positive' : 'negative'}`}>{movement.quantityDelta > 0 ? '+' : '−'}</span><div><strong>{movement.product.name}</strong><small>{movementLabels[movement.movementType]} · {movement.notes || 'Sin observación'}</small></div><div className="movement-values"><strong className={movement.quantityDelta > 0 ? 'positive-text' : 'negative-text'}>{movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta}</strong><small>{movement.stockBefore} → {movement.stockAfter}</small><time>{formatDateTime(movement.createdAt)}</time></div></div>)}</div> : <div className="empty"><strong>Sin movimientos</strong><p>Los ingresos, ventas y ajustes aparecerán acá.</p></div>}
        </article>
      </section>
    </div>
  )
}
