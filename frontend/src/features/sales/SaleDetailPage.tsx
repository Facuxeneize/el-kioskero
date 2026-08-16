import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'

import { apiRequest } from '../../api/client'
import type { Sale } from '../../types/domain'
import { formatDateTime, formatMoney } from '../../utils/format'

export function SaleDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const sale = useQuery({ queryKey: ['sales', id], queryFn: () => apiRequest<Sale>(`/sales/${id}`), enabled: Boolean(id) })
  const voidSale = useMutation({
    mutationFn: () => apiRequest<Sale>(`/sales/${id}/void`, { method: 'POST' }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(['sales', id], updated)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  if (sale.isLoading) return <div className="page"><div className="empty">Cargando venta…</div></div>
  if (sale.isError || !sale.data) return <div className="page"><div className="alert">{sale.error?.message ?? 'Venta no encontrada.'}</div></div>
  const data = sale.data

  return (
    <div className="page detail-page">
      <Link className="back-link" to="/ventas">← Volver al historial</Link>
      {(location.state as { justCreated?: boolean } | null)?.justCreated && <div className="notice success-notice">Venta confirmada y stock actualizado.</div>}
      {voidSale.isSuccess && <div className="notice success-notice">Venta anulada. Las unidades fueron devueltas al stock.</div>}
      <header className="page-header sale-detail-header"><div><p className="eyebrow">COMPROBANTE INTERNO</p><h1>Venta #{data.saleNumber}</h1><p className="muted">{formatDateTime(data.createdAt)}</p></div><div className="detail-actions"><span className={data.status === 'COMPLETED' ? 'pill success large' : 'pill neutral large'}>{data.status === 'COMPLETED' ? 'Completada' : 'Anulada'}</span>{data.status === 'COMPLETED' && <button className="button danger-button" disabled={voidSale.isPending} onClick={() => window.confirm('¿Anular esta venta y devolver todas las unidades al stock?') && voidSale.mutate()}>{voidSale.isPending ? 'Anulando…' : 'Anular venta'}</button>}</div></header>
      {voidSale.isError && <div className="alert">{voidSale.error.message}</div>}
      <section className="panel receipt">
        <div className="receipt-summary"><div><span>Productos</span><strong>{data.items.length}</strong></div><div><span>Unidades</span><strong>{data.totalUnits}</strong></div><div><span>Total</span><strong>{formatMoney(data.total)}</strong></div></div>
        <div className="table-wrap"><table><thead><tr><th>Producto al vender</th><th>Código</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td><strong>{item.productName}</strong></td><td className="mono">{item.barcode}</td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice)}</td><td><strong>{formatMoney(item.subtotal)}</strong></td></tr>)}</tbody></table></div>
        {data.voidedAt && <div className="void-note">Anulada el {formatDateTime(data.voidedAt)}. Esta operación ya no participa del dashboard.</div>}
      </section>
    </div>
  )
}
