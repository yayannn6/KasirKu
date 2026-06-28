package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID        uint           `json:"id_products" gorm:"primaryKey;autoIncrement;column:id_products"`
	Code      string         `json:"code" gorm:"uniqueIndex;not null;column:code"`
	Name      string         `json:"name" gorm:"not null"`
	BuyPrice  int64          `json:"buy_price" gorm:"not null;default:0"`
	SellPrice int64          `json:"sell_price" gorm:"not null;default:0"`
	Stock     int            `json:"stock" gorm:"not null;default:0"`
	Category  string         `json:"category"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}
