package controllers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
)

type ProductInput struct {
	Code      string `json:"code"`
	Name      string `json:"name" binding:"required"`
	BuyPrice  int64  `json:"buy_price"`
	SellPrice int64  `json:"sell_price"`
	Stock     int    `json:"stock"`
	Category  string `json:"category"`
}

// generateProductCode membuat kode unik BRG-XXX berdasarkan jumlah produk (termasuk arsip)
func generateProductCode() string {
	var count int64
	config.DB.Unscoped().Model(&models.Product{}).Count(&count)
	for {
		code := fmt.Sprintf("BRG-%03d", count+1)
		var existing models.Product
		if err := config.DB.Unscoped().Where("code = ?", code).First(&existing).Error; err != nil {
			return code // kode belum dipakai
		}
		count++
	}
}

func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB

	// Search: nama atau kode produk
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Admin bisa lihat arsip
	if c.Query("include_deleted") == "true" {
		query = query.Unscoped()
	}

	// Kasir hanya lihat produk stok > 0
	if role, exists := c.Get("role"); exists && role == "kasir" {
		query = query.Where("stock > 0")
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Product{}).Count(&total)

	query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&products)

	c.JSON(http.StatusOK, gin.H{
		"data":        products,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": int(math.Ceil(float64(total) / float64(limit))),
	})
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

	// Auto-generate kode jika kosong
	code := input.Code
	if code == "" {
		code = generateProductCode()
	} else {
		// Cek duplikat kode manual
		var existing models.Product
		if err := config.DB.Unscoped().Where("code = ?", code).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode produk sudah digunakan"})
			return
		}
	}

	product := models.Product{
		Code:      code,
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

	// Validasi kode jika diubah
	newCode := input.Code
	if newCode == "" {
		newCode = product.Code // tetap pakai kode lama
	} else if newCode != product.Code {
		var existing models.Product
		if err := config.DB.Unscoped().Where("code = ? AND id_products != ?", newCode, product.ID).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode produk sudah digunakan"})
			return
		}
	}

	config.DB.Model(&product).Updates(models.Product{
		Code:      newCode,
		Name:      input.Name,
		BuyPrice:  input.BuyPrice,
		SellPrice: input.SellPrice,
		Stock:     input.Stock,
		Category:  input.Category,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Barang berhasil diperbarui", "data": product})
}

func DeleteProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.First(&product, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	var usageCount int64
	config.DB.Model(&models.TransactionItem{}).Where("id_products = ?", product.ID).Count(&usageCount)

	if usageCount > 0 {
		config.DB.Delete(&product)
		c.JSON(http.StatusOK, gin.H{
			"message":  "Barang diarsipkan (pernah digunakan dalam transaksi)",
			"archived": true,
		})
	} else {
		config.DB.Unscoped().Delete(&product)
		c.JSON(http.StatusOK, gin.H{
			"message":  "Barang berhasil dihapus permanen",
			"archived": false,
		})
	}
}

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
