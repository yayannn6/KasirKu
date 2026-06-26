-- ============================================
-- Kasirku Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS kasirku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kasirku;

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id_users   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('admin', 'kasir') DEFAULT 'kasir',
    status     ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Products
CREATE TABLE IF NOT EXISTS products (
    id_products INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    buy_price   BIGINT NOT NULL DEFAULT 0,
    sell_price  BIGINT NOT NULL DEFAULT 0,
    stock       INT NOT NULL DEFAULT 0,
    category    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME DEFAULT NULL,
    INDEX idx_products_deleted_at (deleted_at)
);

-- Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id_transactions    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(30) NOT NULL UNIQUE,
    total              BIGINT NOT NULL,
    payment_method     ENUM('cash', 'qris', 'debit') DEFAULT 'cash',
    paid_amount        BIGINT NOT NULL,
    change_amount      BIGINT NOT NULL DEFAULT 0,
    id_users           INT UNSIGNED,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_users) REFERENCES users(id_users) ON DELETE SET NULL
);

-- Tabel Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
    id_transaction_items INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_transactions      INT UNSIGNED NOT NULL,
    id_products          INT UNSIGNED,
    product_name         VARCHAR(100) NOT NULL,
    quantity             INT NOT NULL,
    price                BIGINT NOT NULL,
    subtotal             BIGINT NOT NULL,
    FOREIGN KEY (id_transactions) REFERENCES transactions(id_transactions) ON DELETE CASCADE,
    FOREIGN KEY (id_products)     REFERENCES products(id_products) ON DELETE SET NULL
);

-- ============================================
-- Data Awal (Seed)
-- ============================================

-- Contoh produk
INSERT INTO products (name, buy_price, sell_price, stock, category) VALUES
('Mie Instan Goreng',    2500,  3000,  50,  'Makanan'),
('Air Mineral 600ml',    2000,  3000,  80,  'Minuman'),
('Sabun Mandi',          5000,  7000,  30,  'Kebutuhan'),
('Rokok Sampoerna Mild', 25000, 28000, 60,  'Rokok'),
('Kopi Kapal Api',       1500,  2000,  100, 'Minuman'),
('Gula Pasir 1kg',       12000, 15000, 25,  'Bahan Pokok'),
('Tissue Paseo',         8000,  10000, 40,  'Kebutuhan'),
('Susu Ultra 200ml',     3500,  5000,  35,  'Minuman');
