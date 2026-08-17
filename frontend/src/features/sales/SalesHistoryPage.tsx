import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { apiRequest } from '../../api/client'
import type { Paginated, Sale } from '../../types/domain'
import { formatDateTime, formatMoney } from '../../utils/format'

export function SalesHistoryPage() {
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const sales = useQuery({
    queryKey: ['sales', status, dateFrom, dateTo],
    queryFn: () => apiRequest<Paginated<Sale>>(`/sales?${params}`),
  })

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">REGISTRO</p><h1>Historial de ventas</h1><p className="muted">Consultá cada operación y su detalle histórico.</p></div><Link className="button primary" to="/ventas/nueva">+ Nueva venta</Link></header>
      <section className="panel">
        <div className="filters"><label>Desde<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>Hasta<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="COMPLETED">Completadas</option><option value="VOIDED">Anuladas</option></select></label><span>{sales.data?.pagination.total ?? 0} ventas</span></div>
        {sales.isLoading ? <div className="empty">Cargando ventas…</div> : sales.isError ? <div className="alert panel-alert">{sales.error.message}</div> : sales.data?.items.length ? <div className="table-wrap"><table className="mobile-card-table"><thead><tr><th>Número</th><th>Fecha y hora</th><th>Productos</th><th>Unidades</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>{sales.data.items.map((sale) => <tr key={sale.id}><td data-label="Número"><strong>#{sale.saleNumber}</strong></td><td data-label="Fecha y hora">{formatDateTime(sale.createdAt)}</td><td data-label="Productos">{sale.items.length}</td><td data-label="Unidades">{sale.totalUnits}</td><td data-label="Total"><strong>{formatMoney(sale.total)}</strong></td><td data-label="Estado"><span className={sale.status === 'COMPLETED' ? 'pill success' : 'pill neutral'}>{sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}</span></td><td data-label="Detalle"><Link className="table-link" to={`/ventas/${sale.id}`}>Ver detalle →</Link></td></tr>)}</tbody></table></div> : <div className="empty"><strong>No hay ventas para estos filtros</strong><p>Las operaciones confirmadas aparecerán acá.</p></div>}
      </section>
    </div>
  )
}
