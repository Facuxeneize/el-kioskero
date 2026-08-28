import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AdminRoute } from './features/auth/AdminRoute'
import { HomeRoute } from './features/auth/HomeRoute'
import { RegisterPage } from './features/auth/RegisterPage'
import { UserRoute } from './features/auth/UserRoute'
import { LoginPage } from './features/auth/LoginPage'
import { ProductsPage } from './features/products/ProductsPage'
import { NewSalePage } from './features/sales/NewSalePage'
import { SaleDetailPage } from './features/sales/SaleDetailPage'
import { SalesHistoryPage } from './features/sales/SalesHistoryPage'
import { StockPage } from './features/stock/StockPage'
import { UsersPage } from './features/users/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="productos" element={<UserRoute><ProductsPage /></UserRoute>} />
          <Route path="stock" element={<UserRoute><StockPage /></UserRoute>} />
          <Route path="ventas/nueva" element={<UserRoute><NewSalePage /></UserRoute>} />
          <Route path="ventas" element={<UserRoute><SalesHistoryPage /></UserRoute>} />
          <Route path="ventas/:id" element={<UserRoute><SaleDetailPage /></UserRoute>} />
          <Route path="usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
