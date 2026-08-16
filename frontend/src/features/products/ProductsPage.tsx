import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { ApiError, apiRequest } from '../../api/client'
import { Modal } from '../../components/common/Modal'
import type { Paginated, Product } from '../../types/domain'
import { formatDateTime, formatMoney } from '../../utils/format'

interface ProductForm {
  barcode: string
  name: string
  description: string
  salePrice: string
  minimumStock: string
}

const emptyForm: ProductForm = { barcode: '', name: '', description: '', salePrice: '', minimumStock: '0' }

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('true')
  const [editing, setEditing] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [message, setMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')

  const products = useQuery({
    queryKey: ['products', search, status],
    queryFn: () => apiRequest<Paginated<Product>>(`/products?search=${encodeURIComponent(search)}${status ? `&active=${status}` : ''}`),
  })

  const saveProduct = useMutation({
    mutationFn: () => apiRequest<Product>(editing ? `/products/${editing.id}` : '/products', {
      method: editing ? 'PATCH' : 'POST',
      body: JSON.stringify({ ...form, minimumStock: Number(form.minimumStock) }),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      closeForm()
      setMessage(editing ? 'Producto actualizado.' : 'Producto creado. Ahora podés ingresar su stock.')
    },
  })

  const deactivate = useMutation({
    mutationFn: (id: string) => apiRequest<Product>(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      setMessage('Producto desactivado sin eliminar su historial.')
    },
  })

  const scanProduct = useMutation({
    mutationFn: (barcode: string) => apiRequest<Product>(`/products/barcode/${encodeURIComponent(barcode)}`),
    onSuccess: (product) => {
      setIsScanning(false)
      openEdit(product)
      setMessage(`Código encontrado: ${product.name}.`)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND') {
        const barcode = scannedBarcode.trim()
        setIsScanning(false)
        setEditing(null)
        setForm({ ...emptyForm, barcode })
        setIsCreating(true)
        setMessage('El código no está registrado. Completá los datos para crear el producto.')
      }
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setIsCreating(true)
    setMessage('')
  }

  function openScanner() {
    setScannedBarcode('')
    setMessage('')
    scanProduct.reset()
    setIsScanning(true)
  }

  function closeScanner() {
    setIsScanning(false)
    setScannedBarcode('')
    scanProduct.reset()
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      barcode: product.barcode, name: product.name, description: product.description ?? '',
      salePrice: product.salePrice, minimumStock: String(product.minimumStock),
    })
    setIsCreating(false)
    setMessage('')
  }

  function closeForm() {
    setEditing(null)
    setIsCreating(false)
    setForm(emptyForm)
    saveProduct.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    saveProduct.mutate()
  }

  function scan(event: FormEvent) {
    event.preventDefault()
    const barcode = scannedBarcode.trim()
    if (barcode) scanProduct.mutate(barcode)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">CATÁLOGO</p><h1>Productos</h1><p className="muted">Precios, códigos y existencias en un solo lugar.</p></div>
        <div className="header-actions"><button className="button secondary" type="button" onClick={openScanner}>▥ Escanear código de barras</button><button className="button primary" type="button" onClick={openCreate}>+ Nuevo producto</button></div>
      </header>
      {message && <div className="notice success-notice">{message}</div>}
      <section className="panel">
        <div className="toolbar">
          <input aria-label="Buscar productos" placeholder="Buscar por nombre o código…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar estado" value={status} onChange={(event) => setStatus(event.target.value)}><option value="true">Activos</option><option value="false">Inactivos</option><option value="">Todos</option></select>
          <span>{products.data?.pagination.total ?? 0} productos</span>
        </div>
        {products.isLoading ? <div className="empty">Cargando productos…</div> : products.isError ? <div className="alert panel-alert">{products.error.message}</div> : products.data?.items.length ? (
          <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Código</th><th>Precio</th><th>Stock</th><th>Último ingreso</th><th>Estado</th><th></th></tr></thead><tbody>{products.data.items.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small className="cell-note">{product.description}</small></td><td className="mono">{product.barcode}</td><td>{formatMoney(product.salePrice)}</td><td>{product.currentStock}</td><td>{formatDateTime(product.lastStockInAt)}</td><td><span className={!product.isActive ? 'pill neutral' : product.currentStock === 0 ? 'pill danger' : product.currentStock <= product.minimumStock ? 'pill warning' : 'pill success'}>{!product.isActive ? 'Inactivo' : product.currentStock === 0 ? 'Sin stock' : product.currentStock <= product.minimumStock ? 'Stock bajo' : 'Disponible'}</span></td><td className="row-actions"><button onClick={() => openEdit(product)}>Editar</button>{product.isActive && <button className="danger-link" onClick={() => window.confirm(`¿Desactivar ${product.name}?`) && deactivate.mutate(product.id)}>Desactivar</button>}</td></tr>)}</tbody></table></div>
        ) : <div className="empty"><strong>No hay productos para mostrar</strong><p>Creá el primero para comenzar a controlar el stock.</p></div>}
      </section>

      {isScanning && <Modal title="Escanear código de barras" onClose={closeScanner}>
        <form className="scan-form" onSubmit={scan}>
          <div className="scan-symbol" aria-hidden="true">▥</div>
          <div><strong>Escaneá el producto</strong><p>El lector escribirá el código automáticamente. También podés ingresarlo a mano.</p></div>
          <label>Código de barras<input autoFocus required maxLength={64} value={scannedBarcode} onChange={(event) => { setScannedBarcode(event.target.value); scanProduct.reset() }} placeholder="Esperando código…" /></label>
          {scanProduct.isError && !(scanProduct.error instanceof ApiError && scanProduct.error.code === 'PRODUCT_NOT_FOUND') && <div className="alert">{scanProduct.error.message}</div>}
          <div className="form-actions"><button className="button secondary" type="button" onClick={closeScanner}>Cancelar</button><button className="button primary" disabled={!scannedBarcode.trim() || scanProduct.isPending} type="submit">{scanProduct.isPending ? 'Buscando…' : 'Buscar código'}</button></div>
        </form>
      </Modal>}

      {(isCreating || editing) && <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={closeForm}>
        <form className="form-grid" onSubmit={submit}>
          <label className="full">Nombre<input autoFocus required maxLength={160} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Código de barras<input required maxLength={64} value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} /></label>
          <label>Precio de venta<input required min="0" step="0.01" type="number" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} /></label>
          <label>Stock mínimo<input required min="0" step="1" type="number" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} /></label>
          <label className="full">Descripción<textarea maxLength={500} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {saveProduct.isError && <div className="alert full">{saveProduct.error.message}</div>}
          <div className="form-actions full"><button className="button secondary" type="button" onClick={closeForm}>Cancelar</button><button className="button primary" disabled={saveProduct.isPending} type="submit">{saveProduct.isPending ? 'Guardando…' : 'Guardar producto'}</button></div>
        </form>
      </Modal>}
    </div>
  )
}
