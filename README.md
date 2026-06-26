# Kasirku — Sistem Kasirku

Aplikasi kasir berbasis web dengan React JS (frontend) + Golang Gin (backend) + MySQL.

## Struktur Folder

```
kasirku/
├── backend/          # Go + Gin REST API
├── frontend/         # React + Vite + Tailwind CSS
└── database/
    └── schema.sql    # Schema & data awal MySQL
```

## Persyaratan

- Go 1.21+
- Node.js 18+
- MySQL 8.0+

---

## 1. Setup Database

Buka MySQL dan jalankan:

```sql
source /path/to/kasirku/database/schema.sql
```

atau via terminal:

```bash
mysql -u root -p < database/schema.sql
```

---

## 2. Konfigurasi Backend

Masuk ke folder backend:

```bash
cd backend
```

Sesuaikan koneksi database di `config/database.go` atau set environment variable:

```bash
# Windows (PowerShell)
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="password_anda"
$env:DB_NAME="kasirku"
$env:JWT_SECRET="rahasia_jwt_anda"

# Linux/Mac
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=password_anda
export DB_NAME=kasirku
export JWT_SECRET=rahasia_jwt_anda
```

Install dependencies dan jalankan:

```bash
go mod tidy
go run main.go
```

Backend berjalan di: `http://localhost:8080`

Saat pertama kali jalan, akun admin dibuat otomatis:
- **Username:** admin
- **Password:** admin123

---

## 3. Setup Frontend

Masuk ke folder frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

---

## Akun Default

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |

Admin bisa menambah akun kasir melalui menu **Data Pengguna**.

---

## Fitur

### Admin
- Dashboard (statistik total transaksi, pendapatan, stok menipis)
- Data Barang (tambah, edit, hapus produk)
- Data Pengguna (kelola akun kasir)
- Laporan Penjualan (grafik harian/mingguan/bulanan)
- Riwayat Transaksi (semua transaksi + detail)

### Kasir
- Transaksi Penjualan (keranjang, pembayaran Cash/QRIS/Debit, kembalian)
- Riwayat Transaksi (transaksi milik sendiri)

---

## API Endpoints

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | /api/login | Public | Login |
| GET | /api/products | Auth | Daftar produk |
| POST | /api/products | Admin | Tambah produk |
| PUT | /api/products/:id | Admin | Edit produk |
| DELETE | /api/products/:id | Admin | Hapus produk |
| POST | /api/transactions | Auth | Buat transaksi |
| GET | /api/transactions | Auth | Daftar transaksi |
| GET | /api/transactions/:id | Auth | Detail transaksi |
| GET | /api/users | Admin | Daftar kasir |
| POST | /api/users | Admin | Tambah kasir |
| PUT | /api/users/:id/toggle-status | Admin | Aktif/nonaktif kasir |
| PUT | /api/users/:id/reset-password | Admin | Reset password |
| GET | /api/dashboard | Admin | Data dashboard |
| GET | /api/reports/sales | Admin | Laporan penjualan |
