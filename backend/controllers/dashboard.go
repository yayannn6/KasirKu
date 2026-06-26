package controllers

import (
	"net/http"
	"time"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
)

func GetDashboard(c *gin.Context) {
	var totalTransactions int64
	var totalRevenue int64
	var totalProducts int64
	var lowStockCount int64
	var outOfStockCount int64
	lowStockThreshold := 10

	config.DB.Model(&models.Transaction{}).Count(&totalTransactions)
	config.DB.Model(&models.Transaction{}).Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)
	config.DB.Model(&models.Product{}).Count(&totalProducts)

	// Stok menipis: 1–10 (tidak termasuk 0)
	config.DB.Model(&models.Product{}).Where("stock > 0 AND stock <= ?", lowStockThreshold).Count(&lowStockCount)
	var lowStockItems []models.Product
	config.DB.Where("stock > 0 AND stock <= ?", lowStockThreshold).Order("stock ASC").Find(&lowStockItems)

	// Stok habis: stock = 0 (tidak diarsip, tapi perlu restock)
	config.DB.Model(&models.Product{}).Where("stock = 0").Count(&outOfStockCount)
	var outOfStockItems []models.Product
	config.DB.Where("stock = 0").Order("name ASC").Find(&outOfStockItems)

	c.JSON(http.StatusOK, gin.H{
		"total_transactions":  totalTransactions,
		"total_revenue":       totalRevenue,
		"total_products":      totalProducts,
		"low_stock_count":     lowStockCount,
		"low_stock_items":     lowStockItems,
		"out_of_stock_count":  outOfStockCount,
		"out_of_stock_items":  outOfStockItems,
	})
}

func GetSalesReport(c *gin.Context) {
	period := c.Query("period")
	if period == "" {
		period = "harian"
	}

	var dateRange string
	now := time.Now()

	switch period {
	case "bulanan":
		dateRange = now.AddDate(0, -1, 0).Format("2006-01-02")
	case "mingguan":
		dateRange = now.AddDate(0, 0, -6).Format("2006-01-02")
	default: // harian
		dateRange = now.AddDate(0, 0, -6).Format("2006-01-02")
	}

	type SalesRow struct {
		Date  string `json:"date"`
		Total int64  `json:"total"`
		Count int    `json:"count"`
	}

	var rows []SalesRow
	config.DB.Model(&models.Transaction{}).
		Select("DATE(created_at) as date, SUM(total) as total, COUNT(*) as count").
		Where("DATE(created_at) >= ?", dateRange).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&rows)

	var totalTrx int64
	var totalRev int64
	for _, r := range rows {
		totalTrx += int64(r.Count)
		totalRev += r.Total
	}

	c.JSON(http.StatusOK, gin.H{
		"period":             period,
		"total_transactions": totalTrx,
		"total_revenue":      totalRev,
		"chart_data":         rows,
	})
}
