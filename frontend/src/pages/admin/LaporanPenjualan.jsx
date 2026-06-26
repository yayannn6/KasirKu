import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function LaporanPenjualan() {
  const [period, setPeriod] = useState('harian')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/sales', { params: { period } })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [period])

  const chartData = (data?.chart_data || []).map((r) => ({
    date: formatDate(r.date),
    total: r.total,
    count: r.count,
  }))

  const periodLabels = { harian: 'Periode harian', mingguan: 'Periode mingguan', bulanan: 'Periode bulanan' }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
          <p className="text-gray-500 text-sm mt-1">Analisis penjualan dan pendapatan konter</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          📄 Ekspor PDF
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <span className="text-gray-500">📅 Filter Periode:</span>
        {['harian', 'mingguan', 'bulanan'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Memuat...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Transaksi</div>
              <div className="text-3xl font-bold text-gray-800">{data?.total_transactions}</div>
              <div className="text-xs text-gray-400 mt-1">{periodLabels[period]}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Pendapatan</div>
              <div className="text-3xl font-bold text-gray-800">{formatRupiah(data?.total_revenue || 0)}</div>
              <div className="text-xs text-gray-400 mt-1">{periodLabels[period]}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Grafik Penjualan</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v) => formatRupiah(v)} labelFormatter={(l) => l} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-16 text-center text-gray-400">Tidak ada data untuk periode ini</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
