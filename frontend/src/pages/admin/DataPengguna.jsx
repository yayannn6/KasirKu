import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

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

const roleLabel = { admin: 'Admin', kasir: 'Kasir' }
const roleColor = {
  admin: 'bg-purple-100 text-purple-600',
  kasir: 'bg-blue-100 text-blue-600',
}

export default function DataPengguna() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showReset, setShowReset] = useState(null)
  const [showRole, setShowRole] = useState(null)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'kasir' })
  const [resetPassword, setResetPassword] = useState('')
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { search } })
      setUsers(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [search])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/users', form)
      setShowAdd(false)
      setForm({ name: '', username: '', password: '', role: 'kasir' })
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menambah pengguna')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id_users) => {
    await api.put(`/users/${id_users}/toggle-status`)
    fetchUsers()
  }

  const handleChangeRole = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/users/${showRole.id_users}/change-role`, { role: newRole })
      setShowRole(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah peran')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/users/${showReset.id_users}/reset-password`, { password: resetPassword })
      setShowReset(null)
      setResetPassword('')
      alert('Password berhasil direset')
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal reset password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Pengguna</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola akun pengguna di sistem Anda</p>
        </div>
        <button
          onClick={() => { setError(''); setForm({ name: '', username: '', password: '', role: 'kasir' }); setShowAdd(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>+</span> Tambah Pengguna
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pengguna berdasarkan nama atau username..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <span className="font-semibold text-gray-700 text-sm">Daftar Pengguna ({users.length})</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Nama Pengguna</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.id_users === currentUser?.id_users
                return (
                  <tr key={u.id_users} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-green-500">(Anda)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.status === 'aktif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {/* Ubah Peran */}
                        {!isSelf && (
                          <button
                            onClick={() => { setNewRole(u.role); setShowRole(u) }}
                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-purple-500 hover:bg-purple-50 border border-purple-200"
                          >
                            🔁 Ubah Peran
                          </button>
                        )}
                        {/* Aktif/Nonaktif */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggle(u.id_users)}
                            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
                              u.status === 'aktif'
                                ? 'text-red-500 hover:bg-red-50 border border-red-200'
                                : 'text-green-500 hover:bg-green-50 border border-green-200'
                            }`}
                          >
                            👤 {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                        {/* Reset Password */}
                        <button
                          onClick={() => setShowReset(u)}
                          className="text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-blue-500 hover:bg-blue-50 border border-blue-200"
                        >
                          🔄 Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada pengguna</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah Pengguna */}
      {showAdd && (
        <Modal title="Tambah Pengguna Baru" subtitle="Masukkan data pengguna yang akan ditambahkan" onClose={() => setShowAdd(false)}>
          {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
              <div className="grid grid-cols-2 gap-3">
                {['kasir', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors capitalize ${
                      form.role === r
                        ? r === 'admin' ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {r === 'admin' ? '👑 Admin' : '🧑‍💼 Kasir'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal Ubah Peran */}
      {showRole && (
        <Modal title="Ubah Peran" subtitle={`Ubah peran untuk ${showRole.name}`} onClose={() => setShowRole(null)}>
          <form onSubmit={handleChangeRole} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {['kasir', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewRole(r)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    newRole === r
                      ? r === 'admin' ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {r === 'admin' ? '👑 Admin' : '🧑‍💼 Kasir'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Peran saat ini: <span className="font-medium">{roleLabel[showRole.role]}</span>
            </p>
            <button
              type="submit"
              disabled={saving || newRole === showRole.role}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Peran'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal Reset Password */}
      {showReset && (
        <Modal title="Reset Password" subtitle={`Reset password untuk ${showReset.name}`} onClose={() => setShowReset(null)}>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan password baru"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
