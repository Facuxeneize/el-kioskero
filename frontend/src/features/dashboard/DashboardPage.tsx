import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { apiRequest } from '../../api/client'
import type { DashboardSummary, Sale, TopProduct } from '../../types/domain'
import { formatDateTime, formatMoney } from '../../utils/format'

export function DashboardPage() {
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => apiRequest<DashboardSummary>('/dashboard/summary') })
  const topProducts = useQuery({ queryKey: ['dashboard', 'top-products'], queryFn: () => apiRequest<TopProduct[]>('/dashboard/top-products') })
  const recentSales = useQuery({ queryKey: ['dashboard', 'recent-sales'], queryFn: () => apiRequest<Sale[]>('/dashboard/recent-sales') })

  const metrics = [
    { label: 'Ventas de hoy', value: summary.data ? formatMoney(summary.data.revenueToday) : '—', hint: 'Facturación completada' },
    { label: 'Cantidad de ventas', value: summary.data?.salesToday ?? '—', hint: 'Operaciones completadas' },
    { label: 'Unidades vendidas', value: summary.data?.unitsToday ?? '—', hint: 'Productos despachados' },
    { label: 'Stock bajo', value: summary.data?.lowStock ?? '—', hint: 'En el mínimo configurado' },
    { label: 'Sin stock', value: summary.data?.outOfStock ?? '—', hint: 'Productos agotados' },
  ]

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">RESUMEN</p><h1>Buen día.</h1><p className="muted">Esto es lo que está pasando hoy en tu kiosco.</p></div><Link className="button primary" to="/ventas/nueva">+ Nueva venta</Link></header>
      {summary.isError && <div className="alert">{summary.error.message}</div>}
      <section className="metric-grid five">{metrics.map((metric) => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.hint}</small></article>)}</section>
      <section className="dashboard-grid">
        <article className="panel"><div className="panel-heading"><h2>Últimas ventas</h2><Link to="/ventas">Ver historial</Link></div>{recentSales.data?.length ? <div className="recent-sales">{recentSales.data.map((sale) => <Link to={`/ventas/${sale.id}`} key={sale.id}><span className="sale-number">#{sale.saleNumber}</span><div><strong>{formatMoney(sale.total)}</strong><small>{formatDateTime(sale.createdAt)} · {sale.totalUnits} unidades</small></div><span className={sale.status === 'COMPLETED' ? 'pill success' : 'pill neutral'}>{sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}</span></Link>)}</div> : <div className="empty"><strong>Todavía no hay ventas</strong><p>Cuando confirmes la primera, aparecerá acá.</p></div>}</article>
        <article className="panel"><div className="panel-heading"><h2>Productos más vendidos</h2></div>{topProducts.data?.length ? <ol className="top-products">{topProducts.data.map((product, index) => <li key={product.productId}><span>{index + 1}</span><strong>{product.productName}</strong><b>{product.quantity} u.</b></li>)}</ol> : <div className="empty"><strong>Sin datos todavía</strong><p>El ranking se arma con ventas completadas.</p></div>}</article>
      </section>
    </div>
  )
}
