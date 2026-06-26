import { useEffect, useState } from 'react'
import api from '../../api/axios'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
const formatDate = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const paymentColor = {
  cash: 'bg-green-100 text-green-700',
  qris: 'bg-purple-100 text-purple-700',
  debit: 'bg-blue-100 text-blue-700',
}
const paymentLabel = { cash: 'Tunai', qris: 'QRIS', debit: 'Debit' }
const paymentIcon = { cash: '💵', qris: '⬛', debit: '💳' }

export default function SaldoKas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/cash-balance')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Saldo Kas</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan uang tunai dari transaksi penjualan</p>
        </div>
        <button
          onClick={fetchData}
          className="text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Memuat...</div>
      ) : (
        <>
          {/* Kartu ringkasan kas tunai */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💵</div>
                <div className="text-sm text-gray-500">Kas Hari Ini</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatRupiah(data?.today_cash || 0)}</div>
              <div className="text-xs text-gray-400 mt-1">{data?.today_count || 0} transaksi tunai</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📅</div>
                <div className="text-sm text-gray-500">Kas Bulan Ini</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatRupiah(data?.month_cash || 0)}</div>
              <div className="text-xs text-gray-400 mt-1">Akumulasi tunai bulan berjalan</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🏦</div>
                <div className="text-sm text-gray-500">Kas Keseluruhan</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatRupiah(data?.all_time_cash || 0)}</div>
              <div className="text-xs text-gray-400 mt-1">Total kas sejak awal</div>
            </div>
          </div>

          {/* Ringkasan metode pembayaran hari ini */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Pembayaran Hari Ini</h2>
            {(data?.payment_summary || []).length === 0 ? (
              <div className="text-gray-400 text-sm py-4 text-center">Belum ada transaksi hari ini</div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(data?.payment_summary || []).map((p) => (
                  <div key={p.method} className={`rounded-xl p-4 ${paymentColor[p.method] || 'bg-gray-100 text-gray-700'}`}>
                    <div className="text-2xl mb-1">{paymentIcon[p.method] || '💰'}</div>
                    <div className="font-semibold text-sm">{paymentLabel[p.method] || p.method}</div>
                    <div className="font-bold text-base mt-1">{formatRupiah(p.total)}</div>
                    <div className="text-xs opacity-70 mt-0.5">{p.count} transaksi</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rincian harian 30 hari terakhir */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-700 text-sm">Rincian Kas Tunai — 30 Hari Terakhir</span>
              <span className="text-xs text-gray-400">{(data?.daily_data || []).length} hari</span>
            </div>
            {(data?.daily_data || []).length === 0 ? (
              <div className="py-12 text-center text-gray-400">Belum ada data kas tunai</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Jml Transaksi</th>
                    <th className="px-4 py-3 font-medium text-right">Total Tunai</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.daily_data || []).map((row, i) => (
                    <tr key={row.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{formatDate(row.date)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {row.count} transaksi
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={2} className="px-4 py-3 font-bold text-gray-700 text-sm">Total 30 Hari</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {(data?.daily_data || []).reduce((sum, r) => sum + r.count, 0)} transaksi
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {formatRupiah((data?.daily_data || []).reduce((sum, r) => sum + r.total, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
