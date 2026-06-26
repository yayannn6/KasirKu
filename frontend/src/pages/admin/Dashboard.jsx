import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-500">Memuat...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di panel admin sistem kasirKu</p>
      </div>

      {/* Stats — 5 kartu */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Transaksi</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data?.total_transactions?.toLocaleString('id-ID')}</div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🛍️</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Pendapatan</div>
            <div className="text-lg font-bold text-gray-800 mt-1">{formatRupiah(data?.total_revenue || 0)}</div>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">💵</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Jumlah Barang</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data?.total_products}</div>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">📦</div>
        </div>
        <div
          className="bg-white rounded-xl border border-orange-200 p-5 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={() => navigate('/admin/barang')}
          title="Klik untuk lihat data barang"
        >
          <div>
            <div className="text-sm text-gray-500">Stok Menipis</div>
            <div className="text-2xl font-bold text-orange-500 mt-1">{data?.low_stock_count ?? 0}</div>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">⚠️</div>
        </div>
        <div
          className="bg-white rounded-xl border border-red-200 p-5 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors"
          onClick={() => navigate('/admin/barang')}
          title="Klik untuk restock"
        >
          <div>
            <div className="text-sm text-gray-500">Stok Habis</div>
            <div className="text-2xl font-bold text-red-500 mt-1">{data?.out_of_stock_count ?? 0}</div>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">🚫</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stok Habis — prioritas tinggi */}
        {(data?.out_of_stock_items?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-red-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-2">
                <span className="text-red-500">🚫</span>
                <h2 className="font-semibold text-gray-800">Stok Habis — Perlu Restock</h2>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {data.out_of_stock_items.length} barang
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/barang')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Restock →
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Nama Barang</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Harga Jual</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.out_of_stock_items.map((item) => (
                  <tr key={item.id_products} className="border-b last:border-0 hover:bg-red-50/30">
                    <td className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-3 text-gray-500">{item.category}</td>
                    <td className="px-6 py-3 text-gray-500">{formatRupiah(item.sell_price)}</td>
                    <td className="px-6 py-3">
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                        🚫 Stok Habis
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stok Menipis */}
        {(data?.low_stock_items?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">⚠️</span>
                <h2 className="font-semibold text-gray-800">Stok Menipis</h2>
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {data.low_stock_items.length} barang
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/barang')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat semua →
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Nama Barang</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Stok Tersisa</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_items.map((item) => (
                  <tr key={item.id_products} className="border-b last:border-0 hover:bg-orange-50/30">
                    <td className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-3 text-gray-500">{item.category}</td>
                    <td className="px-6 py-3">
                      <span className={`font-bold ${item.stock <= 5 ? 'text-red-500' : 'text-orange-500'}`}>
                        {item.stock} unit
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {item.stock <= 5 ? '⚠️ Kritis' : '⚠️ Menipis'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Semua aman */}
        {(data?.low_stock_items?.length ?? 0) === 0 && (data?.out_of_stock_items?.length ?? 0) === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-medium text-green-700">Semua stok barang dalam kondisi aman</div>
            <div className="text-sm text-green-600 mt-1">Tidak ada barang yang menipis atau habis</div>
          </div>
        )}
      </div>
    </div>
  )
}
