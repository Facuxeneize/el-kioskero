import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { apiRequest } from '../../api/client'

interface Product {
  id: string
  barcode: string
  name: string
  salePrice: string
  currentStock: number
  minimumStock: number
  isActive: boolean
}

interface ProductResult {
  items: Product[]
  pagination: { total: number }
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const products = useQuery({
    queryKey: ['products', search],
    queryFn: () => apiRequest<ProductResult>(`/products?active=true&search=${encodeURIComponent(search)}`),
  })

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">CATÁLOGO</p><h1>Productos</h1><p className="muted">Precios, códigos y existencias en un solo lugar.</p></div>
        <button className="button primary" type="button">+ Nuevo producto</button>
      </header>
      <section className="panel">
        <div className="toolbar"><input aria-label="Buscar productos" placeholder="Buscar por nombre o código…" value={search} onChange={(event) => setSearch(event.target.value)} /><span>{products.data?.pagination.total ?? 0} productos</span></div>
        {products.isLoading ? <div className="empty">Cargando productos…</div> : products.isError ? <div className="alert">{products.error.message}</div> : products.data?.items.length ? (
          <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Código</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead><tbody>{products.data.items.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td className="mono">{product.barcode}</td><td>${Number(product.salePrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td><td>{product.currentStock}</td><td><span className={product.currentStock === 0 ? 'pill danger' : product.currentStock <= product.minimumStock ? 'pill warning' : 'pill success'}>{product.currentStock === 0 ? 'Sin stock' : product.currentStock <= product.minimumStock ? 'Stock bajo' : 'Disponible'}</span></td></tr>)}</tbody></table></div>
        ) : <div className="empty"><strong>No hay productos para mostrar</strong><p>Creá el primero para comenzar a controlar el stock.</p></div>}
      </section>
    </div>
  )
}
