package models

import "time"

type User struct {
	ID        uint      `json:"id_users" gorm:"primaryKey;autoIncrement;column:id_users"`
	Name      string    `json:"name" gorm:"not null"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Role      string    `json:"role" gorm:"type:enum('admin','kasir');default:'kasir'"`
	Status    string    `json:"status" gorm:"type:enum('aktif','nonaktif');default:'aktif'"`
	CreatedAt time.Time `json:"created_at"`
}
