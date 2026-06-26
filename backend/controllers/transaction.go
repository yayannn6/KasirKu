package controllers

import (
	"fmt"
	"net/http"
	"time"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransactionItemInput struct {
	ProductID uint  `json:"id_products" binding:"required"`
	Quantity  int   `json:"quantity" binding:"required,min=1"`
	Price     int64 `json:"price" binding:"required"`
}

type TransactionInput struct {
	Items         []TransactionItemInput `json:"items" binding:"required,min=1"`
	PaymentMethod string                 `json:"payment_method" binding:"required"`
	PaidAmount    int64                  `json:"paid_amount" binding:"required"`
}

func generateTransactionNumber() string {
	now := time.Now()
	return fmt.Sprintf("TRX%d%02d%02d%02d%02d%02d",
		now.Year(), now.Month(), now.Day(),
		now.Hour(), now.Minute(), now.Second())
}

func CreateTransaction(c *gin.Context) {
	var input TransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	cashierID := userID.(uint)

	var total int64
	var items []models.TransactionItem
	type stockUpdate struct {
		id  uint
		qty int
	}
	var stockUpdates []stockUpdate

	for _, item := range input.Items {
		subtotal := item.Price * int64(item.Quantity)
		total += subtotal

		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Produk ID %d tidak ditemukan", item.ProductID)})
			return
		}

		if product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Stok %s tidak cukup (tersisa %d)", product.Name, product.Stock),
			})
			return
		}

		pid := item.ProductID
		items = append(items, models.TransactionItem{
			ProductID:   &pid,
			ProductName: product.Name,
			Quantity:    item.Quantity,
			Price:       item.Price,
			Subtotal:    subtotal,
		})
		stockUpdates = append(stockUpdates, stockUpdate{id: item.ProductID, qty: item.Quantity})
	}

	if input.PaidAmount < total {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah bayar kurang dari total"})
		return
	}

	trx := models.Transaction{
		TransactionNumber: generateTransactionNumber(),
		Total:             total,
		PaymentMethod:     input.PaymentMethod,
		PaidAmount:        input.PaidAmount,
		ChangeAmount:      input.PaidAmount - total,
		CashierID:         &cashierID,
		Items:             items,
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&trx).Error; err != nil {
			return err
		}
		for _, su := range stockUpdates {
			if err := tx.Model(&models.Product{}).Where("id_products = ?", su.id).
				UpdateColumn("stock", gorm.Expr("stock - ?", su.qty)).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat transaksi"})
		return
	}

	config.DB.Preload("Items").Preload("Cashier").First(&trx, trx.ID)
	c.JSON(http.StatusCreated, gin.H{"message": "Transaksi berhasil", "data": trx})
}

func GetTransactions(c *gin.Context) {
	var transactions []models.Transaction
	query := config.DB.Preload("Cashier")

	role, _ := c.Get("role")
	if role == "kasir" {
		userID, _ := c.Get("user_id")
		query = query.Where("id_users = ?", userID)
	}

	if date := c.Query("date"); date != "" {
		query = query.Where("DATE(created_at) = ?", date)
	}

	query.Order("created_at DESC").Find(&transactions)
	c.JSON(http.StatusOK, gin.H{"data": transactions, "total": len(transactions)})
}

func GetTransaction(c *gin.Context) {
	var transaction models.Transaction
	query := config.DB.Preload("Items").Preload("Cashier")

	role, _ := c.Get("role")
	if role == "kasir" {
		userID, _ := c.Get("user_id")
		query = query.Where("id_users = ?", userID)
	}

	if err := query.First(&transaction, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}
