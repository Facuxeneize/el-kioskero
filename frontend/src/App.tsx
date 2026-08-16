import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LoginPage } from './features/auth/LoginPage'
import { ProductsPage } from './features/products/ProductsPage'
import { NewSalePage } from './features/sales/NewSalePage'
import { SaleDetailPage } from './features/sales/SaleDetailPage'
import { SalesHistoryPage } from './features/sales/SalesHistoryPage'
import { StockPage } from './features/stock/StockPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="ventas/nueva" element={<NewSalePage />} />
          <Route path="ventas" element={<SalesHistoryPage />} />
          <Route path="ventas/:id" element={<SaleDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
