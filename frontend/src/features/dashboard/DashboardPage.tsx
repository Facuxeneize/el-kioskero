import { Link } from 'react-router-dom'

const metrics = [
  { label: 'Ventas de hoy', value: '—', hint: 'Facturación registrada' },
  { label: 'Cantidad de ventas', value: '—', hint: 'Operaciones completadas' },
  { label: 'Unidades vendidas', value: '—', hint: 'Productos despachados' },
  { label: 'Alertas de stock', value: '—', hint: 'Bajo mínimo o agotado' },
]

export function DashboardPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">RESUMEN</p><h1>Buen día.</h1><p className="muted">Esto es lo que está pasando en tu kiosco.</p></div>
        <Link className="button primary" to="/ventas/nueva">+ Nueva venta</Link>
      </header>
      <section className="metric-grid">
        {metrics.map((metric) => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.hint}</small></article>)}
      </section>
      <section className="dashboard-grid">
        <article className="panel"><div className="panel-heading"><h2>Últimas ventas</h2><Link to="/ventas">Ver historial</Link></div><div className="empty"><strong>Todavía no hay ventas</strong><p>Cuando confirmes la primera, aparecerá acá.</p></div></article>
        <article className="panel"><div className="panel-heading"><h2>Acciones rápidas</h2></div><div className="quick-actions"><Link to="/productos">Crear producto <span>→</span></Link><Link to="/stock">Ingresar mercadería <span>→</span></Link><Link to="/ventas/nueva">Escanear una venta <span>→</span></Link></div></article>
      </section>
    </div>
  )
}
