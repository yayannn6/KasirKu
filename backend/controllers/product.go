package controllers

import (
	"net/http"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
)

type ProductInput struct {
	Name      string `json:"name" binding:"required"`
	BuyPrice  int64  `json:"buy_price"`
	SellPrice int64  `json:"sell_price"`
	Stock     int    `json:"stock"`
	Category  string `json:"category"`
}

// GetProducts — hanya tampilkan produk aktif (soft delete otomatis difilter GORM)
func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB

	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR category LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Query param ?include_deleted=true khusus untuk admin melihat produk arsip
	if c.Query("include_deleted") == "true" {
		query = query.Unscoped()
	}

	// Kasir hanya melihat produk yang stoknya > 0
	if role, exists := c.Get("role"); exists && role == "kasir" {
		query = query.Where("stock > 0")
	}

	query.Order("created_at DESC").Find(&products)
	c.JSON(http.StatusOK, gin.H{"data": products, "total": len(products)})
}

func GetProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.First(&product, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barang tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": product})
}

func CreateProduct(c *gin.Context) {
	var input ProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product := models.Product{
		Name:      input.Name,
		BuyPrice:  input.BuyPrice,
		SellPrice: input.SellPrice,
		Stock:     input.Stock,
		Category:  input.Category,
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambah barang"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Barang berhasil ditambahkan", "data": product})
}

func UpdateProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.First(&product, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	var input ProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&product).Updates(models.Product{
		Name:      input.Name,
		BuyPrice:  input.BuyPrice,
		SellPrice: input.SellPrice,
		Stock:     input.Stock,
		Category:  input.Category,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Barang berhasil diperbarui", "data": product})
}

// DeleteProduct — soft delete: tandai deleted_at, tidak benar-benar dihapus dari DB
func DeleteProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.First(&product, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	// Cek apakah produk pernah dipakai di transaksi
	var usageCount int64
	config.DB.Model(&models.TransactionItem{}).Where("id_products = ?", product.ID).Count(&usageCount)

	if usageCount > 0 {
		// Soft delete — arsipkan saja
		config.DB.Delete(&product)
		c.JSON(http.StatusOK, gin.H{
			"message": "Barang diarsipkan (pernah digunakan dalam transaksi, tidak dihapus permanen)",
			"archived": true,
		})
	} else {
		// Belum pernah dipakai — hard delete boleh
		config.DB.Unscoped().Delete(&product)
		c.JSON(http.StatusOK, gin.H{
			"message": "Barang berhasil dihapus permanen",
			"archived": false,
		})
	}
}

// RestoreProduct — pulihkan produk yang diarsipkan
func RestoreProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.Unscoped().First(&product, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	if !product.DeletedAt.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barang tidak dalam status arsip"})
		return
	}

	config.DB.Unscoped().Model(&product).Update("deleted_at", nil)
	c.JSON(http.StatusOK, gin.H{"message": "Barang berhasil dipulihkan", "data": product})
}
