package models

import "time"

type Transaction struct {
	ID                uint              `json:"id_transactions" gorm:"primaryKey;autoIncrement;column:id_transactions"`
	TransactionNumber string            `json:"transaction_number" gorm:"unique;not null"`
	Total             int64             `json:"total" gorm:"not null"`
	PaymentMethod     string            `json:"payment_method" gorm:"type:enum('cash','qris','debit');default:'cash'"`
	PaidAmount        int64             `json:"paid_amount" gorm:"not null"`
	ChangeAmount      int64             `json:"change_amount" gorm:"default:0"`
	CashierID         *uint             `json:"id_users" gorm:"column:id_users"`
	Cashier           *User             `json:"cashier,omitempty" gorm:"foreignKey:CashierID;references:ID"`
	Items             []TransactionItem `json:"items,omitempty" gorm:"foreignKey:TransactionID;references:ID"`
	CreatedAt         time.Time         `json:"created_at"`
}

type TransactionItem struct {
	ID            uint     `json:"id_transaction_items" gorm:"primaryKey;autoIncrement;column:id_transaction_items"`
	TransactionID uint     `json:"id_transactions" gorm:"column:id_transactions;not null"`
	ProductID     *uint    `json:"id_products" gorm:"column:id_products"`
	Product       *Product `json:"product,omitempty" gorm:"foreignKey:ProductID;references:ID"`
	ProductName   string   `json:"product_name" gorm:"not null"`
	Quantity      int      `json:"quantity" gorm:"not null"`
	Price         int64    `json:"price" gorm:"not null"`
	Subtotal      int64    `json:"subtotal" gorm:"not null"`
}
