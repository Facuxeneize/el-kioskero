export function PlaceholderPage({ title, next }: { title: string; next: string }) {
  return <div className="page"><header className="page-header"><div><p className="eyebrow">PRÓXIMO CORTE</p><h1>{title}</h1><p className="muted">{next}</p></div></header><section className="panel empty"><span className="construction">↗</span><strong>Módulo preparado</strong><p>La ruta y la navegación ya están listas para conectar la siguiente entrega.</p></section></div>
}
