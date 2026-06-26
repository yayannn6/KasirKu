import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { printReceipt } from '../../utils/printReceipt'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
const formatDate = (s) => new Date(s).toLocaleString('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const paymentLabel = { cash: 'Tunai', qris: 'QRIS', debit: 'Debit' }

function DetailModal({ trx, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-gray-800">Detail Transaksi</h2>
            <p className="text-sm text-gray-500">{trx.transaction_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6">
          {/* Info transaksi */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Nomor Transaksi</div>
              <div className="font-semibold text-gray-800">{trx.transaction_number}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Tanggal</div>
              <div className="font-semibold text-gray-800">{formatDate(trx.created_at)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Kasir</div>
              <div className="font-semibold text-gray-800">{trx.cashier?.name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Tipe Pembayaran</div>
              <div className="font-semibold text-gray-800">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                  trx.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                  trx.payment_method === 'qris' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {paymentLabel[trx.payment_method] || trx.payment_method}
                </span>
              </div>
            </div>
          </div>

          {/* Tabel item */}
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Daftar Barang</h3>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b text-gray-500 text-xs">
                <th className="text-left py-2">Barang</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Harga</th>
                <th className="text-right py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(trx.items || []).map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{formatRupiah(item.price)}</td>
                  <td className="py-2 text-right">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ringkasan bayar */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between font-bold text-gray-800">
              <span>Total</span><span>{formatRupiah(trx.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Bayar ({paymentLabel[trx.payment_method] || trx.payment_method})</span>
              <span>{formatRupiah(trx.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium border-t border-gray-200 pt-1.5">
              <span>Kembalian</span><span>{formatRupiah(trx.change_amount)}</span>
            </div>
          </div>

          {/* Tombol print */}
          <button
            onClick={() => printReceipt(trx)}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            🖨️ Cetak Struk
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminRiwayatTransaksi() {
  const [transactions, setTransactions] = useState([])
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailData, setDetailData] = useState(null)

  const fetchTrx = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transactions', { params: { date } })
      setTransactions(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrx() }, [date])

  const openDetail = async (id_transactions) => {
    const res = await api.get(`/transactions/${id_transactions}`)
    setDetailData(res.data.data)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
        <p className="text-gray-500 text-sm mt-1">Lihat riwayat transaksi penjualan</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <span className="text-gray-400">📅</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 text-sm text-gray-600 focus:outline-none"
        />
        {date && (
          <button onClick={() => setDate('')} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded-lg">
            Reset Filter
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <span className="font-semibold text-gray-700 text-sm">Daftar Transaksi ({transactions.length})</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Nomor Transaksi</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Kasir</th>
                <th className="px-4 py-3 font-medium">Pembayaran</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={t.id_transactions} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{t.transaction_number}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{t.cashier?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      t.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                      t.payment_method === 'qris' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {paymentLabel[t.payment_method] || t.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatRupiah(t.total)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(t.id_transactions)}
                      className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      👁️ Detail
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {detailData && <DetailModal trx={detailData} onClose={() => setDetailData(null)} />}
    </div>
  )
}
