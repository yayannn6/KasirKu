import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import KasirLayout from './layouts/KasirLayout'

import Dashboard from './pages/admin/Dashboard'
import DataBarang from './pages/admin/DataBarang'
import DataPengguna from './pages/admin/DataPengguna'
import LaporanPenjualan from './pages/admin/LaporanPenjualan'
import AdminRiwayat from './pages/admin/RiwayatTransaksi'
import SaldoKas from './pages/admin/SaldoKas'

import TransaksiPenjualan from './pages/kasir/TransaksiPenjualan'
import KasirRiwayat from './pages/kasir/RiwayatTransaksi'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/kasir/transaksi'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/kasir/transaksi'} replace /> : <Login />} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="barang" element={<DataBarang />} />
        <Route path="pengguna" element={<DataPengguna />} />
        <Route path="laporan" element={<LaporanPenjualan />} />
        <Route path="riwayat" element={<AdminRiwayat />} />
        <Route path="kas" element={<SaldoKas />} />
      </Route>

      <Route path="/kasir" element={<ProtectedRoute role="kasir"><KasirLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="transaksi" replace />} />
        <Route path="transaksi" element={<TransaksiPenjualan />} />
        <Route path="riwayat" element={<KasirRiwayat />} />
      </Route>

      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/kasir/transaksi'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
