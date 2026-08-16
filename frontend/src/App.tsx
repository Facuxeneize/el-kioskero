import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LoginPage } from './features/auth/LoginPage'
import { ProductsPage } from './features/products/ProductsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="stock" element={<PlaceholderPage title="Stock" next="Ingresos, ajustes e historial" />} />
          <Route path="ventas/nueva" element={<PlaceholderPage title="Nueva venta" next="Carrito optimizado para escáner" />} />
          <Route path="ventas" element={<PlaceholderPage title="Historial" next="Listado, detalle y anulaciones" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
