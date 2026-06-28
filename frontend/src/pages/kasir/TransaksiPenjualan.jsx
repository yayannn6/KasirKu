import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { printReceipt } from '../../utils/printReceipt'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
const paymentLabel = { cash: 'Tunai', qris: 'QRIS', debit: 'Debit' }

function SuccessModal({ trx, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Transaksi Berhasil!</h2>
        <p className="text-gray-500 text-sm mb-4">{trx.transaction_number}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-left mb-4 space-y-2">
          <div className="flex justify-between text-gray-500">
            <span>Kasir</span><span className="font-medium text-gray-700">{trx.cashier?.name || '-'}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Pembayaran</span>
            <span className="font-medium text-gray-700">{paymentLabel[trx.payment_method] || trx.payment_method}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span><span>{formatRupiah(trx.total)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Bayar</span><span>{formatRupiah(trx.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Kembalian</span><span>{formatRupiah(trx.change_amount)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => printReceipt(trx)}
            className="flex-1 border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1"
          >
            🖨️ Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TransaksiPenjualan() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/products', { params: { search } }).then((res) => {
      setProducts(res.data.data || [])
    })
  }, [search])

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id_products === product.id_products)
      if (existing) {
        if (existing.qty >= product.stock) return prev
        return prev.map((i) =>
          i.id_products === product.id_products ? { ...i, qty: i.qty + 1 } : i
        )
      }
      if (product.stock < 1) return prev
      return [...prev, {
        id_products: product.id_products,
        name: product.name,
        price: product.sell_price,
        qty: 1,
        maxStock: product.stock,
      }]
    })
  }

  const updateQty = (id_products, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id_products === id_products
          ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.maxStock)) }
          : i
      )
    )
  }

  const removeFromCart = (id_products) =>
    setCart((prev) => prev.filter((i) => i.id_products !== id_products))

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const paid = Number(paidAmount) || 0
  const change = paid - total

  const handleReset = () => {
    setCart([])
    setPaidAmount('')
    setPaymentMethod('cash')
    setError('')
  }

  const handleProcess = async () => {
    if (cart.length === 0) return
    if (paymentMethod === 'cash' && paid < total) {
      setError('Jumlah bayar kurang dari total')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/transactions', {
        items: cart.map((i) => ({ id_products: i.id_products, quantity: i.qty, price: i.price })),
        payment_method: paymentMethod,
        paid_amount: paymentMethod === 'cash' ? paid : total,
      })
      setSuccess(res.data.data)
      handleReset()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses transaksi')
    } finally {
      setLoading(false)
    }
  }

  const categoryColors = {
    Makanan: 'bg-orange-100 text-orange-600',
    Minuman: 'bg-cyan-100 text-cyan-600',
    Kebutuhan: 'bg-purple-100 text-purple-600',
    Rokok: 'bg-gray-100 text-gray-600',
    'Bahan Pokok': 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="flex h-screen">
      {/* Product list */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Transaksi Penjualan</h1>
          <p className="text-gray-500 text-sm mt-1">Proses transaksi penjualan barang</p>
        </div>

        <div className="mb-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <div key={p.id_products} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[p.category] || 'bg-gray-100 text-gray-600'}`}>
                    {p.category}
                  </span>
                </div>
                <div className="text-blue-600 font-semibold text-sm mt-1">{formatRupiah(p.sell_price)}</div>
                <div className="text-gray-400 text-xs">Stok: {p.stock}</div>
              </div>
              <button
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center text-lg transition-colors disabled:bg-gray-200 flex-shrink-0"
              >
                +
              </button>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-2 py-12 text-center text-gray-400">Tidak ada produk ditemukan</div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <span className="font-semibold text-gray-800">🛒 Keranjang ({cart.length})</span>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-red-400 hover:text-red-600">🗑️</button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">Keranjang kosong</div>
          )}
          {cart.map((item) => (
            <div key={item.id_products} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{formatRupiah(item.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => item.qty === 1 ? removeFromCart(item.id_products) : updateQty(item.id_products, -1)}
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                >−</button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id_products, 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                >+</button>
              </div>
              <div className="text-sm font-medium text-gray-800 w-16 text-right">
                {formatRupiah(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-800">
            <span>Total</span><span>{formatRupiah(total)}</span>
          </div>

          <div>
            <div className="text-sm text-gray-700 mb-2">Jenis Pembayaran</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: 'Tunai', icon: '💵' },
                { key: 'qris', label: 'QRIS', icon: '⬛' },
                { key: 'debit', label: 'Debit', icon: '💳' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                    paymentMethod === m.key
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <>
              <div>
                <div className="text-sm text-gray-700 mb-1">Bayar</div>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <span className="px-3 text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="flex-1 py-2 text-sm focus:outline-none pr-3"
                    placeholder="0"
                    min={total}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">Kembalian</div>
                <div className={`text-center font-bold py-2.5 rounded-lg text-sm ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {formatRupiah(Math.max(0, change))}
                </div>
                {total > 0 && (
                  <div className="text-xs text-gray-400 mt-1">ℹ️ Bayar minimal {formatRupiah(total)}</div>
                )}
              </div>
            </>
          )}

          {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</div>}

          <button
            onClick={handleProcess}
            disabled={cart.length === 0 || loading || (paymentMethod === 'cash' && paid < total)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl disabled:opacity-40 transition-colors"
          >
            {loading ? 'Memproses...' : 'Proses Transaksi'}
          </button>
          <button
            onClick={handleReset}
            className="w-full border border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {success && <SuccessModal trx={success} onClose={() => setSuccess(null)} />}
    </div>
  )
}
