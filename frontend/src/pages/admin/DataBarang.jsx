import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Pagination from '../../components/Pagination'

const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
const LOW_STOCK = 10

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function DataBarang() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', buy_price: '', sell_price: '', stock: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pagination state — aktif & arsip terpisah
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const [archivedPage, setArchivedPage] = useState(1)
  const [archivedTotalPages, setArchivedTotalPages] = useState(1)
  const [archivedProducts, setArchivedProducts] = useState([])
  const [archivedTotal, setArchivedTotal] = useState(0)

  const fetchProducts = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/products', {
        params: { search, page: p, limit },
      })
      setProducts(res.data.data || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.total_pages || 1)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchived = async (p = archivedPage) => {
    if (!showArchived) return
    const res = await api.get('/products', {
      params: { search, page: p, limit, include_deleted: 'true' },
    })
    // Filter hanya yang deleted
    const all = res.data.data || []
    const archived = all.filter(pr => pr.deleted_at)
    setArchivedProducts(archived)
    setArchivedTotal(res.data.total || 0)
    setArchivedTotalPages(res.data.total_pages || 1)
  }

  useEffect(() => {
    setPage(1)
    fetchProducts(1)
  }, [search, showArchived])

  useEffect(() => {
    fetchProducts(page)
  }, [page])

  useEffect(() => {
    if (showArchived) {
      setArchivedPage(1)
      fetchArchived(1)
    }
  }, [showArchived, search])

  useEffect(() => {
    fetchArchived(archivedPage)
  }, [archivedPage])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const openAdd = () => {
    setEditItem(null)
    setForm({ code: '', name: '', buy_price: '', sell_price: '', stock: '', category: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      code: item.code,
      name: item.name,
      buy_price: item.buy_price,
      sell_price: item.sell_price,
      stock: item.stock,
      category: item.category,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        code: form.code || undefined,
        name: form.name,
        buy_price: Number(form.buy_price),
        sell_price: Number(form.sell_price),
        stock: Number(form.stock),
        category: form.category,
      }
      if (editItem) {
        await api.put(`/products/${editItem.id_products}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setShowModal(false)
      fetchProducts(1)
      setPage(1)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id_products) => {
    if (!confirm('Yakin hapus barang ini? Jika pernah dipakai dalam transaksi, barang akan diarsipkan.')) return
    try {
      const res = await api.delete(`/products/${id_products}`)
      if (res.data.archived) alert('Barang diarsipkan karena pernah digunakan dalam transaksi.')
      fetchProducts(page)
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const handleRestore = async (id_products) => {
    try {
      await api.put(`/products/${id_products}/restore`)
      fetchProducts(page)
      fetchArchived(archivedPage)
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memulihkan')
    }
  }

  const activeProducts = products.filter(p => !p.deleted_at)

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Barang</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola data barang di konter Anda</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              showArchived
                ? 'bg-orange-50 border-orange-300 text-orange-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            📦 {showArchived ? 'Sembunyikan Arsip' : 'Lihat Arsip'}
          </button>
          <button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            + Tambah Barang
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari nama atau kode barang..."
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Tabel Aktif */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <span className="font-semibold text-gray-700 text-sm">
            Daftar Barang Aktif
            <span className="ml-2 text-gray-400 font-normal">({total} barang)</span>
          </span>
          <span className="text-xs text-gray-400">Hal. {page} / {totalPages}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Nama Barang</th>
                  <th className="px-4 py-3 font-medium">Harga Beli</th>
                  <th className="px-4 py-3 font-medium">Harga Jual</th>
                  <th className="px-4 py-3 font-medium">Stok</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeProducts.map((p, i) => (
                  <tr key={p.id_products} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-orange-500">{formatRupiah(p.buy_price)}</td>
                    <td className="px-4 py-3 text-orange-500">{formatRupiah(p.sell_price)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? 'text-red-500 font-medium' : p.stock <= LOW_STOCK ? 'text-orange-500 font-medium' : 'text-gray-700'}>
                        {p.stock}{p.stock === 0 ? ' 🚫' : p.stock <= LOW_STOCK ? ' ⚠️' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(p.id_products)} className="text-red-500 hover:text-red-700 p-1" title="Hapus/Arsipkan">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeProducts.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Tabel Arsip */}
      {showArchived && (
        <div className="bg-orange-50 rounded-xl border border-orange-200">
          <div className="p-4 border-b border-orange-200 flex items-center gap-2">
            <span>📦</span>
            <span className="font-semibold text-orange-700 text-sm">Barang Diarsipkan ({archivedTotal})</span>
            <span className="text-xs text-orange-500 ml-1">— pernah dipakai dalam transaksi</span>
          </div>
          {archivedProducts.length === 0 ? (
            <div className="p-8 text-center text-orange-400 text-sm">Tidak ada barang diarsipkan</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-orange-400 border-b border-orange-200">
                    <th className="px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Kode</th>
                    <th className="px-4 py-3 font-medium">Nama Barang</th>
                    <th className="px-4 py-3 font-medium">Harga Jual</th>
                    <th className="px-4 py-3 font-medium">Stok</th>
                    <th className="px-4 py-3 font-medium">Kategori</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedProducts.map((p, i) => (
                    <tr key={p.id_products} className="border-b border-orange-100 opacity-70">
                      <td className="px-4 py-3 text-gray-500">{(archivedPage - 1) * limit + i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-600 line-through">{p.name}</td>
                      <td className="px-4 py-3 text-gray-400">{formatRupiah(p.sell_price)}</td>
                      <td className="px-4 py-3 text-gray-400">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{p.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRestore(p.id_products)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 border border-green-200"
                        >
                          ♻️ Pulihkan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={archivedPage} totalPages={archivedTotalPages} onPageChange={setArchivedPage} />
            </>
          )}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <Modal
          title={editItem ? 'Edit Barang' : 'Tambah Barang Baru'}
          subtitle={editItem ? 'Ubah data barang' : 'Masukkan data barang yang akan ditambahkan'}
          onClose={() => setShowModal(false)}
        >
          {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Kode Produk */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Produk
                <span className="ml-2 text-xs text-gray-400 font-normal">(kosongkan untuk auto-generate)</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                placeholder={editItem ? editItem.code : 'Contoh: BRG-001'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan nama barang"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                <input
                  type="number"
                  value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0" min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                <input
                  type="number"
                  value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0" min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0" min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Masukkan kategori"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
